import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import assert from "node:assert";

// Compara WebGPU vs WebGL por (cenario, metrica) usando as N repeticoes individuais de todos os ensaios.
// Diferenca = WebGPU - WebGL. d = diferenca / sqrt((s1^2+s2^2)/2) (coerente com Welch); g = d com correcao de Hedges.
const DIRS = {
  webgl: "resultados/threejs-webgl",
  webgpu: "resultados/threejs-webgpu",
  "webgl-raw": "resultados/raw-webgl",
  "webgpu-raw": "resultados/raw-webgpu",
};
const PARES = [["webgl", "webgpu"], ["webgl-raw", "webgpu-raw"]];
const RE_ARQUIVO = /^relatorio_benchmark_(webgl-raw|webgpu-raw|webgl|webgpu)_(cenario_[a-d]|instancing_n\d+)_run(\d+)\.txt$/;

const METRICAS = [
  ["fps_medio", "rel", "Taxa de Quadros (FPS) Media: "],
  ["frame_time_medio_ms", "rel", "Tempo de Frame Medio: "],
  ["draw_calls_medio", "rel", "Draw Calls Medio: "],
  ["gpu_tempo_medio_ms", "rel", "Tempo de GPU Medio (ms): "],
  ["cpu_overhead_medio_ms", "rel", "Overhead de CPU Medio (ms): "],
  ["consumo_acumulado_j", "en", "Consumo Acumulado do Ensaio: "],
  ["potencia_media_w", "en", "Potencia Media (ponderada pelo tempo, janela de 60s): "],
  ["energia_por_frame_j", "en", "Assinatura Energetica Media por Quadro (Joules/Frame): "],
  ["frames_por_watt", "en", "Coeficiente de Eficiencia Medio (Frames por Watt): "],
  ["vram_media_mb", "en", "VRAM Media durante o Ensaio: "],
];

function numeroApos(txt, rotulo) {
  const linha = txt.split("\n").find((l) => l.startsWith(rotulo));
  const m = linha?.slice(rotulo.length).match(/-?[\d.]+/);
  return m ? Number(m[0]) : null;
}

function arquivos(dirBase) {
  const out = [];
  for (const e of readdirSync(dirBase, { withFileTypes: true })) {
    if (!e.isDirectory() || !/^ensaio\d+$/.test(e.name)) continue;
    for (const s of readdirSync(join(dirBase, e.name), { withFileTypes: true })) {
      if (!s.isDirectory()) continue;
      for (const f of readdirSync(join(dirBase, e.name, s.name))) {
        if (RE_ARQUIVO.test(f)) out.push(join(dirBase, e.name, s.name, f));
      }
    }
  }
  return out;
}

// dados[modo][rotulo][metrica] = [valores por repeticao]
const dados = {};
for (const dir of Object.values(DIRS)) {
  for (const caminho of arquivos(dir)) {
    const [, modo, rotulo, run] = caminho.split(/[\\/]/).pop().match(RE_ARQUIVO);
    const rodada = `${caminho.match(/ensaio\d+/)[0]}_run${run}`; // bloco: todas as combinacoes rodam 1x por rodada
    const rel = readFileSync(caminho, "utf-8");
    let en = "";
    try { en = readFileSync(caminho.replace(/\.txt$/, "_energia.txt"), "utf-8"); } catch {}
    const alvo = ((dados[modo] ??= {})[rotulo] ??= {});
    for (const [nome, fonte, rotuloLinha] of METRICAS) {
      const v = numeroApos(fonte === "rel" ? rel : en, rotuloLinha);
      if (Number.isFinite(v)) { (alvo[nome] ??= []).push(v); (alvo[`${nome}@r`] ??= []).push(rodada); }
    }
  }
}

const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const variancia = (a) => { const m = media(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); };

// Beta incompleta regularizada (fracao continua, Numerical Recipes) -> CDF da t de Student.
function lgamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (const ci of c) s += ci / ++y;
  return -t + Math.log(2.5066282746310005 * s / x);
}
function betaCF(a, b, x) {
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d);
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d);
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d);
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return h;
}
function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betaCF(a, b, x) / a : 1 - bt * betaCF(b, a, 1 - x) / b;
}
const pDuasCaudas = (t, df) => betai(df / 2, 0.5, df / (df + t * t));
function tCritico(df) { // t tal que P(|T|>t)=0.05, por bisseccao
  let lo = 0, hi = 100;
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; pDuasCaudas(mid, df) > 0.05 ? (lo = mid) : (hi = mid); }
  return (lo + hi) / 2;
}

