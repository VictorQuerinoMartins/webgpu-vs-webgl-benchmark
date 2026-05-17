import { WebGPURenderer } from 'three/webgpu';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import Stats from "stats.js";

// Configuração do Stats.js para feedback visual imediato
const stats = new Stats();
stats.showPanel(0); // FPS
document.body.appendChild(stats.dom);

// Estrutura de armazenamento da telemetria do TCC
let metricsLog = [];
let tempoCarregamentoAssets = 0;

// 1. Verificação dinâmica do parâmetro de API na URL
const urlParams = new URLSearchParams(window.location.search);
const usarWebGPU = urlParams.get('api') === 'webgpu';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// 2. Inicialização condicional do motor de renderização (WebGL vs WebGPU)
let renderer;

if (usarWebGPU) {
  renderer = new WebGPURenderer({ antialias: true });
  console.log("%c MOTOR GRÁFICO ATIVO: WebGPU", "background: #222; color: #ff55f5; padding: 5px;");
} else {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance", // Força o uso da GPU dedicada no WebGL
  });
  console.log("%c MOTOR GRÁFICO ATIVO: WebGL", "background: #222; color: #55bada; padding: 5px;");
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

if (usarWebGPU) {
  await renderer.init();
}

// 3. Log de telemetria seguro para identificação da GPU de teste
if (!usarWebGPU) {
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    const rendererName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    console.log(`%c GPU DETECTADA (WebGL): ${rendererName}`, "background: #222; color: #bada55; padding: 5px;");
  }
} else {
  console.log(`%c GPU DETECTADA (WebGPU): Interface de Hardware Nativa Ativa`, "background: #222; color: #ff55f5; padding: 5px;");
}

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
    scene.backgroundBlurriness = 0.5;
  },
);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const ASSET_PATH = "/CenarioBistroC.glb";

const startTime = performance.now();
gltfLoader.load(ASSET_PATH, (gltf) => {
  tempoCarregamentoAssets = performance.now() - startTime;
  const model = gltf.scene;

  model.traverse((node) => {
    if (node.isMesh) {
      node.material.side = THREE.DoubleSide;
      node.material.envMapIntensity = 1.2;

      const matName = node.material.name.toLowerCase();
      const isGlass = ["glass", "vitre", "window", "bottle"].some((key) =>
        matName.includes(key),
      );

      if (isGlass) {
        node.material.transparent = true;
        node.material.opacity = 0.4;
        node.material.depthWrite = false;
      } else {
        node.material.transparent = false;
        node.material.opacity = 1.0;
        node.material.depthWrite = true;
      }
    }
  });

  scene.add(model);
  console.log(
    `%c Tempo de Carregamento: ${(tempoCarregamentoAssets / 1000).toFixed(2)}s`,
    "background: #333; color: #55bada; padding: 5px;",
  );
  console.log(
    "Cenário estabilizado. Pressione ESPAÇO para iniciar o benchmark automático.",
  );
});

// Trajetória de câmara otimizada (sem colisões com a rua ou elementos decorativos internos)
const curve = new THREE.CatmullRomCurve3([
  // 1. Início limpo diretamente na rua
  new THREE.Vector3(11.0, 2.4, 14.0),
  new THREE.Vector3(8.0, 2.4, 10.0),
  new THREE.Vector3(5.0, 2.4, 6.0),
  
  // 2. Avanço fluido pela calçada de entrada
  new THREE.Vector3(2.0, 2.3, 2.1),
  new THREE.Vector3(0.0, 2.2, -1.0),
  
  // 3. Entrada centralizada pela porta principal
  new THREE.Vector3(-2.0, 2.2, -4.0),
  new THREE.Vector3(-4.5, 2.2, -6.5),
  
  // 4. Navegação pelo centro do salão (afastando da parede esquerda para não bater no mancebo)
  new THREE.Vector3(-7.0, 2.2, -7.5),
  new THREE.Vector3(-9.5, 2.2, -8.2),
  new THREE.Vector3(-12.0, 2.2, -8.5),
  
  // 5. Finalização segura com visão ampla do interior do restaurante
  new THREE.Vector3(-14.5, 2.3, -7.8),
  new THREE.Vector3(-16.0, 2.4, -6.5)
]);

const duration = 60000; // 60 segundos de trajeto controlado
const clock = new THREE.Clock();
let isAutomated = false;

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(25, 10, 25);
controls.update();

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    isAutomated = !isAutomated;
    if (isAutomated) {
      metricsLog = []; // Reseta o histórico para iniciar uma nova coleta limpa
      console.log(`--- INICIANDO BENCHMARK (${duration / 1000}s) ---`);
      clock.start();
    }
    controls.enabled = !isAutomated;
  }
});

