#!/usr/bin/env node
// =====================================================================
// Compara o PRIMEIRO e o ULTIMO ensaio de um lote — mesma combinacao
// modo+cenario, gerada via `--sentinela-termica` de automatizar_coleta.mjs
// (repete a combinacao sorteada em 1o lugar como o ultimo ensaio do lote)
// — para auditar se a elevacao de temperatura da GPU ao longo de uma
// coleta longa (~100min) influencia as metricas de desempenho e energia,
// alem da mitigacao por randomizacao em blocos ja usada por padrao
// (ver embaralhar() em automatizar_coleta.mjs).
//
// Uso:
//   node scripts/comparar_deriva_termica.mjs <relatorio_primeiro.txt> <relatorio_sentinela.txt> [saida.txt]
//
// Le tanto o relatorio_benchmark_*.txt (FPS/Frame Time/Draw Calls/GPU)
// quanto o *_energia.txt correlacionado (Potencia/VRAM/Temperatura),
// gerado por analisar_energia.mjs.
// =====================================================================

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

function erroFatal(msg) {
  console.error(`[comparar_deriva_termica] ${msg}`);
  process.exit(1);
}

const [, , caminhoPrimeiro, caminhoSentinela, caminhoSaidaArg] = process.argv;

if (!caminhoPrimeiro || !caminhoSentinela) {
  erroFatal(
    "Uso: node scripts/comparar_deriva_termica.mjs <relatorio_primeiro.txt> <relatorio_sentinela.txt> [saida.txt]"
  );
}

function caminhoEnergia(caminhoRelatorio) {
  return caminhoRelatorio.replace(/\.txt$/, "_energia.txt");
}

// Parse generico das linhas "Rotulo: valor" de cada relatorio. Os dois
// formatos-fonte (relatorio_benchmark_*.txt e *_energia.txt) tem varias
// secoes "--- Titulo ---" espalhadas pelo arquivo (nao so uma no fim), e
// os dados brutos quadro-a-quadro sao CSV sem ":" — entao basta o regex
// de "Rotulo: valor" pra nunca casar com nenhuma dessas duas coisas,
// sem precisar cortar o arquivo em um ponto fixo.
function parseCampos(caminho) {
  let texto;
  try {
    texto = readFileSync(caminho, "utf-8");
  } catch {
    erroFatal(`Nao consegui ler "${caminho}".`);
  }
  const campos = {};
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^([^:]+):\s*(.+)$/);
    if (m) campos[m[1].trim()] = m[2].trim();
  }
  return campos;
}

function numero(valorStr) {
  if (valorStr === undefined) return null;
  const m = valorStr.match(/-?[\d.]+/);
  return m ? Number(m[0]) : null;
}

const relPrimeiro = parseCampos(caminhoPrimeiro);
const relSentinela = parseCampos(caminhoSentinela);
const enePrimeiro = parseCampos(caminhoEnergia(caminhoPrimeiro));
const eneSentinela = parseCampos(caminhoEnergia(caminhoSentinela));

const apiP = relPrimeiro["API de Renderizacao"] || "?";
const cenP = relPrimeiro["Cenario"] || "?";
const apiS = relSentinela["API de Renderizacao"] || "?";
const cenS = relSentinela["Cenario"] || "?";

if (apiP !== apiS || cenP !== cenS) {
  console.warn(
    `[comparar_deriva_termica] AVISO: as duas combinacoes nao sao identicas! ` +
    `primeiro=${apiP}/${cenP} sentinela=${apiS}/${cenS}. A comparacao so faz sentido ` +
    `entre ensaios da MESMA combinacao (isso e o que --sentinela-termica garante).`
  );
}

const tsPrimeiro = numero(relPrimeiro["Timestamp Unix de Inicio do Ensaio (ms)"]);
const tsSentinela = numero(relSentinela["Timestamp Unix de Inicio do Ensaio (ms)"]);
const decorridoMin = tsPrimeiro !== null && tsSentinela !== null ? (tsSentinela - tsPrimeiro) / 60000 : null;

