import { WebGPURenderer } from 'three/webgpu';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import Stats from "stats.js";

// =================================================================
// CONFIGURAÇÃO E PARÂMETROS DE BENCHMARK
// =================================================================
const params = new URLSearchParams(window.location.search);
const CONFIG_API = params.get("api")?.toLowerCase() || "webgpu";
const CONFIG_CENARIO = params.get("cenario")?.toLowerCase() || "c";

if (!["webgl", "webgpu"].includes(CONFIG_API)) {
  throw new Error(`Parâmetro "api" inválido: "${CONFIG_API}".`);
}
if (!["a", "b", "c", "d"].includes(CONFIG_CENARIO)) {
  throw new Error(`Parâmetro "cenario" inválido: "${CONFIG_CENARIO}".`);
}

const usarWebGPU = CONFIG_API === 'webgpu';
const cenarioAlvo = CONFIG_CENARIO;

const caminhosCenarios = {
  a: "/CenarioBistroA.glb",
  b: "/CenarioBistroB.glb",
  c: "/CenarioBistroC.glb",
  // Cenário D: Bistro Exterior (bistro_exterior_base.glb), texturas
  // redimensionadas para 2048px + Draco — extra ao escopo original de A/B/C.
  d: "/CenarioBistroD.glb",
};

// Cenários B e C: texturas embutidas no GLB (geradas com gltf-transform resize)
// Cenário A: material cinza puro (sem texturas)
const ASSET_PATH = caminhosCenarios[cenarioAlvo];

// =================================================================
// INICIALIZAÇÃO DE CENA E RENDERIZADOR
// =================================================================
const stats = new Stats();
stats.showPanel(0); 
document.body.appendChild(stats.dom);

let metricsLog = [];
let tempoCarregamentoAssets = 0;
let autoStartEpochMs = 0;

document.title = `Benchmark | ${CONFIG_API.toUpperCase()} | Cenário ${cenarioAlvo.toUpperCase()}`;

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

// Iluminação e Ambiente
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

// =================================================================
// CARREGAMENTO DE MODELOS E INJEÇÃO DE TEXTURAS (AUTOMAÇÃO)
// =================================================================
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const startTime = performance.now();
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

    // Cenários B e C: usa as texturas embutidas no GLB diretamente, mas o
    // arquivo exporta TODOS os 132 materiais com alphaMode=BLEND (defeito
    // de exportação — até concreto e calçada vêm marcados como
    // transparentes). Isso forçava o Three.js a reordenar back-to-front a
    // cena inteira a cada frame, causando superfícies "desaparecendo"
    // conforme a câmera se move. Corrige forçando opacidade real.
    const materiais = Array.isArray(node.material) ? node.material : [node.material];
    materiais.forEach((mat) => {
      mat.transparent = false;
      mat.depthWrite = true;
      mat.needsUpdate = true;
    });
  });

  scene.add(gltf.scene);
  console.log(`%c Carregamento Concluído: ${tempoCarregamentoAssets.toFixed(2)}ms`, "color: #00ff00");
});

// =================================================================
// LÓGICA DE ANIMAÇÃO, BENCHMARK E EXPORTAÇÃO
// =================================================================
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(11.0, 2.4, 14.0), new THREE.Vector3(8.0, 2.4, 10.0),
  new THREE.Vector3(5.0, 2.4, 6.0), new THREE.Vector3(2.0, 2.3, 2.1),
  new THREE.Vector3(0.0, 2.2, -1.0), new THREE.Vector3(-2.0, 2.2, -4.0),
  new THREE.Vector3(-4.5, 2.2, -6.5), new THREE.Vector3(-7.0, 2.2, -7.5),
  new THREE.Vector3(-9.5, 2.2, -8.2), new THREE.Vector3(-12.0, 2.2, -8.5),
  new THREE.Vector3(-14.5, 2.3, -7.8), new THREE.Vector3(-16.0, 2.4, -6.5)
]);

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
  conteudoTexto += `Cenario: ${cenarioAlvo.toUpperCase()}\n`;
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

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `relatorio_benchmark_${CONFIG_API}_cenario_${cenarioAlvo}.txt`);
  
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
    const pos = curve.getPointAt(t);
    camera.position.copy(pos);
    const lookAtPos = curve.getPointAt(Math.min(t + 0.05, 1));
    camera.lookAt(lookAtPos);
    
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