// Função avançada para processar e baixar o relatório estatístico formatado
function exportarMetricasCSV(data) {
  if (data.length === 0) {
    console.error("Nenhum dado foi coletado para exportação.");
    return;
  }

  const totalQuadros = data.length;
  
  // Cálculos matemáticos de FPS
  const somatorioFPS = data.reduce((sum, row) => sum + row.fps, 0);
  const fpsMedio = somatorioFPS / totalQuadros;
  const fpsMinimo = Math.min(...data.map(row => row.fps));
  const fpsMaximo = Math.max(...data.map(row => row.fps));
  
  // Cálculos matemáticos de Tempo de Frame (Frame Time)
  const somatorioFrameTime = data.reduce((sum, row) => sum + row.frameTime, 0);
  const frameTimeMedio = somatorioFrameTime / totalQuadros;
  const frameTimeMaximo = Math.max(...data.map(row => row.frameTime));

  // Estrutura do arquivo de texto formatado exaustivamente para o TCC
  let conteudoTexto = "";
  conteudoTexto += `Tempo de Carregamento Inicial (Assets + Draco): ${(tempoCarregamentoAssets / 1000).toFixed(2)} segundos (${tempoCarregamentoAssets.toFixed(2)} ms)\n`;
  conteudoTexto += `Taxa de Quadros (FPS) Média: ${fpsMedio.toFixed(2)} FPS\n`;
  conteudoTexto += `Taxa de Quadros (FPS) Mínima (Pico de Engasgo): ${fpsMinimo.toFixed(2)} FPS\n`;
  conteudoTexto += `Taxa de Quadros (FPS) Máxima: ${fpsMaximo.toFixed(2)} FPS (Ocorre no exato frame zero do spawn)\n`;
  conteudoTexto += `Tempo de Frame Médio: ${frameTimeMedio.toFixed(2)} ms\n`;
  conteudoTexto += `Tempo de Frame Máximo: ${frameTimeMaximo.toFixed(2)} ms\n`;
  conteudoTexto += `Total de Quadros Amostrados: ${totalQuadros} frames\n`;
  
  // Divisor para separar o sumário dos dados brutos quadro a quadro
  conteudoTexto += "\n--- DADOS BRUTOS QUADRO A QUADRO ---\n";
  conteudoTexto += "Tempo Decorrido (ms),FPS Instantaneo,Tempo de Frame (ms)\n";

  data.forEach((row) => {
    conteudoTexto += `${row.time.toFixed(0)},${row.fps.toFixed(1)},${row.frameTime.toFixed(2)}\n`;
  });

  // Geração e disparo do download automático do arquivo .txt com nome dinâmico baseado na API ativa
  const blob = new Blob([conteudoTexto], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `relatorio_benchmark_${usarWebGPU ? 'webgpu' : 'webgl'}_cenario_b.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(
    `%c Relatório estatístico (${usarWebGPU ? 'WebGPU' : 'WebGL'}) gerado e baixado com sucesso!`,
    "background: #222; color: #55da55; padding: 5px;",
  );
}

function animate() {
  stats.begin();

  // Captura o delta exato deste frame para calcular métricas de tempo real
  const delta = clock.getDelta();

  if (isAutomated) {
    const elapsed = clock.getElapsedTime() * 1000;
    const t = Math.min(elapsed / duration, 1);

    const pos = curve.getPointAt(t);
    camera.position.copy(pos);

    const lookAtPos = curve.getPointAt(Math.min(t + 0.05, 1));
    camera.lookAt(lookAtPos);

    // Registro de métricas por quadro
    const instantFps = delta > 0 ? 1 / delta : 0;
    const frameTimeMs = delta * 1000;

    // Evita coletar o primeiro frame artificialmente distorcido pelo gatilho do teclado
    if (elapsed > 0 && instantFps < 1000) {
      metricsLog.push({
        time: elapsed,
        fps: instantFps,
        frameTime: frameTimeMs,
      });
    }

    if (t >= 1) {
      isAutomated = false;
      console.log("--- BENCHMARK FINALIZADO ---");
      exportarMetricasCSV(metricsLog);
    }
  } else {
    controls.update();
  }

  // Renderização obrigatória da cena por frame
  renderer.render(scene, camera);

  stats.end();
  
  // Mantém o laço infinito de execução ativo no navegador
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Inicialização da engine gráfica
animate();