// Mann-Whitney: exato (DP) sem empates; com empates, aproximacao normal com correcao de empates.
function mannWhitney(x, y) {
  const m = x.length, n = y.length;
  const todos = [...x.map((v) => [v, 0]), ...y.map((v) => [v, 1])].sort((a, b) => a[0] - b[0]);
  const ranks = new Array(todos.length);
  const grupos = [];
  let empateCruzado = false; // so empate entre os dois grupos invalida o U exato
  for (let i = 0; i < todos.length;) {
    let j = i; while (j < todos.length && todos[j][0] === todos[i][0]) j++;
    for (let k = i; k < j; k++) ranks[k] = (i + j + 1) / 2;
    if (new Set(todos.slice(i, j).map((t) => t[1])).size > 1) empateCruzado = true;
    grupos.push(j - i); i = j;
  }
  const r1 = todos.reduce((s, [, g], i) => s + (g === 0 ? ranks[i] : 0), 0);
  const u1 = r1 - m * (m + 1) / 2, u = Math.min(u1, m * n - u1);
  if (!empateCruzado) {
    const memo = new Map();
    const cont = (a, b, k) => { // formas de obter U=k com tamanhos a,b
      if (k < 0) return 0;
      if (a === 0 || b === 0) return k === 0 ? 1 : 0;
      const key = `${a},${b},${k}`;
      if (!memo.has(key)) memo.set(key, cont(a - 1, b, k - b) + cont(a, b - 1, k));
      return memo.get(key);
    };
    let acum = 0; for (let k = 0; k <= u; k++) acum += cont(m, n, k);
    const total = [...Array(m * n + 1).keys()].reduce((s, k) => s + cont(m, n, k), 0);
    return { p: Math.min(1, 2 * acum / total), metodo: "exato" };
  }
  const N = m + n, tie = grupos.reduce((s, g) => s + g ** 3 - g, 0);
  const sigma = Math.sqrt(m * n / 12 * (N + 1 - tie / (N * (N - 1))));
  const z = (Math.abs(u1 - m * n / 2) - 0.5) / sigma;
  return { p: Math.min(1, 2 * (1 - 0.5 * (1 + erf(z / Math.SQRT2)))), metodo: "normal_empates" };
}
function erf(x) { // Abramowitz-Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

function comparar(a, b) { // a = WebGL, b = WebGPU
  const n1 = a.length, n2 = b.length;
  const v1 = variancia(a), v2 = variancia(b), dif = media(b) - media(a);
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  const sp = Math.sqrt((v1 + v2) / 2), d = sp === 0 ? NaN : dif / sp;
  const tc = tCritico(df), t = dif / se;
  return {
    n1, n2, m1: media(a), m2: media(b), dif, pct: dif / media(a) * 100,
    t, df, p: pDuasCaudas(t, df), ic_lo: dif - tc * se, ic_hi: dif + tc * se,
    d, g: d * (1 - 3 / (4 * (n1 + n2) - 9)), mw: mannWhitney(a, b),
  };
}

// Brunner-Munzel studentizado, p-valor por permutacao exata (Neubert e Brunner, 2007). Aceita variancias
// diferentes e empates. A = P(X<Y) + 0.5 P(X=Y) = efeito relativo de Vargha-Delaney (A12).
function brunnerMunzel(x, y) {
  const v = [...x, ...y], N = v.length, n1 = x.length, n2 = y.length;
  assert(N <= 22, "permutacao exata so ate N=22"); // ponytail: acima disso, trocar por Monte Carlo
  const c = new Float64Array(N * N); // c[j*N+i] = 1 se v_j<v_i, 0.5 se igual
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) c[j * N + i] = v[j] < v[i] ? 1 : v[j] === v[i] ? 0.5 : 0;
  const R = Array.from({ length: N }, (_, i) => 0.5 + v.reduce((s, _, j) => s + c[j * N + i], 0));
  const estat = (g1, g2) => {
    const interno = (g, i) => 0.5 + g.reduce((s, j) => s + c[j * N + i], 0);
    const m1 = g1.reduce((s, i) => s + R[i], 0) / n1, m2 = g2.reduce((s, i) => s + R[i], 0) / n2;
    const v1 = g1.reduce((s, i) => s + (R[i] - interno(g1, i) - m1 + (n1 + 1) / 2) ** 2, 0) / (n1 - 1);
    const v2 = g2.reduce((s, i) => s + (R[i] - interno(g2, i) - m2 + (n2 + 1) / 2) ** 2, 0) / (n2 - 1);
    const num = n1 * n2 * (m2 - m1) / N, den = Math.sqrt(n1 * v1 + n2 * v2);
    return { W: den > 0 ? num / den : Math.abs(num) < 1e-12 ? 0 : Math.sign(num) * Infinity, A: (m2 - (n2 + 1) / 2) / n1 };
  };
  const obs = estat([...Array(n1).keys()], Array.from({ length: n2 }, (_, k) => n1 + k));
  let total = 0, extremos = 0;
  const g1 = [], g2 = [];
  for (let mask = 0; mask < 1 << N; mask++) {
    let bits = 0; for (let m = mask; m; m &= m - 1) bits++;
    if (bits !== n2) continue;
    g1.length = g2.length = 0;
    for (let i = 0; i < N; i++) (mask >> i & 1 ? g2 : g1).push(i);
    total++;
    if (Math.abs(estat(g1, g2).W) >= Math.abs(obs.W) - 1e-9) extremos++;
  }
  return { p: extremos / total, A: obs.A };
}