// { rotulo, origem: relatorio ou energia, chave exata no arquivo-fonte, unidade }
const METRICAS = [
  { rotulo: "FPS Medio", origem: "rel", chave: "Taxa de Quadros (FPS) Media", unidade: "FPS" },
  { rotulo: "FPS Minimo (engasgo)", origem: "rel", chave: "Taxa de Quadros (FPS) Minima (Pico de Engasgo)", unidade: "FPS" },
  { rotulo: "FPS Maximo", origem: "rel", chave: "Taxa de Quadros (FPS) Maxima", unidade: "FPS" },
  { rotulo: "Tempo de Frame Medio", origem: "rel", chave: "Tempo de Frame Medio", unidade: "ms" },
  { rotulo: "Tempo de Frame Maximo", origem: "rel", chave: "Tempo de Frame Maximo", unidade: "ms" },
  { rotulo: "Draw Calls Medio", origem: "rel", chave: "Draw Calls Medio", unidade: "" },
  { rotulo: "Tempo de GPU Medio", origem: "rel", chave: "Tempo de GPU Medio (ms)", unidade: "ms" },
  { rotulo: "Overhead de CPU Medio", origem: "rel", chave: "Overhead de CPU Medio (ms)", unidade: "ms" },
  { rotulo: "Potencia Instantanea Media", origem: "ene", chave: "Potencia Instantanea Media", unidade: "W" },
  { rotulo: "Consumo Acumulado do Ensaio", origem: "ene", chave: "Consumo Acumulado do Ensaio", unidade: "J" },
  { rotulo: "VRAM Media", origem: "ene", chave: "VRAM Media durante o Ensaio", unidade: "MB" },
  { rotulo: "Temperatura Media da GPU", origem: "ene", chave: "Temperatura Media durante o Ensaio", unidade: "C" },
  { rotulo: "Temperatura Minima da GPU", origem: "ene", chave: "Temperatura Minima durante o Ensaio", unidade: "C" },
  { rotulo: "Temperatura Maxima da GPU", origem: "ene", chave: "Temperatura Maxima durante o Ensaio", unidade: "C" },
  // Clock e throttling (2026-08-26): mais diretos que temperatura, que
  // satura num teto de fabrica e por isso nao revela throttling sustentado
  // por si so — ver nota em analisar_energia.mjs.
  { rotulo: "Clock de Nucleo Medio", origem: "ene", chave: "Clock de Nucleo Medio", unidade: "MHz" },
  { rotulo: "Clock de Nucleo Minimo", origem: "ene", chave: "Clock de Nucleo Minimo", unidade: "MHz" },
  { rotulo: "Tempo em Throttling Termico", origem: "ene", chave: "Tempo em Throttling Termico (SW ou HW)", unidade: "%" },
];

function formatarLinha(rotulo, vp, vs, unidade) {
  const delta = vs - vp;
  const pct = vp !== 0 ? (delta / Math.abs(vp)) * 100 : NaN;
  const sinal = delta >= 0 ? "+" : "";
  const pctStr = Number.isFinite(pct) ? `${sinal}${pct.toFixed(1)}%` : "n/d";
  return (
    rotulo.padEnd(30) +
    vp.toFixed(2).padStart(11) +
    vs.toFixed(2).padStart(11) +
    `${sinal}${delta.toFixed(2)}`.padStart(11) +
    ` ${unidade.padEnd(4)}` +
    pctStr.padStart(9)
  );
}

let tempDeltaC = null;
let clockDeltaMhz = null;
let clockPrimeiroMhz = null;
let clockSentinelaMhz = null;
let throttlePrimeiroPct = null;
let throttleSentinelaPct = null;

let out = "";
out += `=== COMPARACAO DE DERIVA TERMICA — PRIMEIRO vs. ULTIMO ENSAIO DO LOTE ===\n`;
out += `Combinacao: ${apiP} / Cenario ${cenP}\n`;
out += `Primeiro ensaio: ${caminhoPrimeiro}\n`;
out += `Ultimo ensaio (sentinela): ${caminhoSentinela}\n`;
if (decorridoMin !== null) {
  out += `Tempo decorrido entre os dois ensaios: ${decorridoMin.toFixed(1)} min\n`;
}
out += `\n${"Metrica".padEnd(30)}${"Primeiro".padStart(11)}${"Ultimo".padStart(11)}${"Delta".padStart(11)} Unid    Delta%\n`;
out += "-".repeat(85) + "\n";

