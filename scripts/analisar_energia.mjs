#!/usr/bin/env node
// =====================================================================
// Correlaciona um relatorio_benchmark_*.txt (FPS/Frame Time, gerado pelo
// app em src/main.js ou src/main-raw-*.js) com um log de potencia da GPU
// (timestamp,watts em Hz=1, gerado por scripts/power_monitor.sh) para
// calcular a dimensao "Computacao Verde" definida na secao 3.B do
// CLAUDE.md: Joules/Frame, Frames/Watt e Consumo Acumulado (J/Wh).
//
// Uso:
//   node scripts/analisar_energia.mjs <relatorio.txt> <power_log.csv> [saida.txt]
//
// Pre-requisito: o relatorio.txt precisa conter a linha
//   "Timestamp Unix de Inicio do Ensaio (ms): <epoch>"
// que main.js / main-raw-webgl.js / main-raw-webgpu.js passaram a
// exportar automaticamente. Relatorios antigos (antes dessa mudanca) nao
// tem essa linha e nao podem ser correlacionados retroativamente — o
// ensaio precisa ser refeito com o power_monitor.sh rodando em paralelo.
// =====================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

const DURACAO_ENSAIO_S = 60; // Regra 4 do CLAUDE.md: duration = 60000 ms

function erroFatal(msg) {
  console.error(`[analisar_energia] ${msg}`);
  process.exit(1);
}

const [, , caminhoRelatorio, caminhoPowerLog, caminhoSaidaArg] = process.argv;

if (!caminhoRelatorio || !caminhoPowerLog) {
  erroFatal(
    "Uso: node scripts/analisar_energia.mjs <relatorio.txt> <power_log.csv> [saida.txt]"
  );
}

// ---------------------------------------------------------------------
// 1. Parse do relatorio_benchmark_*.txt
// ---------------------------------------------------------------------
function parseRelatorio(caminho) {
  const texto = readFileSync(caminho, "utf-8");
  const linhas = texto.split(/\r?\n/);

  const meta = {};
  const campos = {
    "API de Renderizacao": "api",
    "Cenario": "cenario",
    "Timestamp Unix de Inicio do Ensaio (ms)": "autoStartEpochMs",
  };

  let indiceCabecalhoCSV = -1;
  linhas.forEach((linha, i) => {
    for (const [rotulo, chave] of Object.entries(campos)) {
      if (linha.startsWith(rotulo + ":")) {
        meta[chave] = linha.split(":").slice(1).join(":").trim();
      }
    }
    if (linha.startsWith("Tempo Decorrido (ms)")) indiceCabecalhoCSV = i;
  });

  if (!meta.autoStartEpochMs || Number(meta.autoStartEpochMs) === 0) {
    erroFatal(
      `"${caminho}" nao contem "Timestamp Unix de Inicio do Ensaio (ms)" valido.\n` +
      "Esse relatorio foi gerado antes da instrumentacao de energia, ou o " +
      "app nao foi atualizado. Refaca o ensaio com a versao atual de main.js."
    );
  }
  if (indiceCabecalhoCSV === -1) {
    erroFatal(`"${caminho}" nao contem a secao "--- DADOS BRUTOS QUADRO A QUADRO ---".`);
  }

  const colunas = linhas[indiceCabecalhoCSV].split(",").map((c) => c.trim());
  const idx = {
    tempo: colunas.findIndex((c) => c.startsWith("Tempo Decorrido")),
    fps: colunas.findIndex((c) => c.startsWith("FPS Instantaneo")),
    frameTime: colunas.findIndex((c) => c.startsWith("Tempo de Frame")),
  };

  const frames = [];
  for (let i = indiceCabecalhoCSV + 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    const partes = linha.split(",");
    if (partes.length < 3) continue;
    frames.push({
      tempoDecorridoMs: Number(partes[idx.tempo]),
      fps: Number(partes[idx.fps]),
      frameTimeMs: Number(partes[idx.frameTime]),
    });
  }

  if (frames.length === 0) erroFatal(`Nenhum frame valido encontrado em "${caminho}".`);

  return {
    api: meta.api || "DESCONHECIDA",
    cenario: meta.cenario || "?",
    autoStartEpochMs: Number(meta.autoStartEpochMs),
    frames,
  };
}

