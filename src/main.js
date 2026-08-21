import { WebGPURenderer } from 'three/webgpu';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import Stats from "stats.js";

const params = new URLSearchParams(window.location.search);
const CONFIG_API = params.get("api")?.toLowerCase() || "webgpu";
const CONFIG_CENARIO = params.get("cenario")?.toLowerCase() || "c";
const CONFIG_DENSIDADE_INSTANCING = parseInt(params.get("densidade") || "0", 10); //Para drawcall

if (!["webgl", "webgpu"].includes(CONFIG_API)) {
  throw new Error(`Parâmetro "api" inválido: "${CONFIG_API}".`);
}
if (![0, 500, 2000, 5000].includes(CONFIG_DENSIDADE_INSTANCING)) {
  throw new Error(`Parâmetro "densidade" inválido: "${params.get("densidade")}". Use 500, 2000 ou 5000.`);
}

const usarWebGPU = CONFIG_API === 'webgpu';
const modoInstancing = CONFIG_DENSIDADE_INSTANCING > 0;
const cenarioAlvo = CONFIG_CENARIO;

if (!modoInstancing && !["a", "b", "c", "d"].includes(CONFIG_CENARIO)) {
  throw new Error(`Parâmetro "cenario" inválido: "${CONFIG_CENARIO}".`);
}

const caminhosCenarios = {
  a: "/CenarioBistroA.glb",
  b: "/CenarioBistroB.glb",
  c: "/CenarioBistroC.glb",
  d: "/CenarioBistroD.glb",
};

const ASSET_PATH = modoInstancing ? "/objetos/vespa.glb" : caminhosCenarios[cenarioAlvo];

// Espaçamento 4m calibrado ao bounding box do vespa.glb, evita sobreposição entre cópias.
const ESPACAMENTO_GRID_INSTANCING = 4;
const ladoGridInstancing = modoInstancing ? Math.ceil(Math.cbrt(CONFIG_DENSIDADE_INSTANCING)) : 0;

function gerarPosicoesGridInstancing(n, lado, espacamento) {
  const offset = (lado - 1) / 2;
  const posicoes = [];
  for (let i = 0; i < n; i++) {
    const x = i % lado;
    const y = Math.floor(i / lado) % lado;
    const z = Math.floor(i / (lado * lado));
    posicoes.push(new THREE.Vector3(
      (x - offset) * espacamento,
      (y - offset) * espacamento,
      (z - offset) * espacamento,
    ));
  }
  return posicoes;
}

// Curva gerada por fórmula (não a do Bistro/Regra 3), dimensionada ao grid de cada densidade.
function gerarCurvaOrbitalInstancing(lado, espacamento) {
  const extensao = lado * espacamento;
  const raio = extensao * 0.9;
  const altura = extensao * 0.55;
  const NUM_PONTOS = 12;
  const pontos = [];
  for (let i = 0; i < NUM_PONTOS; i++) {
    const angulo = (i / NUM_PONTOS) * Math.PI * 2;
    pontos.push(new THREE.Vector3(Math.cos(angulo) * raio, altura, Math.sin(angulo) * raio));
  }
  return new THREE.CatmullRomCurve3(pontos); // aberta — mesmo comportamento (sem wrap) do trilho do Bistro
}

const stats = new Stats();
stats.showPanel(0); 
document.body.appendChild(stats.dom);

let metricsLog = [];
let tempoCarregamentoAssets = 0;
let autoStartEpochMs = 0;

document.title = modoInstancing
  ? `Benchmark | ${CONFIG_API.toUpperCase()} | Instancing N=${CONFIG_DENSIDADE_INSTANCING}`
  : `Benchmark | ${CONFIG_API.toUpperCase()} | Cenário ${cenarioAlvo.toUpperCase()}`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer;
