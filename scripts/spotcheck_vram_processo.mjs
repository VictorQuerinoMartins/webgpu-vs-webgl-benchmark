// Spot-check único (fora do dataset oficial): confirma se o VRAM desproporcional
// do WebGPU no eixo de instancing é real ou artefato de o nvidia-smi medir a GPU
// inteira (todos os processos) em vez de isolar o processo do Chrome sob teste.
// Compara, durante o mesmo ensaio N=5000/WebGPU:
//   (a) nvidia-smi --query-gpu=memory.used  -> GPU inteira (metodo oficial atual)
//   (b) contador Windows "GPU Process Memory\Dedicated Usage" do processo
//       --type=gpu-process do Chrome lancado por este script, filtrado pelo luid
//       da RTX 3050 -> isolado ao processo, sem ruido de outros apps.

import { chromium } from "playwright-core";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, createWriteStream } from "node:fs";
import { join } from "node:path";

const execFileAsync = promisify(execFile);

const BASE_URL = "http://localhost:5173";
const DURACAO_ENSAIO_MS = 60_000;
const CENARIO = "n5000";
const URL_TESTE = `${BASE_URL}/?api=webgpu&densidade=5000`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function lerVramTotalNvidiaSmi() {
  const { stdout } = await execFileAsync("nvidia-smi", [
    "--query-gpu=memory.used",
    "--format=csv,noheader,nounits",
  ]);
  return Number(stdout.trim());
}

// Descobre o luid do adaptador com maior uso dedicado agora (heuristica: e a
// dGPU ativa). Validado manualmente antes deste script: luid da RTX 3050 bateu
// com o total do nvidia-smi (~420MB) entre os 3 luids listados no notebook.
async function descobrirLuidDgpu() {
  const ps = [
    "$s = (Get-Counter '\\GPU Adapter Memory(*)\\Dedicated Usage').CounterSamples",
    "$top = $s | Sort-Object CookedValue -Descending | Select-Object -First 1",
    "$top.InstanceName -replace '_phys_0$',''",
  ].join("; ");
  const { stdout } = await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps]);
  return stdout.trim();
}

// browser.process() nao existe nesta versao de playwright-core -> identifica o
// Chrome do teste por diferenca de PIDs (snapshot antes/depois do launch), em
// vez de depender de PID principal exposto pela lib.
async function listarPidsChrome() {
  const ps = "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' } | Select-Object -ExpandProperty ProcessId";
  const { stdout } = await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps]);
  return new Set(stdout.trim().split(/\s+/).filter(Boolean).map(Number));
}

async function acharPidsGpuProcess(pidsNovos) {
  if (pidsNovos.length === 0) return [];
  const ps = [
    `$novos = @(${pidsNovos.join(",")})`,
    "$todos = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $novos -contains $_.ProcessId }",
    "$todos | Where-Object { $_.CommandLine -like '*--type=gpu-process*' } | Select-Object -ExpandProperty ProcessId",
  ].join("; ");
  const { stdout } = await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps]);
  return stdout.trim().split(/\s+/).filter(Boolean).map(Number);
}

async function lerVramProcessos(pids, luid) {
  if (pids.length === 0) return 0;
  const instancias = pids.map((pid) => `pid_${pid}_${luid}_phys_0`);
  const ps = [
    "$s = (Get-Counter '\\GPU Process Memory(*)\\Dedicated Usage').CounterSamples",
    `$alvo = @(${instancias.map((i) => `'${i}'`).join(",")})`,
    "($s | Where-Object { $alvo -contains $_.InstanceName } | Measure-Object -Property CookedValue -Sum).Sum",
  ].join("; ");
  const { stdout } = await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps]);
  const v = Number(stdout.trim());
  return Number.isFinite(v) ? v : 0;
}

async function main() {
  console.log("[spotcheck] Descobrindo luid da dGPU (RTX 3050)...");
  const luid = await descobrirLuidDgpu();
  console.log(`  luid = ${luid}`);

  const pidsAntes = await listarPidsChrome();
  console.log(`[spotcheck] chrome.exe rodando antes do launch: ${pidsAntes.size}`);

  console.log("[spotcheck] Lancando Chrome (mesmo canal/flags do coletor oficial)...");
  const browser = await chromium.launch({ channel: "chrome", headless: false });

  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  const destDir = join("resultados", "spotcheck_vram");
  mkdirSync(destDir, { recursive: true });
  const caminhoCsv = join(destDir, `spotcheck_${Date.now()}.csv`);
  const stream = createWriteStream(caminhoCsv);
  stream.write("t_s,nvidia_smi_total_mb,chrome_gpu_process_mb,pids_gpu_process\n");

  try {
    console.log(`[spotcheck] Navegando: ${URL_TESTE}`);
    await page.goto(URL_TESTE, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__assetsReady === true, { timeout: 180_000 });
    await sleep(500);

    // Da tempo do processo --type=gpu-process aparecer antes de comecar a amostrar.
    await sleep(1000);
    const pidsDepois = await listarPidsChrome();
    const pidsNovos = [...pidsDepois].filter((p) => !pidsAntes.has(p));
    console.log(`  PIDs chrome.exe novos (desta instancia): ${pidsNovos.join(", ") || "NENHUM"}`);
    const pidsGpu = await acharPidsGpuProcess(pidsNovos);
    console.log(`  PID(s) do processo --type=gpu-process encontrados: ${pidsGpu.join(", ") || "NENHUM"}`);
    if (pidsGpu.length === 0) {
      console.warn("  [spotcheck] AVISO: nao achei o processo gpu-process do Chrome. " +
        "A leitura isolada vai ficar zerada — resultado nao sera conclusivo.");
    }

    console.log(`[spotcheck] Pressionando [SPACE], amostrando por ${DURACAO_ENSAIO_MS / 1000}s...`);
    await page.keyboard.press("Space");

    const inicio = Date.now();
    while (Date.now() - inicio < DURACAO_ENSAIO_MS) {
      const [total, isolado] = await Promise.all([
        lerVramTotalNvidiaSmi(),
        lerVramProcessos(pidsGpu, luid),
      ]);
      const isoladoMb = isolado / (1024 * 1024);
      const tS = ((Date.now() - inicio) / 1000).toFixed(1);
      stream.write(`${tS},${total},${isoladoMb.toFixed(1)},"${pidsGpu.join(";")}"\n`);
      console.log(`  t=${tS}s  nvidia-smi(total)=${total}MB  chrome-gpu-process(isolado)=${isoladoMb.toFixed(1)}MB`);
      await sleep(2000);
    }
  } finally {
    stream.end();
    await context.close();
    await browser.close();
  }

  console.log(`\n[spotcheck] Concluido. CSV salvo em: ${caminhoCsv}`);
}

main().catch((err) => {
  console.error("[spotcheck] Erro fatal:", err);
  process.exit(1);
});