// ---------------------------------------------------------------------
// 2. Parse do power_log.csv (scripts/power_monitor.sh: timestamp,watts)
// ---------------------------------------------------------------------
function parsePowerLog(caminho) {
  const texto = readFileSync(caminho, "utf-8");
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const amostras = [];
  for (const linha of linhas) {
    if (linha.toLowerCase().startsWith("timestamp")) continue; // cabecalho
    const [tsStr, wattsStr] = linha.split(",");
    const epochSec = Number(tsStr);
    const watts = Number(wattsStr);
    if (Number.isFinite(epochSec) && Number.isFinite(watts)) {
      amostras.push({ epochSec, watts });
    }
  }

  if (amostras.length < 2) {
    erroFatal(`"${caminho}" tem menos de 2 amostras validas de potencia.`);
  }

  amostras.sort((a, b) => a.epochSec - b.epochSec);
  return amostras;
}

// ---------------------------------------------------------------------
// 3. Interpolacao linear de potencia (W) num instante absoluto (epoch s)
//    Fora do intervalo amostrado, satura no valor da amostra mais proxima
//    (o nvidia-smi so amostra a 1 Hz; a GPU nao muda de potencia
//    instantaneamente fora da janela monitorada).
// ---------------------------------------------------------------------
function criarInterpoladorPotencia(amostras) {
  return function watts(epochSec) {
    if (epochSec <= amostras[0].epochSec) return amostras[0].watts;
    if (epochSec >= amostras[amostras.length - 1].epochSec) {
      return amostras[amostras.length - 1].watts;
    }
    // busca binaria pelo par de amostras que envolve epochSec
    let lo = 0, hi = amostras.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (amostras[mid].epochSec <= epochSec) lo = mid; else hi = mid;
    }
    const a = amostras[lo], b = amostras[hi];
    const frac = (epochSec - a.epochSec) / (b.epochSec - a.epochSec);
    return a.watts + frac * (b.watts - a.watts);
  };
}

// ---------------------------------------------------------------------
// 4. Integral trapezoidal da curva de potencia bruta dentro da janela
//    exata do ensaio [tInicio, tInicio + 60s] -> Joules (W * s = J).
//    Independe dos frames: usa so as amostras reais do nvidia-smi mais
//    os dois pontos de borda interpolados.
// ---------------------------------------------------------------------
function integrarConsumoJoules(amostras, getWatts, tInicio, tFim) {
  const pontos = [
    { epochSec: tInicio, watts: getWatts(tInicio) },
    ...amostras.filter((a) => a.epochSec > tInicio && a.epochSec < tFim),
    { epochSec: tFim, watts: getWatts(tFim) },
  ];

  let joules = 0;
  for (let i = 0; i < pontos.length - 1; i++) {
    const dt = pontos[i + 1].epochSec - pontos[i].epochSec;
    joules += 0.5 * (pontos[i].watts + pontos[i + 1].watts) * dt;
  }
  return joules;
}

// ---------------------------------------------------------------------
// Execucao principal
// ---------------------------------------------------------------------
const relatorio = parseRelatorio(caminhoRelatorio);
const amostrasPotencia = parsePowerLog(caminhoPowerLog);
const getWatts = criarInterpoladorPotencia(amostrasPotencia);

const tInicioS = relatorio.autoStartEpochMs / 1000;
const tFimS = tInicioS + DURACAO_ENSAIO_S;

if (tInicioS < amostrasPotencia[0].epochSec - 2 || tFimS > amostrasPotencia[amostrasPotencia.length - 1].epochSec + 2) {
  console.warn(
    "[analisar_energia] AVISO: a janela do ensaio ultrapassa a cobertura do " +
    "log de potencia por mais de 2s. Confirme se o power_monitor.sh estava " +
    "rodando ANTES do [SPACE] e continuou apos os 60s (COMO-TESTAR-CENARIOS.md, secao 8)."
  );
}

// --- Metricas por quadro (Joules/Frame e Frames/Watt, conforme secao 3.B do CLAUDE.md) ---
const framesComEnergia = relatorio.frames.map((f) => {
  const epochSec = tInicioS + f.tempoDecorridoMs / 1000;
  const wattsInst = getWatts(epochSec);
  const energiaFrameJ = wattsInst * (f.frameTimeMs / 1000); // E_f = P_inst * (Δt/1000)
  const framesPorWatt = wattsInst > 0 ? f.fps / wattsInst : 0;
  return { ...f, wattsInst, energiaFrameJ, framesPorWatt };
});