if (usarWebGPU) {
  renderer = new WebGPURenderer({ antialias: true, powerPreference: "high-performance" });
} else {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

if (usarWebGPU) await renderer.init();

const rgbeLoader = new RGBELoader();
rgbeLoader.load("https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
  scene.backgroundBlurriness = 0.5;
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);


const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const startTime = performance.now();

if (modoInstancing) {
  // clone() reaproveita a mesma geometry/material — cada cópia gera draw calls reais, sem duplicar VRAM.
  gltfLoader.load(ASSET_PATH, (gltf) => {
    tempoCarregamentoAssets = performance.now() - startTime;

    const posicoes = gerarPosicoesGridInstancing(
      CONFIG_DENSIDADE_INSTANCING, ladoGridInstancing, ESPACAMENTO_GRID_INSTANCING
    );
    posicoes.forEach((pos) => {
      const copia = gltf.scene.clone();
      copia.position.copy(pos);
      scene.add(copia);
    });

    console.log(
      `%c Carregamento Concluído: ${tempoCarregamentoAssets.toFixed(2)}ms | ${CONFIG_DENSIDADE_INSTANCING} cópias da vespa`,
      "color: #00ff00"
    );
    window.__assetsReady = true;
  });
} else {
  gltfLoader.load(ASSET_PATH, (gltf) => {
    tempoCarregamentoAssets = performance.now() - startTime;

    gltf.scene.traverse((node) => {
      if (!node.isMesh || !node.material) return;

      if (cenarioAlvo === 'a') {
        // Cenário A: substitui por material cinza sem textura
        node.material = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
        node.material.needsUpdate = true;
        return;
      }

      const materiais = Array.isArray(node.material) ? node.material : [node.material];
      materiais.forEach((mat) => {
        mat.transparent = false;
        mat.depthWrite = true;
        mat.needsUpdate = true;
      });
    });

    scene.add(gltf.scene);
    console.log(`%c Carregamento Concluído: ${tempoCarregamentoAssets.toFixed(2)}ms`, "color: #00ff00");

    // Sinaliza para scripts/automatizar_coleta.mjs que os assets estão prontos para o [SPACE].
    window.__assetsReady = true;
  });
}

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(11.0, 2.4, 14.0), new THREE.Vector3(8.0, 2.4, 10.0),
  new THREE.Vector3(5.0, 2.4, 6.0), new THREE.Vector3(3.0, 2.3, 5.0),
  new THREE.Vector3(-4.0, 2.2, 2.0), new THREE.Vector3(-4.5, 2.2, -3.0),
  new THREE.Vector3(-4.5, 2.2, -6.5), new THREE.Vector3(-7.0, 2.2, -7.5),
  new THREE.Vector3(-9.5, 2.2, -8.2), new THREE.Vector3(-12.0, 2.2, -8.5),
  new THREE.Vector3(-14.5, 2.3, -7.8), new THREE.Vector3(-16.0, 2.4, -6.5)
]);

const curveAtiva = modoInstancing
  ? gerarCurvaOrbitalInstancing(ladoGridInstancing, ESPACAMENTO_GRID_INSTANCING)
  : curve;

const duration = 60000;
const clock = new THREE.Clock();
let isAutomated = false;

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(25, 10, 25);
controls.update();

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    isAutomated = !isAutomated;
    if (isAutomated) {
      metricsLog = [];
      autoStartEpochMs = Date.now();
      clock.start();
    }
    controls.enabled = !isAutomated;
  }
});

