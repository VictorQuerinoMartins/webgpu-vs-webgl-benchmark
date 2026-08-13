

import { chromium } from "playwright-core";
import { mkdirSync, createWriteStream, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DURACAO_ENSAIO_MS = 60_000; // Regra 4 do CLAUDE.md — nao mude sem mudar main.js

const DEST_DIR = {
  webgl: "resultados/webgl",
  webgpu: "resultados/webgpu",
  "webgl-raw": "resultados/web-gl_puro",
  "webgpu-raw": "resultados/web-gpu_puro",
};

const URL_BUILDER = {
  webgl: (base, cenario) => `${base}/?api=webgl&cenario=${cenario}`,
  webgpu: (base, cenario) => `${base}/?api=webgpu&cenario=${cenario}`,
  "webgl-raw": (base, cenario) => `${base}/raw-webgl.html?cenario=${cenario}`,
  "webgpu-raw": (base, cenario) => `${base}/raw-webgpu.html?cenario=${cenario}`,
};

const MODOS_VALIDOS = Object.keys(DEST_DIR);
const CENARIOS_VALIDOS = ["a", "b", "c", "d"];


// CLI parsing (sem dependencias externas)
function parseArgs(argv) {
  const opts = {
    modos: MODOS_VALIDOS,
    cenarios: ["a", "b", "c"],
    repeticoes: 3,
    baseUrl: "http://localhost:5173",
    canal: "chrome",
    headless: false,
    pausaMs: 8_000,
    timeoutCarregamentoMs: 180_000,
    metricasGpu: true,
    randomizar: true,
    aquecimento: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--modos":
        opts.modos = next().split(",").map((s) => s.trim());
        break;
      case "--cenarios":
        opts.cenarios = next().split(",").map((s) => s.trim().toLowerCase());
        break;
      case "--repeticoes":
        opts.repeticoes = Number(next());
        break;
      case "--base-url":
        opts.baseUrl = next().replace(/\/$/, "");
        break;
      case "--canal":
        opts.canal = next();
        break;
      case "--headless":
        opts.headless = true;
        break;
      case "--pausa":
        opts.pausaMs = Number(next());
        break;
      case "--timeout-carregamento":
        opts.timeoutCarregamentoMs = Number(next());
        break;
      case "--sem-metricas-gpu":
        opts.metricasGpu = false;
        break;
      case "--sem-randomizar":
        opts.randomizar = false;
        break;
      case "--sem-aquecimento":
        opts.aquecimento = false;
        break;
      default:
        console.error(`[automatizar_coleta] Opcao desconhecida: ${arg}`);
        process.exit(1);
    }
  }

  for (const m of opts.modos) {
    if (!MODOS_VALIDOS.includes(m)) {
      console.error(`[automatizar_coleta] Modo invalido: "${m}". Validos: ${MODOS_VALIDOS.join(", ")}`);
      process.exit(1);
    }
  }
  for (const c of opts.cenarios) {
    if (!CENARIOS_VALIDOS.includes(c)) {
      console.error(`[automatizar_coleta] Cenario invalido: "${c}". Validos: ${CENARIOS_VALIDOS.join(", ")}`);
      process.exit(1);
    }
  }
  if (!Number.isInteger(opts.repeticoes) || opts.repeticoes < 1) {
    console.error(`[automatizar_coleta] --repeticoes precisa ser um inteiro >= 1.`);
    process.exit(1);
  }

  return opts;
}