// Limiares de Vargha e Delaney (2000) para |A-0.5|: 0.06 / 0.14 / 0.21.
const magnitudeA12 = (A) => { const e = Math.abs(A - 0.5); return e < 0.06 ? "desprezivel" : e < 0.14 ? "pequeno" : e < 0.21 ? "medio" : "grande"; };

// IC por bootstrap percentil da diferenca de medias; semente fixa para reproduzir.
// ponytail: percentil subcobre com N=9 (intervalo um pouco estreito); BCa ou bootstrap-t se a banca pedir.
function mulberry32(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bootstrapIC(a, b, rng, B = 5000) {
  const reamostra = (z) => z.map(() => z[Math.floor(rng() * z.length)]);
  const difs = Array.from({ length: B }, () => media(reamostra(b)) - media(reamostra(a))).sort((p, q) => p - q);
  return [difs[Math.floor(0.025 * B)], difs[Math.ceil(0.975 * B) - 1]];
}

// Correcao de Holm (step-down) sobre uma lista de p-valores; devolve ajustados na mesma ordem.
function holm(ps) {
  const ordem = ps.map((p, i) => [p, i]).sort((u, v) => u[0] - v[0]);
  const aj = new Array(ps.length); let max = 0;
  ordem.forEach(([p, i], k) => { max = Math.max(max, Math.min(1, (ps.length - k) * p)); aj[i] = max; });
  return aj;
}

// Analise em blocos: diferenca WebGPU-WebGL dentro da mesma rodada (cada rodada roda todas as combinacoes 1x).
// Teste de inversao de sinais exato sobre a media das diferencas pareadas.
function pareado(a, ra, b, rb) {
  const mapa = new Map(ra.map((r, i) => [r, a[i]]));
  const d = rb.flatMap((r, i) => (mapa.has(r) ? [b[i] - mapa.get(r)] : []));
  const n = d.length;
  if (n < 2 || n > 20) return { n, p: NaN, maior: NaN, media: NaN };
  const obs = Math.abs(media(d));
  let ext = 0;
  for (let s = 0; s < 1 << n; s++) if (Math.abs(d.reduce((t, x, i) => t + (s >> i & 1 ? -x : x), 0) / n) >= obs - 1e-12) ext++;
  return { n, p: ext / (1 << n), maior: d.filter((x) => x > 0).length, media: media(d) };
}

// Autoteste: valores de referencia conhecidos das tabelas e propriedades exatas.
assert(Math.abs(pDuasCaudas(2.262157, 9) - 0.05) < 1e-4);
assert(Math.abs(tCritico(9) - 2.262157) < 1e-3);
assert(Math.abs(mannWhitney([1, 2, 3], [4, 5, 6]).p - 0.1) < 1e-9);
{ // separacao completa 9 vs 9: p = 2 / C(18,9); valores identicos: p = 1
  const sep = brunnerMunzel([1, 2, 3, 4, 5, 6, 7, 8, 9], [11, 12, 13, 14, 15, 16, 17, 18, 19]);
  assert(Math.abs(sep.p - 2 / 48620) < 1e-12 && sep.A === 1);
  assert(brunnerMunzel(Array(9).fill(5), Array(9).fill(5)).p === 1);
  const h = holm([0.01, 0.04, 0.03]);
  assert(Math.abs(h[0] - 0.03) < 1e-12 && Math.abs(h[1] - 0.06) < 1e-12 && Math.abs(h[2] - 0.06) < 1e-12);
  const ps = pareado([1, 2, 3, 4, 5, 6, 7, 8, 9], "abcdefghi".split(""), [2, 3, 4, 5, 6, 7, 8, 9, 10], "abcdefghi".split(""));
  assert(Math.abs(ps.p - 2 / 512) < 1e-12 && ps.maior === 9);
}

const f = (v, c = 4) => (Number.isFinite(v) ? v.toFixed(c) : "");
const exp = (v) => (Number.isFinite(v) ? v.toExponential(3) : "");
const cab = "par,cenario,metrica,n_webgl,n_webgpu,media_webgl,media_webgpu,dif,dif_pct,t,gl,p_welch,ic95_lo,ic95_hi,d_cohen,g_hedges,p_mannwhitney,metodo_mw,"
  + "p_brunner_munzel,familia,p_bm_holm,p_welch_holm,a12,cliff_delta,magnitude_a12,ic_boot_lo,ic_boot_hi,p_pareado,n_pares,pares_webgpu_maior,dif_pareada_media";
const rng = mulberry32(20260101);
const linhas = [];
for (const [gl, gpu] of PARES) {
  for (const rotulo of Object.keys(dados[gl] ?? {}).sort()) {
    for (const [metrica] of METRICAS) {
      const a = dados[gl][rotulo]?.[metrica], b = dados[gpu]?.[rotulo]?.[metrica];
      if (!a || !b || a.length < 2 || b.length < 2) continue;
      const r = comparar(a, b), bm = brunnerMunzel(a, b), pa = pareado(a, dados[gl][rotulo][`${metrica}@r`], b, dados[gpu][rotulo][`${metrica}@r`]);
      const [blo, bhi] = bootstrapIC(a, b, rng);
      const welchOk = Number.isFinite(r.t); // variancia zero nos dois grupos: Welch indefinido
      linhas.push({
        pW: welchOk ? r.p : NaN, pBM: bm.p,
        ini: [`${gpu}_vs_${gl}`, rotulo, metrica, r.n1, r.n2, f(r.m1), f(r.m2), f(r.dif), f(r.pct, 2)],
        welch: welchOk ? [f(r.t, 3), f(r.df, 2), exp(r.p), f(r.ic_lo), f(r.ic_hi), f(r.d, 3), f(r.g, 3), exp(r.mw.p), r.mw.metodo]
          : ["", "", "", "", "", "", "", "", "sem_variancia"],
        robusto: [f(bm.A, 3), f(2 * bm.A - 1, 3), magnitudeA12(bm.A), f(blo), f(bhi), exp(pa.p), pa.n, pa.maior, f(pa.media)],
      });
    }
  }
}
// Familias do Holm: por par de APIs (Three.js, RAW), separando metricas primarias (confirmatorias) das exploratorias.
// Primarias: desempenho (frame time), memoria (VRAM) e energia (J/frame e J em 60 s; este so e comparavel onde o FPS e igual).
const PRIMARIAS = new Set(["frame_time_medio_ms", "vram_media_mb", "energia_por_frame_j", "consumo_acumulado_j"]);
const familia = (l) => `${l.ini[0]}|${PRIMARIAS.has(l.ini[2]) ? "primaria" : "exploratoria"}`;
function holmPorFamilia(valor) {
  const aj = new Array(linhas.length).fill(NaN), grupos = new Map();
  linhas.forEach((l, i) => { if (Number.isFinite(valor(l))) grupos.set(familia(l), [...(grupos.get(familia(l)) ?? []), i]); });
  for (const idx of grupos.values()) holm(idx.map((i) => valor(linhas[i]))).forEach((a, k) => (aj[idx[k]] = a));
  return aj;
}
const hBM = holmPorFamilia((l) => l.pBM), hW = holmPorFamilia((l) => l.pW);
const saida = linhas.map((l, i) => [...l.ini, ...l.welch, exp(l.pBM), familia(l).split("|")[1], exp(hBM[i]), exp(hW[i]), ...l.robusto].join(","));
const destino = "resultados/conclusões/dados-gerados/estatistica_comparacao.csv";
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, [cab, ...saida].join("\n"), "utf-8");
console.log(`${linhas.length} comparacoes -> ${destino}`);