for (const m of METRICAS) {
  const origemP = m.origem === "rel" ? relPrimeiro : enePrimeiro;
  const origemS = m.origem === "rel" ? relSentinela : eneSentinela;
  const vp = numero(origemP[m.chave]);
  const vs = numero(origemS[m.chave]);
  if (vp === null || vs === null) continue;
  out += formatarLinha(m.rotulo, vp, vs, m.unidade) + "\n";
  if (m.chave === "Temperatura Media durante o Ensaio") tempDeltaC = vs - vp;
  if (m.chave === "Clock de Nucleo Medio") {
    clockDeltaMhz = vs - vp;
    clockPrimeiroMhz = vp;
    clockSentinelaMhz = vs;
  }
  if (m.chave === "Tempo em Throttling Termico (SW ou HW)") {
    throttlePrimeiroPct = vp;
    throttleSentinelaPct = vs;
  }
}

out += `\n--- INTERPRETACAO ---\n`;
if (clockDeltaMhz !== null) {
  out += `Clock de nucleo: ${clockPrimeiroMhz.toFixed(0)} MHz (1o ensaio) -> ${clockSentinelaMhz.toFixed(0)} MHz (ultimo) ` +
    `(${clockDeltaMhz >= 0 ? "+" : ""}${clockDeltaMhz.toFixed(0)} MHz)\n`;
}
if (throttlePrimeiroPct !== null) {
  out += `Tempo em throttling termico: ${throttlePrimeiroPct.toFixed(1)}% (1o ensaio) -> ${throttleSentinelaPct.toFixed(1)}% (ultimo)\n`;
}
if (tempDeltaC !== null) {
  out += `Deriva de temperatura media da GPU entre o 1o e o ultimo ensaio: ${tempDeltaC >= 0 ? "+" : ""}${tempDeltaC.toFixed(1)} C\n`;
}
if (tempDeltaC !== null && clockDeltaMhz !== null && Math.abs(tempDeltaC) < 1 && clockDeltaMhz < -50) {
  out += `(a temperatura ficou quase igual, mas o clock caiu — sinal de que o sensor de\n`;
  out += `nucleo satura num teto de fabrica (~87C) e nao revela throttling sustentado\n`;
  out += `por si so; o clock e o indicador direto aqui.)\n`;
}
out += `(nao sao metricas da pesquisa em si — servem para auditar se a randomizacao\n`;
out += `em blocos ja usada na coleta foi suficiente para neutralizar vies de deriva\n`;
out += `termica, ou se as metricas de desempenho/energia acima mudaram de forma\n`;
out += `relevante entre a mesma combinacao testada fria (inicio) e quente (fim).)\n`;
if (tempDeltaC === null && clockDeltaMhz === null) {
  out += `Sem colunas de temperatura/clock em um dos dois _energia.txt — nao foi possivel calcular a deriva.\n`;
}

const apiSanitizada = apiP.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const cenarioSanitizado = cenP.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const caminhoSaida =
  caminhoSaidaArg || join("resultados", "conclusões", "dados-gerados", `deriva_termica_${apiSanitizada}_cenario-${cenarioSanitizado}_${Date.now()}.txt`);

mkdirSync(dirname(caminhoSaida), { recursive: true });
writeFileSync(caminhoSaida, out, "utf-8");

console.log(`[comparar_deriva_termica] Comparacao salva em: ${caminhoSaida}`);
if (clockDeltaMhz !== null) {
  console.log(
    `[comparar_deriva_termica] Clock: ${clockPrimeiroMhz.toFixed(0)}MHz -> ${clockSentinelaMhz.toFixed(0)}MHz ` +
    `(${clockDeltaMhz >= 0 ? "+" : ""}${clockDeltaMhz.toFixed(0)}MHz) entre o 1o e o ultimo ensaio (${apiP}/${cenP}).`
  );
}
if (tempDeltaC !== null) {
  console.log(
    `[comparar_deriva_termica] Deriva de temperatura: ${tempDeltaC >= 0 ? "+" : ""}${tempDeltaC.toFixed(1)} C ` +
    `entre o 1o e o ultimo ensaio (${apiP}/${cenP}).`
  );
}
