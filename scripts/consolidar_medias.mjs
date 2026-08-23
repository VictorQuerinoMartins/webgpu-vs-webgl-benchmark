import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIRS = {
  webgl: "resultados/webgl",
  webgpu: "resultados/webgpu",
  "webgl-raw": "resultados/web-gl_puro",
  "webgpu-raw": "resultados/web-gpu_puro",
};

const RE_ARQUIVO = /^relatorio_benchmark_(webgl-raw|webgpu-raw|webgl|webgpu)_(cenario_[a-d]|instancing_n\d+)_run(\d+)\.txt$/;

// Cada coleta oficial (npm run coletar) fica em resultados/<modo>/ensaioN/{cenarioA..D,testeDrawCall}/.
// Varre todas as pastas ensaio* e junta as repeticoes de todas elas (ensaio nao entra na chave de agrupamento).
function listarArquivosDeRelatorio(dirBase) {
  const resultado = [];
  let entradas;
  try {
    entradas = readdirSync(dirBase, { withFileTypes: true });
  } catch {
    return resultado;
  }
  for (const entrada of entradas) {
    if (!entrada.isDirectory() || !/^ensaio\d+$/.test(entrada.name)) continue;
    const ensaioDir = join(dirBase, entrada.name);
    for (const sub of readdirSync(ensaioDir, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue;
      const subDir = join(ensaioDir, sub.name);
      for (const arquivo of readdirSync(subDir)) {
        if (RE_ARQUIVO.test(arquivo)) resultado.push(join(subDir, arquivo));
      }
    }
  }
  return resultado;
}

function numeroApos(texto, rotulo) {
  const linha = texto.split("\n").find((l) => l.startsWith(rotulo));
  if (!linha) return null;
  const m = linha.slice(rotulo.length).match(/-?[\d.]+/);
  return m ? Number(m[0]) : null;
}

function parseRelatorio(caminho) {
  const txt = readFileSync(caminho, "utf-8");
  return {
    tempoCarregamentoMs: Number(txt.match(/\(([\d.]+) ms\)/)?.[1]),
    fpsMedio: numeroApos(txt, "Taxa de Quadros (FPS) Media: "),
    fpsMinimo: numeroApos(txt, "Taxa de Quadros (FPS) Minima (Pico de Engasgo): "),
    fpsMaximo: numeroApos(txt, "Taxa de Quadros (FPS) Maxima: "),
    frameTimeMedio: numeroApos(txt, "Tempo de Frame Medio: "),
    frameTimeMaximo: numeroApos(txt, "Tempo de Frame Maximo: "),
    drawCallsMedio: numeroApos(txt, "Draw Calls Medio: "),
    drawCallsMaximo: numeroApos(txt, "Draw Calls Maximo: "),
    geometriasVram: numeroApos(txt, "Geometrias na VRAM (final): "),
    texturasVram: numeroApos(txt, "Texturas na VRAM (final): "),
    totalQuadros: numeroApos(txt, "Total de Quadros Amostrados: "),
  };
}

function parseEnergia(caminho) {
  let txt;
  try {
    txt = readFileSync(caminho, "utf-8");
  } catch {
    return {};
  }
  return {
    potenciaMediaW: numeroApos(txt, "Potencia Media (ponderada pelo tempo, janela de 60s): "),
    consumoJ: numeroApos(txt, "Consumo Acumulado do Ensaio: "),
    consumoWh: Number(txt.match(/\(([\d.]+) Wh\)/)?.[1]),
    potenciaInstMediaW: numeroApos(txt, "Potencia Instantanea Media: "),
    potenciaInstMinW: numeroApos(txt, "Potencia Instantanea Minima: "),
    potenciaInstMaxW: numeroApos(txt, "Potencia Instantanea Maxima: "),
    energiaPorFrameJ: numeroApos(txt, "Assinatura Energetica Media por Quadro (Joules/Frame): "),
    framesPorWatt: numeroApos(txt, "Coeficiente de Eficiencia Medio (Frames por Watt): "),
    vramMediaMb: numeroApos(txt, "VRAM Media durante o Ensaio: "),
    vramMinMb: numeroApos(txt, "VRAM Minima durante o Ensaio: "),
    vramMaxMb: numeroApos(txt, "VRAM Maxima durante o Ensaio: "),
    tempMediaC: numeroApos(txt, "Temperatura Media durante o Ensaio: "),
    tempMinC: numeroApos(txt, "Temperatura Minima durante o Ensaio: "),
    tempMaxC: numeroApos(txt, "Temperatura Maxima durante o Ensaio: "),
  };
}

function media(valores) {
  const validos = valores.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (validos.length === 0) return "";
  return (validos.reduce((a, b) => a + b, 0) / validos.length).toFixed(4).replace(/\.?0+$/, "");
}

const grupos = new Map();

for (const dir of Object.values(DIRS)) {
  for (const caminho of listarArquivosDeRelatorio(dir)) {
    const nome = caminho.split(/[\\/]/).pop();
    const m = nome.match(RE_ARQUIVO);
    if (!m) continue;
    const [, modoArquivo, rotulo, run] = m;
    const chave = `${modoArquivo}__${rotulo}`;
    if (!grupos.has(chave)) grupos.set(chave, { modo: modoArquivo, rotulo, runs: [] });

    const relatorio = parseRelatorio(caminho);
    const energia = parseEnergia(caminho.replace(/\.txt$/, "_energia.txt"));
    grupos.get(chave).runs.push({ run, ...relatorio, ...energia });
  }
}

const COLUNAS = [
  ["modo", (g) => g.modo],
  ["cenario", (g) => g.rotulo],
  ["repeticoes", (g) => g.runs.length],
  ["tempo_carregamento_ms", (g) => media(g.runs.map((r) => r.tempoCarregamentoMs))],
  ["fps_medio", (g) => media(g.runs.map((r) => r.fpsMedio))],
  ["fps_minimo", (g) => media(g.runs.map((r) => r.fpsMinimo))],
  ["fps_maximo", (g) => media(g.runs.map((r) => r.fpsMaximo))],
  ["frame_time_medio_ms", (g) => media(g.runs.map((r) => r.frameTimeMedio))],
  ["frame_time_maximo_ms", (g) => media(g.runs.map((r) => r.frameTimeMaximo))],
  ["draw_calls_medio", (g) => media(g.runs.map((r) => r.drawCallsMedio))],
  ["draw_calls_maximo", (g) => media(g.runs.map((r) => r.drawCallsMaximo))],
  ["geometrias_vram_final", (g) => media(g.runs.map((r) => r.geometriasVram))],
  ["texturas_vram_final", (g) => media(g.runs.map((r) => r.texturasVram))],
  ["total_quadros", (g) => media(g.runs.map((r) => r.totalQuadros))],
  ["potencia_media_w", (g) => media(g.runs.map((r) => r.potenciaMediaW))],
  ["consumo_acumulado_j", (g) => media(g.runs.map((r) => r.consumoJ))],
  ["consumo_acumulado_wh", (g) => media(g.runs.map((r) => r.consumoWh))],
  ["potencia_inst_media_w", (g) => media(g.runs.map((r) => r.potenciaInstMediaW))],
  ["potencia_inst_minima_w", (g) => media(g.runs.map((r) => r.potenciaInstMinW))],
  ["potencia_inst_maxima_w", (g) => media(g.runs.map((r) => r.potenciaInstMaxW))],
  ["energia_por_frame_j", (g) => media(g.runs.map((r) => r.energiaPorFrameJ))],
  ["frames_por_watt", (g) => media(g.runs.map((r) => r.framesPorWatt))],
  ["vram_media_mb", (g) => media(g.runs.map((r) => r.vramMediaMb))],
  ["vram_minima_mb", (g) => media(g.runs.map((r) => r.vramMinMb))],
  ["vram_maxima_mb", (g) => media(g.runs.map((r) => r.vramMaxMb))],
  ["temperatura_media_c", (g) => media(g.runs.map((r) => r.tempMediaC))],
  ["temperatura_minima_c", (g) => media(g.runs.map((r) => r.tempMinC))],
  ["temperatura_maxima_c", (g) => media(g.runs.map((r) => r.tempMaxC))],
];

const ORDEM_MODO = ["webgl", "webgpu", "webgl-raw", "webgpu-raw"];
const linhas = [...grupos.values()].sort((a, b) => {
  const dm = ORDEM_MODO.indexOf(a.modo) - ORDEM_MODO.indexOf(b.modo);
  return dm !== 0 ? dm : a.rotulo.localeCompare(b.rotulo);
});

const csv = [COLUNAS.map(([nome]) => nome).join(",")]
  .concat(linhas.map((g) => COLUNAS.map(([, fn]) => fn(g)).join(",")))
  .join("\n");

const destino = "resultados/conclusões/medias_por_teste.csv";
writeFileSync(destino, csv, "utf-8");
console.log(`Consolidado ${linhas.length} combinacoes (modo x cenario) -> ${destino}`);
const esperado = linhas.length ? Math.max(...linhas.map((g) => g.runs.length)) : 0;
linhas.forEach((g) => {
  if (g.runs.length !== esperado) console.warn(`  AVISO: ${g.modo}/${g.rotulo} tem ${g.runs.length} repeticoes, esperado ${esperado}.`);
});
