import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const ORIGEM = "resultados/conclusões/dados-gerados/medias_por_teste.csv";
const DESTINO = "resultados/conclusões/dados-gerados/tabela_medias.txt";

const ORDEM_CENARIO = ["cenario_a", "cenario_b", "cenario_c", "cenario_d", "instancing_n500", "instancing_n2000", "instancing_n5000"];
const ORDEM_MODO = ["webgl", "webgpu", "webgl-raw", "webgpu-raw"];
const ROTULO_CENARIO = { cenario_a: "A", cenario_b: "B", cenario_c: "C", cenario_d: "D", instancing_n500: "N=500", instancing_n2000: "N=2000", instancing_n5000: "N=5000" };
const ROTULO_MODO = { webgl: "WebGL", webgpu: "WebGPU", "webgl-raw": "WebGL-RAW", "webgpu-raw": "WebGPU-RAW" };

function lerCsv(caminho) {
  const [cabecalho, ...linhas] = readFileSync(caminho, "utf-8").trim().split("\n");
  const colunas = cabecalho.split(",");
  return linhas.map((l) => {
    const valores = l.split(",");
    return Object.fromEntries(colunas.map((c, i) => [c, valores[i]]));
  });
}

function num(v, casas = 2) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(casas) : "-";
}

function ordenar(linhas) {
  return [...linhas].sort((a, b) => {
    const dc = ORDEM_CENARIO.indexOf(a.cenario) - ORDEM_CENARIO.indexOf(b.cenario);
    return dc !== 0 ? dc : ORDEM_MODO.indexOf(a.modo) - ORDEM_MODO.indexOf(b.modo);
  });
}

function tabela(titulo, colunas, linhas) {
  const cabecalho = ["Cenario", "Modo", ...colunas.map(([nome]) => nome)];
  const corpo = linhas.map((l) => [
    ROTULO_CENARIO[l.cenario] ?? l.cenario,
    ROTULO_MODO[l.modo] ?? l.modo,
    ...colunas.map(([, fn]) => fn(l)),
  ]);
  const larguras = cabecalho.map((h, i) => Math.max(h.length, ...corpo.map((r) => r[i].length)));
  const linha = (cols) => cols.map((c, i) => c.padEnd(larguras[i])).join("  |  ");
  const separador = larguras.map((w) => "-".repeat(w)).join("--+--");

  let out = `${titulo}\n${"=".repeat(titulo.length)}\n\n`;
  out += linha(cabecalho) + "\n" + separador + "\n";
  out += corpo.map(linha).join("\n") + "\n";
  return out;
}

const dados = ordenar(lerCsv(ORIGEM));
const repeticoes = dados.length ? Math.max(...dados.map((l) => Number(l.repeticoes) || 0)) : 0;

const desempenho = tabela(`Tabela 1 - Dimensao de Renderizacao Computacional (media de ${repeticoes} repeticoes)`, [
  ["TTFF (ms)", (l) => num(l.tempo_carregamento_ms, 1)],
  ["FPS Medio", (l) => num(l.fps_medio, 2)],
  ["FPS Min", (l) => num(l.fps_minimo, 2)],
  ["FPS Max", (l) => num(l.fps_maximo, 2)],
  ["Frame Time Medio (ms)", (l) => num(l.frame_time_medio_ms, 2)],
  ["Frame Time Max (ms)", (l) => num(l.frame_time_maximo_ms, 2)],
  ["Draw Calls Medio", (l) => num(l.draw_calls_medio, 1)],
  ["VRAM Media (MB)", (l) => num(l.vram_media_mb, 1)],
], dados);

const greenIt = tabela(`Tabela 2 - Dimensao de Computacao Verde (Green IT) (media de ${repeticoes} repeticoes)`, [
  ["Potencia Media (W)", (l) => num(l.potencia_media_w, 2)],
  ["Energia/Quadro (J)", (l) => num(l.energia_por_frame_j, 4)],
  ["Frames/Watt", (l) => num(l.frames_por_watt, 3)],
  ["Consumo Acum. (J)", (l) => num(l.consumo_acumulado_j, 1)],
  ["Consumo Acum. (Wh)", (l) => num(l.consumo_acumulado_wh, 4)],
  ["Temp. Media (C)", (l) => num(l.temperatura_media_c, 1)],
], dados);

// Decomposicao CPU/GPU via timestamp queries (WebGPU nativo / EXT_disjoint_timer_query_webgl2)
// — adicionado 2026-08-24, ver CHANGES-LOG.md e LIMITACOES-VALIDACAO-LITERATURA.md.
const cpuGpu = tabela(`Tabela 3 - Decomposicao CPU/GPU via Timestamp Queries (media de ${repeticoes} repeticoes)`, [
  ["Frame Time Medio (ms)", (l) => num(l.frame_time_medio_ms, 2)],
  ["Tempo de GPU Medio (ms)", (l) => num(l.gpu_tempo_medio_ms, 3)],
  ["Overhead de CPU Medio (ms)", (l) => num(l.cpu_overhead_medio_ms, 3)],
  ["Overhead de CPU (%)", (l) => {
    const ft = Number(l.frame_time_medio_ms), cpu = Number(l.cpu_overhead_medio_ms);
    return Number.isFinite(ft) && Number.isFinite(cpu) && ft > 0 ? `${((cpu / ft) * 100).toFixed(1)}%` : "-";
  }],
], dados);

const cabecalhoGeral =
  `Medias por Teste - WebGL vs WebGPU (Three.js e RAW)\n` +
  `Fonte: ${ORIGEM} (${dados.length} combinacoes modo x cenario, ${repeticoes} repeticoes cada)\n\n`;

mkdirSync(dirname(DESTINO), { recursive: true });
writeFileSync(DESTINO, cabecalhoGeral + desempenho + "\n" + greenIt + "\n" + cpuGpu, "utf-8");
console.log(`Tabela gerada -> ${DESTINO}`);