function exportarMetricasCSV(data) {
  if (data.length === 0) return;

  const totalQuadros = data.length;
  const somatorioFPS = data.reduce((sum, row) => sum + row.fps, 0);
  const fpsMedio = somatorioFPS / totalQuadros;
  const fpsMinimo = Math.min(...data.map(row => row.fps));
  const fpsMaximo = Math.max(...data.map(row => row.fps));

  const somatorioFrameTime = data.reduce((sum, row) => sum + row.frameTime, 0);
  const frameTimeMedio = somatorioFrameTime / totalQuadros;
  const frameTimeMaximo = Math.max(...data.map(row => row.frameTime));

  const drawCallsMedio = data.reduce((sum, row) => sum + row.drawCalls, 0) / totalQuadros;
  const drawCallsMaximo = Math.max(...data.map(row => row.drawCalls));
  const geometriasFinal = data[data.length - 1].geometrias;
  const texturasFinal = data[data.length - 1].texturas;

  let conteudoTexto = "";
  conteudoTexto += `API de Renderizacao: ${CONFIG_API.toUpperCase()}\n`;
  conteudoTexto += modoInstancing
    ? `Cenario: INSTANCING (N=${CONFIG_DENSIDADE_INSTANCING})\n`
    : `Cenario: ${cenarioAlvo.toUpperCase()}\n`;
  conteudoTexto += `Timestamp Unix de Inicio do Ensaio (ms): ${autoStartEpochMs}\n`;
  conteudoTexto += `Tempo de Carregamento Inicial (Assets + Draco): ${(tempoCarregamentoAssets / 1000).toFixed(2)} segundos (${tempoCarregamentoAssets.toFixed(2)} ms)\n`;
  conteudoTexto += `Taxa de Quadros (FPS) Media: ${fpsMedio.toFixed(2)} FPS\n`;
  conteudoTexto += `Taxa de Quadros (FPS) Minima (Pico de Engasgo): ${fpsMinimo.toFixed(2)} FPS\n`;
  conteudoTexto += `Taxa de Quadros (FPS) Maxima: ${fpsMaximo.toFixed(2)} FPS\n`;
  conteudoTexto += `Tempo de Frame Medio: ${frameTimeMedio.toFixed(2)} ms\n`;
  conteudoTexto += `Tempo de Frame Maximo: ${frameTimeMaximo.toFixed(2)} ms\n`;
  conteudoTexto += `Draw Calls Medio: ${drawCallsMedio.toFixed(1)}\n`;
  conteudoTexto += `Draw Calls Maximo: ${drawCallsMaximo}\n`;
  conteudoTexto += `Geometrias na VRAM (final): ${geometriasFinal}\n`;
  conteudoTexto += `Texturas na VRAM (final): ${texturasFinal}\n`;
  conteudoTexto += `Total de Quadros Amostrados: ${totalQuadros} frames\n`;

  conteudoTexto += "\n--- DADOS BRUTOS QUADRO A QUADRO ---\n";
  conteudoTexto += "Tempo Decorrido (ms),FPS Instantaneo,Tempo de Frame (ms),Draw Calls,Geometrias,Texturas\n";

  data.forEach((row) => {
    conteudoTexto += `${row.time.toFixed(0)},${row.fps.toFixed(1)},${row.frameTime.toFixed(2)},${row.drawCalls},${row.geometrias},${row.texturas}\n`;
  });

  const blob = new Blob([conteudoTexto], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const nomeArquivo = modoInstancing
    ? `relatorio_benchmark_${CONFIG_API}_instancing_n${CONFIG_DENSIDADE_INSTANCING}.txt`
    : `relatorio_benchmark_${CONFIG_API}_cenario_${cenarioAlvo}.txt`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nomeArquivo);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


function animate() {
  stats.begin();
  const delta = clock.getDelta();
  if (isAutomated) {
    const elapsed = clock.getElapsedTime() * 1000;
    const t = Math.min(elapsed / duration, 1);
    const pos = curveAtiva.getPointAt(t);
    camera.position.copy(pos);
    if (modoInstancing) {
      camera.lookAt(0, 0, 0); // órbita em torno do centro do grid
    } else {
      const lookAtPos = curveAtiva.getPointAt(Math.min(t + 0.05, 1));
      camera.lookAt(lookAtPos);
    }

    // Coleta de métricas (ignora o primeiro frame onde delta ≈ 0)
    if (delta > 0.001) {
      metricsLog.push({ time: elapsed, fps: 1/delta, frameTime: delta*1000, drawCalls: renderer.info.render.calls, geometrias: renderer.info.memory.geometries, texturas: renderer.info.memory.textures });
    }

    if (t >= 1) { isAutomated = false; exportarMetricasCSV(metricsLog); }
  } else { controls.update(); }

  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}

animate();