import * as THREE from "three";
import Stats from "stats.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

// ─── Configuração do Benchmark ───────────────────────────────────────────────
const BENCHMARK_DURACAO_MS = 30_000; // duração da coleta em milissegundos
const RENDERER_LABEL = "WebGPU";     // trocar para "WebGL" no outro teste

// 1. Configuração Básica
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100000,
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Painel de FPS (Stats)
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// 3. Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// 4. Estado da câmera orbital
let orbitCenter = new THREE.Vector3();
let orbitRadius = 1;
let orbitHeight = 1;
const orbitSpeed = 0.2; // radianos/segundo — constante para reprodutibilidade
let elapsedTime = 0;
let modelLoaded = false;

// ─── Coleta de Métricas ───────────────────────────────────────────────────────
// Estratégia: 1 registro agregado por segundo (~30 entradas para 30s de benchmark).
// Preserva variação temporal (picos, warmup, pausas de GC) sem gravar frame-a-frame.

const segundos = [];          // registros agregados, um por segundo
let janelaAtual = null;       // acumulador da janela em curso
let totalFrames = 0;

let benchmarkIniciado = false;
let benchmarkEncerrado = false;
let benchmarkInicioMs = 0;
let ttff = null; // Time to First Frame (ms)
let tLoadStart = performance.now(); // marcador de início do carregamento

function coletarFrame(deltaMs) {
  totalFrames++;
  const tRelMs = performance.now() - benchmarkInicioMs;
  const segundoAtual = Math.floor(tRelMs / 1000); // janela de 1 s

  // Inicia nova janela quando o segundo muda
  if (!janelaAtual || janelaAtual.segundo !== segundoAtual) {
    if (janelaAtual) segundos.push(_fecharJanela(janelaAtual));
    janelaAtual = {
      segundo:       segundoAtual,
      frames:        0,
      soma_ft:       0,
      max_ft:        0,
      min_ft:        Infinity,
      draw_calls:    renderer.info.render.calls,
      triangles:     renderer.info.render.triangles,
      mem_geometrias: renderer.info.memory.geometries,
      mem_texturas:   renderer.info.memory.textures,
    };
  }

  janelaAtual.frames++;
  janelaAtual.soma_ft += deltaMs;
  if (deltaMs > janelaAtual.max_ft) janelaAtual.max_ft = deltaMs;
  if (deltaMs < janelaAtual.min_ft) janelaAtual.min_ft = deltaMs;
  // Atualiza métricas de memória/draw com o valor mais recente da janela
  janelaAtual.draw_calls    = renderer.info.render.calls;
  janelaAtual.triangles     = renderer.info.render.triangles;
  janelaAtual.mem_geometrias = renderer.info.memory.geometries;
  janelaAtual.mem_texturas   = renderer.info.memory.textures;
}

function _fecharJanela(j) {
  const ft_medio = j.soma_ft / j.frames;
  return {
    t_s:                  j.segundo,
    frames_na_janela:     j.frames,
    fps_medio:            parseFloat((1000 / ft_medio).toFixed(2)),
    frame_time_medio_ms:  parseFloat(ft_medio.toFixed(3)),
    frame_time_max_ms:    parseFloat(j.max_ft.toFixed(3)),
    frame_time_min_ms:    parseFloat(j.min_ft === Infinity ? 0 : j.min_ft.toFixed(3)),
    draw_calls:           j.draw_calls,
    triangles:            j.triangles,
    mem_geometrias:       j.mem_geometrias,
    mem_texturas:         j.mem_texturas,
  };
}

function exportarMetricas() {
  // Fecha a última janela parcial
  if (janelaAtual) segundos.push(_fecharJanela(janelaAtual));

  const todosFT  = segundos.map(s => s.frame_time_medio_ms);
  const todosFPS = segundos.map(s => s.fps_medio);

  const resultado = {
    renderer:             RENDERER_LABEL,
    duracao_ms:           BENCHMARK_DURACAO_MS,
    ttff_ms:              ttff,
    total_frames:         totalFrames,
    fps_medio:            parseFloat((todosFPS.reduce((a, b) => a + b, 0) / todosFPS.length).toFixed(2)),
    frame_time_medio_ms:  parseFloat((todosFT.reduce((a, b) => a + b, 0) / todosFT.length).toFixed(3)),
    frame_time_max_ms:    parseFloat(Math.max(...segundos.map(s => s.frame_time_max_ms)).toFixed(3)),
    frame_time_min_ms:    parseFloat(Math.min(...segundos.map(s => s.frame_time_min_ms)).toFixed(3)),
    por_segundo:          segundos, // série temporal: ~30 entradas
  };

  const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `benchmark_${RENDERER_LABEL}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log(`✅ Benchmark encerrado. ${totalFrames} frames → ${segundos.length} janelas de 1s. Arquivo baixado.`);
  console.table({
    FPS_medio: resultado.fps_medio,
    FrameTime_medio_ms: resultado.frame_time_medio_ms,
    FrameTime_max_ms: resultado.frame_time_max_ms,
    TTFF_ms: resultado.ttff_ms,
  });
}

// 5. Carregando o Modelo 3D
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load(
  "/modelo.gltf",
  (gltf) => {
    ttff = parseFloat((performance.now() - tLoadStart).toFixed(3));
    console.log(`Modelo carregado. TTFF: ${ttff} ms`);

    const modelo = gltf.scene;
    scene.add(modelo);

    // Calibração automática da câmera pela bounding box do modelo
    const box = new THREE.Box3().setFromObject(modelo);
    const size = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(orbitCenter);

    const maxHorizontal = Math.max(size.x, size.z);
    orbitRadius = maxHorizontal * 1;
    orbitHeight = orbitCenter.y + size.y * 0.3;

    camera.far = orbitRadius * 10;
    camera.updateProjectionMatrix();

    console.log(`BBox: ${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)} | Raio: ${orbitRadius.toFixed(1)}`);

    modelLoaded = true;
  },
  (xhr) => {
    if (xhr.total > 0) {
      console.log(`${((xhr.loaded / xhr.total) * 100).toFixed(1)}% carregado`);
    }
  },
  (error) => {
    console.error("Erro ao carregar o modelo:", error);
  }
);

// 6. Loop de Animação
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  stats.begin();

  const now = performance.now();
  const delta = now - lastTime;
  lastTime = now;

  if (modelLoaded) {
    // Inicia o benchmark no primeiro frame com modelo carregado
    if (!benchmarkIniciado) {
      benchmarkIniciado = true;
      benchmarkInicioMs = now;
      console.log(`🎬 Benchmark iniciado (${BENCHMARK_DURACAO_MS / 1000}s)`);
    }

    // Câmera orbital determinística
    elapsedTime += delta / 1000;
    const angle = elapsedTime * orbitSpeed;
    camera.position.set(
      orbitCenter.x + Math.cos(angle) * orbitRadius,
      orbitHeight,
      orbitCenter.z + Math.sin(angle) * orbitRadius
    );
    camera.lookAt(orbitCenter);

    // Coleta métricas enquanto o benchmark estiver ativo
    if (!benchmarkEncerrado) {
      coletarFrame(delta);

      if (now - benchmarkInicioMs >= BENCHMARK_DURACAO_MS) {
        benchmarkEncerrado = true;
        exportarMetricas();
      }
    }
  } else {
    lastTime = now; // congela delta enquanto o modelo não carregou
  }

  renderer.render(scene, camera);
  stats.end();
}
animate();

// 7. Responsividade
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