async function checarServidor(baseUrl) {
  try {
    const resp = await fetch(baseUrl, { method: "GET" });
    if (!resp.ok && resp.status !== 404) throw new Error(`status ${resp.status}`);
  } catch (err) {
    console.error(
      `[automatizar_coleta] Nao consegui acessar ${baseUrl}.\n` +
      `Rode "npm run dev" em outro terminal antes de executar este script.\n` +
      `Detalhe: ${err.message}`
    );
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Captura de metricas de GPU (Green IT + VRAM + temperatura) — amostrador
// nativo de nvidia-smi a 1Hz, na mesma chamada le potencia (W), memoria
// de video alocada (MB) e temperatura do nucleo (°C)

const NVIDIA_SMI_QUERY = "power.draw,memory.used,temperature.gpu";

async function checarNvidiaSmi() {
  try {
    await execFileAsync("nvidia-smi", [`--query-gpu=${NVIDIA_SMI_QUERY}`, "--format=csv,noheader,nounits"]);
    return true;
  } catch {
    return false;
  }
}

function iniciarAmostradorDeGpu(caminhoCsv) {
  mkdirSync(dirname(caminhoCsv), { recursive: true });
  const stream = createWriteStream(caminhoCsv, { flags: "a" });
  stream.write("timestamp,watts,vram_mb,temp_c\n");

  const intervalId = setInterval(async () => {
    try {
      const { stdout } = await execFileAsync("nvidia-smi", [
        `--query-gpu=${NVIDIA_SMI_QUERY}`,
        "--format=csv,noheader,nounits",
      ]);
      const [watts, vramMb, tempC] = stdout.trim().split(",").map((s) => s.trim());
      const timestamp = Math.floor(Date.now() / 1000);
      stream.write(`${timestamp},${watts},${vramMb},${tempC}\n`);
    } catch (err) {
      console.error(`  [gpu-sampler] falha ao ler nvidia-smi: ${err.message}`);
    }
  }, 1000);

  return {
    caminhoCsv,
    parar: () =>
      new Promise((resolve) => {
        clearInterval(intervalId);
        stream.end(resolve);
      }),
  };
}

// Randomizacao da ordem de execucao (Fisher-Yates) — evita que deriva
// termica acumulada ao longo de um lote longo vire vies sistematico
// contra as combinacoes que calhariam de rodar por ultimo

function embaralhar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function correlacionarMetricasGpu(caminhoRelatorio, caminhoPowerLog) {
  try {
    await execFileAsync(process.execPath, ["scripts/analisar_energia.mjs", caminhoRelatorio, caminhoPowerLog]);
    console.log(`  Metricas de GPU correlacionadas -> ${caminhoRelatorio.replace(/\.txt$/, "_energia.txt")}`);
  } catch (err) {
    console.error(`  [metricas-gpu] falha ao correlacionar: ${err.stderr || err.message}`);
  }
}

// Execucao de um unico ensaio
async function rodarEnsaio(browser, { modo, cenario, run, opts, caminhoPowerLog, aquecimento = false }) {
  const url = URL_BUILDER[modo](opts.baseUrl, cenario);
  const destDir = DEST_DIR[modo];

  // Ensaio de aquecimento leva sufixo proprio (nao "_run<N>") para ficar
  // claramente fora da convencao de nomes usada pela analise oficial,
  // sem precisar deletar o arquivo (transparencia > descarte silencioso).

  const sufixo = aquecimento ? "aquecimento" : `run${run}`;
  const destPath = join(destDir, `relatorio_benchmark_${modo}_cenario_${cenario}_${sufixo}.txt`);

  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  page.on("pageerror", (err) => console.error(`  [erro de pagina] ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error(`  [console.error] ${msg.text()}`);
  });

  try {
    console.log(`  -> Navegando: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    console.log(`  -> Aguardando assets (timeout ${opts.timeoutCarregamentoMs}ms)...`);
    await page.waitForFunction(() => window.__assetsReady === true, {
      timeout: opts.timeoutCarregamentoMs,
    });

    // Pequena folga para o loop de animação estabilizar antes do [SPACE].
    await sleep(500);

    const downloadPromise = page.waitForEvent("download", {
      timeout: DURACAO_ENSAIO_MS + 30_000,
    });

    console.log(`  -> Pressionando [SPACE], aguardando ${DURACAO_ENSAIO_MS / 1000}s de ensaio...`);
    await page.keyboard.press("Space");

    const download = await downloadPromise;
    mkdirSync(destDir, { recursive: true });
    await download.saveAs(destPath);

    console.log(`  OK -> ${destPath}`);

    if (caminhoPowerLog) {
      await correlacionarMetricasGpu(destPath, caminhoPowerLog);
    }

    return { ok: true, destPath };
  } catch (err) {
    console.error(`  FALHOU: ${err.message}`);
    return { ok: false, error: err.message };
  } finally {
    await context.close();
  }
}

// Execucao principal
async function main() {
  const opts = parseArgs(process.argv.slice(2));

  console.log("[automatizar_coleta] Configuracao:");
  console.log(`  Modos: ${opts.modos.join(", ")}`);
  console.log(`  Cenarios: ${opts.cenarios.join(", ")}`);
  console.log(`  Repeticoes por combinacao: ${opts.repeticoes}`);
  console.log(`  Base URL: ${opts.baseUrl}`);
  console.log(`  Navegador: ${opts.canal} (headless: ${opts.headless})`);
  console.log(`  Aquecimento: ${opts.aquecimento ? "1 ensaio descartado antes do lote" : "desativado"}`);

  await checarServidor(opts.baseUrl);

  let amostrador = null;
  if (opts.metricasGpu) {
    const nvidiaOk = await checarNvidiaSmi();
    if (!nvidiaOk) {
      console.warn(
        "[automatizar_coleta] AVISO: nvidia-smi nao encontrado ou falhou ao executar. " +
        "Desativando captura de potencia/VRAM para este lote (use --sem-metricas-gpu " +
        "para evitar esta tentativa em maquinas sem GPU NVIDIA). Os relatorios gerados " +
        "NAO terao as metricas de Green IT nem VRAM em MB da secao 3 do CLAUDE.md."
      );
      opts.metricasGpu = false;
    } else {
      const caminhoCsv = join("resultados", "power_logs", `power_log_${Date.now()}.csv`);
      amostrador = iniciarAmostradorDeGpu(caminhoCsv);
      console.log(`  Metricas de GPU (Potencia + VRAM): ativadas — log em ${caminhoCsv} (nvidia-smi, 1 Hz)`);
    }
  }
  if (!opts.metricasGpu) {
    console.log("  Metricas de GPU (Potencia + VRAM): desativadas");
  }

  // combinacoes modo x cenario uma vez, embaralhada DENTRO da rodada —
  // nao um shuffle global das N repeticoes juntas. 

  const combosBase = [];
  for (const modo of opts.modos) {
    for (const cenario of opts.cenarios) {
      combosBase.push({ modo, cenario });
    }
  }

  const combinacoes = [];
  for (let run = 1; run <= opts.repeticoes; run++) {
    const rodada = opts.randomizar ? embaralhar(combosBase) : combosBase;
    for (const { modo, cenario } of rodada) {
      combinacoes.push({ modo, cenario, run });
    }
  }

  if (opts.randomizar) {
    const caminhoOrdem = join("resultados", "power_logs", `ordem_execucao_${Date.now()}.json`);
    mkdirSync(dirname(caminhoOrdem), { recursive: true });
    writeFileSync(caminhoOrdem, JSON.stringify(combinacoes, null, 2), "utf-8");
    console.log(`  Ordem de execucao: RANDOMIZADA EM BLOCOS (1 rodada = todas as combinacoes, embaralhada por rodada) — salva em ${caminhoOrdem}`);
  } else {
    console.log("  Ordem de execucao: sequencial (--sem-randomizar)");
  }

  console.log(`[automatizar_coleta] Total de ensaios a executar: ${combinacoes.length}`);
  console.log(
    "[automatizar_coleta] NAO toque no mouse/teclado nem minimize a janela do " +
    "navegador durante a execucao — isso afeta os resultados e pode atrapalhar " +
    "a automacao."
  );

  const browser = await chromium.launch({ channel: opts.canal, headless: opts.headless });

  const resultados = [];
  const inicioTotal = Date.now();

  try {
    if (opts.aquecimento && combinacoes.length > 0) {
      const { modo, cenario } = combinacoes[0];
      console.log(
        `\n[aquecimento] Ensaio descartado antes do lote valer (tira a GPU do ` +
        `estado frio) — modo=${modo} cenario=${cenario}`
      );
      await rodarEnsaio(browser, {
        modo,
        cenario,
        run: 0,
        opts,
        caminhoPowerLog: amostrador?.caminhoCsv,
        aquecimento: true,
      });
      console.log(`[aquecimento] Concluido. Pausa de ${opts.pausaMs}ms antes do lote oficial...`);
      await sleep(opts.pausaMs);
    }

    for (let i = 0; i < combinacoes.length; i++) {
      const { modo, cenario, run } = combinacoes[i];
      console.log(
        `\n[${i + 1}/${combinacoes.length}] modo=${modo} cenario=${cenario} run=${run}/${opts.repeticoes}`
      );
      const resultado = await rodarEnsaio(browser, {
        modo,
        cenario,
        run,
        opts,
        caminhoPowerLog: amostrador?.caminhoCsv,
      });
      resultados.push({ modo, cenario, run, ...resultado });

      if (i < combinacoes.length - 1) {
        console.log(`  Pausa de ${opts.pausaMs}ms antes do proximo ensaio...`);
        await sleep(opts.pausaMs);
      }
    }
  } finally {
    await browser.close();
    if (amostrador) {
      await amostrador.parar();
      console.log(`\n[automatizar_coleta] Log de potencia salvo em: ${amostrador.caminhoCsv}`);
    }
  }

  const sucesso = resultados.filter((r) => r.ok);
  const falha = resultados.filter((r) => !r.ok);
  const duracaoTotalMin = ((Date.now() - inicioTotal) / 60_000).toFixed(1);

  console.log(`\n[automatizar_coleta] Concluido em ${duracaoTotalMin} min.`);
  console.log(`  Sucesso: ${sucesso.length}/${resultados.length}`);
  if (falha.length > 0) {
    console.log(`  Falhas:`);
    falha.forEach((r) => console.log(`    - modo=${r.modo} cenario=${r.cenario} run=${r.run}: ${r.error}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[automatizar_coleta] Erro fatal:", err);
  process.exit(1);
});