const n = framesComEnergia.length;
const media = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;

const potenciaMediaPorQuadro = media(framesComEnergia.map((f) => f.wattsInst));
const potenciaMinPorQuadro = Math.min(...framesComEnergia.map((f) => f.wattsInst));
const potenciaMaxPorQuadro = Math.max(...framesComEnergia.map((f) => f.wattsInst));
const energiaMediaPorQuadroJ = media(framesComEnergia.map((f) => f.energiaFrameJ));
const framesPorWattMedio = media(framesComEnergia.map((f) => f.framesPorWatt));

// --- Consumo acumulado real do ensaio: integral da curva de potencia bruta ---
const consumoAcumuladoJ = integrarConsumoJoules(amostrasPotencia, getWatts, tInicioS, tFimS);
const consumoAcumuladoWh = consumoAcumuladoJ / 3600;
const potenciaMediaJanela = consumoAcumuladoJ / DURACAO_ENSAIO_S; // media ponderada pelo tempo

// ---------------------------------------------------------------------
// Saida
// ---------------------------------------------------------------------
let out = "";
out += `=== ANALISE DE CONSUMO ENERGETICO (Green IT) ===\n`;
out += `API de Renderizacao: ${relatorio.api}\n`;
out += `Cenario: ${relatorio.cenario}\n`;
out += `Timestamp Unix de Inicio do Ensaio (ms): ${relatorio.autoStartEpochMs}\n`;
out += `Janela do Ensaio: ${DURACAO_ENSAIO_S.toFixed(2)} s\n`;
out += `Amostras de Potencia Utilizadas (nvidia-smi, 1 Hz): ${amostrasPotencia.length}\n`;
out += `\n--- CONSUMO ACUMULADO DO ENSAIO (integral da curva de potencia) ---\n`;
out += `Potencia Media (ponderada pelo tempo, janela de 60s): ${potenciaMediaJanela.toFixed(2)} W\n`;
out += `Consumo Acumulado do Ensaio: ${consumoAcumuladoJ.toFixed(2)} J (${consumoAcumuladoWh.toFixed(4)} Wh)\n`;
out += `\n--- METRICAS POR QUADRO (media sobre ${n} frames correlacionados) ---\n`;
out += `Potencia Instantanea Media: ${potenciaMediaPorQuadro.toFixed(2)} W\n`;
out += `Potencia Instantanea Minima: ${potenciaMinPorQuadro.toFixed(2)} W\n`;
out += `Potencia Instantanea Maxima: ${potenciaMaxPorQuadro.toFixed(2)} W\n`;
out += `Assinatura Energetica Media por Quadro (Joules/Frame): ${energiaMediaPorQuadroJ.toFixed(4)} J\n`;
out += `Coeficiente de Eficiencia Medio (Frames por Watt): ${framesPorWattMedio.toFixed(2)} FPS/W\n`;
out += `Total de Quadros Correlacionados: ${n} frames\n`;

out += `\n--- DADOS BRUTOS QUADRO A QUADRO (COM ENERGIA) ---\n`;
out += `Tempo Decorrido (ms),FPS Instantaneo,Tempo de Frame (ms),Potencia Instantanea (W),Energia do Quadro (J),Frames por Watt\n`;
framesComEnergia.forEach((f) => {
  out += `${f.tempoDecorridoMs.toFixed(0)},${f.fps.toFixed(1)},${f.frameTimeMs.toFixed(2)},${f.wattsInst.toFixed(2)},${f.energiaFrameJ.toFixed(4)},${f.framesPorWatt.toFixed(2)}\n`;
});

const caminhoSaida =
  caminhoSaidaArg ||
  join(dirname(caminhoRelatorio), `${basename(caminhoRelatorio, extname(caminhoRelatorio))}_energia.txt`);

writeFileSync(caminhoSaida, out, "utf-8");
console.log(`[analisar_energia] Relatorio de energia salvo em: ${caminhoSaida}`);
console.log(
  `[analisar_energia] Consumo acumulado: ${consumoAcumuladoJ.toFixed(2)} J ` +
  `(${consumoAcumuladoWh.toFixed(4)} Wh) | Potencia media: ${potenciaMediaJanela.toFixed(2)} W`
);
