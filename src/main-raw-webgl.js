// Renderizador WebGL Puro — Contrapartida simétrica do WebGPU-RAW
// Three.js é usado EXCLUSIVAMENTE para descompressão Draco/GLB e decodificação
// de texturas embutidas. Toda a renderização é feita via WebGL2 (sem
// framework). Suporta os 3 cenários via "?cenario=a|b|c".

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// ================================================================
// CONFIGURAÇÃO
// ================================================================
const params = new URLSearchParams(window.location.search);
const CONFIG_API     = "webgl-raw";
const CONFIG_CENARIO = params.get("cenario")?.toLowerCase() || "a";
const DURATION_MS    = 60000;

if (!["a", "b", "c", "d"].includes(CONFIG_CENARIO)) {
  throw new Error(`Parâmetro "cenario" inválido: "${CONFIG_CENARIO}".`);
}

const caminhosCenarios = {
  a: "/CenarioBistroA.glb",
  b: "/CenarioBistroB.glb",
  c: "/CenarioBistroC.glb",
  // Cenário D: Bistro Exterior, texturas 2048px + Draco — extra ao escopo original.
  d: "/CenarioBistroD.glb",
};
const ASSET_PATH = caminhosCenarios[CONFIG_CENARIO];

document.title = `Benchmark | WEBGL-RAW | Cenário ${CONFIG_CENARIO.toUpperCase()}`;

// ================================================================
// TRILHO DA CÂMERA — idêntico ao main.js e ao main-raw-webgpu.js
// ================================================================
const WAYPOINTS = [
  [11.0, 2.4, 14.0],  [8.0, 2.4, 10.0],
  [5.0,  2.4,  6.0],  [2.0, 2.3,  2.1],
  [0.0,  2.2, -1.0],  [-2.0,  2.2, -4.0],
  [-4.5, 2.2, -6.5],  [-7.0,  2.2, -7.5],
  [-9.5, 2.2, -8.2],  [-12.0, 2.2, -8.5],
  [-14.5, 2.3, -7.8], [-16.0, 2.4, -6.5],
];

// ================================================================
// MATEMÁTICA VETORIAL E MATRICIAL
// Column-major; NDC OpenGL/WebGL com profundidade [-1, 1].
// ================================================================
const v3sub   = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const v3dot   = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const v3cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const v3norm  = (a)    => { const l = Math.hypot(...a); return l > 0 ? a.map(v => v/l) : [0,0,0]; };

function mat4Perspective(fovY, aspect, near, far) {
  const f = 1.0 / Math.tan(fovY * 0.5);
  const m = new Float32Array(16);
  m[0]  = f / aspect;
  m[5]  = f;
  m[10] = (far + near) / (near - far);   // mapeamento [-1,1] para WebGL
  m[11] = -1.0;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

function mat4LookAt(eye, center, up) {
  const f = v3norm(v3sub(center, eye));
  const s = v3norm(v3cross(f, up));
  const u = v3cross(s, f);
  const m = new Float32Array(16);
  m[0]=s[0];  m[4]=s[1];  m[8] =s[2];  m[12]=-v3dot(s, eye);
  m[1]=u[0];  m[5]=u[1];  m[9] =u[2];  m[13]=-v3dot(u, eye);
  m[2]=-f[0]; m[6]=-f[1]; m[10]=-f[2]; m[14]= v3dot(f, eye);
  m[15]=1.0;
  return m;
}

function mat4Mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[r + k*4] * b[k + c*4];
      o[r + c*4] = s;
    }
  return o;
}

// ================================================================
// INTERPOLAÇÃO CATMULL-ROM
// Reproduz THREE.CatmullRomCurve3 com closed=false.
// ================================================================
function catmullRomPoint(waypoints, t) {
  const n  = waypoints.length;
  const sc = Math.max(0, Math.min(t, 0.9999)) * (n - 1);
  const i  = Math.floor(sc);
  const lt = sc - i;
  const p0 = waypoints[Math.max(0, i - 1)];
  const p1 = waypoints[i];
  const p2 = waypoints[Math.min(n - 1, i + 1)];
  const p3 = waypoints[Math.min(n - 1, i + 2)];
  const t2 = lt * lt, t3 = t2 * lt;
  return [0, 1, 2].map(ax =>
    0.5 * (
      2 * p1[ax] +
      (-p0[ax] + p2[ax]) * lt +
      (2*p0[ax] - 5*p1[ax] + 4*p2[ax] - p3[ax]) * t2 +
      (-p0[ax] + 3*p1[ax] - 3*p2[ax] + p3[ax]) * t3
    )
  );
}

// ================================================================
// SHADERS GLSL ES 3.00 (WebGL2)
// Textura de cor base (uTex). Cenário A / materiais sem mapa usam um
// placeholder cinza 1x1, mantendo um único pipeline para os 3 cenários.
// ================================================================
const VERT_SRC = `#version 300 es
precision highp float;

uniform mat4 uViewProj;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aUV;

out vec3 vNormal;
out vec2 vUV;

void main() {
  gl_Position = uViewProj * vec4(aPosition, 1.0);
  vNormal = aNormal;
  vUV = aUV;
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D uTex;

in vec3 vNormal;
in vec2 vUV;
out vec4 outColor;

void main() {
  vec3 light = normalize(vec3(0.5, 1.0, 0.7));
  float d = max(dot(normalize(vNormal), light), 0.0);
  vec3 texColor = texture(uTex, vUV).rgb;
  outColor = vec4(texColor * (0.3 + 0.7 * d), 1.0);
}
`;

// ================================================================
// INICIALIZAÇÃO WEBGL2 — powerPreference obrigatório (paridade com main.js)
// ================================================================
function initWebGL(canvas) {
  const gl = canvas.getContext("webgl2", { antialias: true, powerPreference: "high-performance" });
  if (!gl) throw new Error("WebGL2 não suportado neste navegador.");

  // Diagnóstico de GPU — confirma a cada execução qual GPU física o ANGLE
  // selecionou (Regra 2 do CLAUDE.md exige a dGPU, não a iGPU Intel).
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  if (dbg) {
    const vendor   = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    console.log(`%c[WEBGL-RAW] GPU selecionada → vendor="${vendor}" renderer="${renderer}"`, "color:#0ff;font-weight:bold");
  } else {
    console.warn("[WEBGL-RAW] WEBGL_debug_renderer_info indisponível — não foi possível confirmar a GPU em uso.");
  }

  return gl;
}

function createProgram(gl) {
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error("Erro ao compilar shader: " + gl.getShaderInfoLog(sh));
    }
    return sh;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.bindAttribLocation(program, 1, "aNormal");
  gl.bindAttribLocation(program, 2, "aUV");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Erro ao linkar programa: " + gl.getProgramInfoLog(program));
  }
  return program;
}

// ================================================================
// CARREGAMENTO DE ASSETS — Three.js APENAS para Draco/decodificação
// de textura. Transforma cada mesh para o espaço de mundo (bake da
// hierarquia) e devolve arrays Float32/Uint de geometria pura, mais
// um mapa de imagens de textura únicas por material.
// ================================================================
function loadAssets(path) {
  return new Promise((resolve, reject) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(path, (gltf) => {
      const meshes    = [];
      const texImages = new Map(); // texKey -> ImageBitmap | HTMLImageElement
      let skipped     = 0;

      gltf.scene.traverse((node) => {
        if (!node.isMesh || !node.geometry) return;
        node.updateWorldMatrix(true, false);

        // Bake da transform do nó + geração de normais se ausentes
        const geo = node.geometry.clone().applyMatrix4(node.matrixWorld);
        if (!geo.attributes.normal) geo.computeVertexNormals();

        // Extração via getX/getY/getZ — funciona corretamente tanto para
        // BufferAttribute quanto para InterleavedBufferAttribute. O Draco
        // decodifica posição/normal/UV em um único InterleavedBuffer
        // compartilhado por performance; ler ".array" direto retornaria o
        // buffer intercalado INTEIRO (todos os atributos misturados) em vez
        // dos valores deste atributo — era essa a causa da geometria
        // fantasma ("vidro estilhaçado").
        const posAttr = geo.attributes.position;
        const norAttr = geo.attributes.normal;
        const uvAttr  = geo.attributes.uv;
        const vCount  = posAttr.count;

        const pos = new Float32Array(vCount * 3);
        const nor = new Float32Array(vCount * 3);
        const uv  = uvAttr ? new Float32Array(vCount * 2) : null;
        for (let i = 0; i < vCount; i++) {
          pos[i*3+0] = posAttr.getX(i); pos[i*3+1] = posAttr.getY(i); pos[i*3+2] = posAttr.getZ(i);
          nor[i*3+0] = norAttr.getX(i); nor[i*3+1] = norAttr.getY(i); nor[i*3+2] = norAttr.getZ(i);
          if (uvAttr) { uv[i*2+0] = uvAttr.getX(i); uv[i*2+1] = uvAttr.getY(i); }
        }
        const raw = geo.index?.array;

        // Validação defensiva: coordenadas não-finitas (NaN/Infinity) após
        // o bake da transform — geralmente causadas por matrizes de mundo
        // singulares (escala zero em nós auxiliares/invisíveis).
        let hasNonFinite = false;
        for (let i = 0; i < pos.length; i++) {
          if (!Number.isFinite(pos[i])) { hasNonFinite = true; break; }
        }
        if (hasNonFinite) {
          skipped++;
          console.warn(`[WEBGL-RAW] Mesh "${node.name || "(sem nome)"}" descartada — posições não-finitas após bake da transform.`);
          return;
        }

        let indices, fmt;
        if (raw) {
          const is32 = raw instanceof Uint32Array;
          indices = is32 ? new Uint32Array(raw) : new Uint16Array(raw);
          fmt     = is32 ? "uint32" : "uint16";
        } else {
          // Geometria não-indexada: cria índices sequenciais
          const count = pos.length / 3;
          const is32  = count > 65535;
          indices = is32 ? new Uint32Array(count) : new Uint16Array(count);
          for (let i = 0; i < count; i++) indices[i] = i;
          fmt = is32 ? "uint32" : "uint16";
        }

        // Textura de cor base (Cenários B/C). Cenário A não tem mapa.
        const map = node.material?.map;
        let texKey = null;
        if (map && map.image) {
          texKey = map.uuid;
          if (!texImages.has(texKey)) texImages.set(texKey, map.image);
        }

        // Cenário A força material cinza DoubleSide (espelha main.js).
        // Nos Cenários B/C, respeita o "side" original do material do GLTF —
        // sem isso, faces traseiras de geometria fina (folhagem, tecido,
        // toldos) competem na profundidade com as frontais (z-fighting).
        const doubleSided = CONFIG_CENARIO === "a" || node.material?.side === THREE.DoubleSide;

        meshes.push({ pos, nor, uv, indices, fmt, texKey, doubleSided });
      });

      if (skipped > 0) {
        console.warn(`%c[WEBGL-RAW] ${skipped} mesh(es) descartada(s) por dados inválidos. ${meshes.length} válidas.`, "color:#f80");
      }
      resolve({ meshes, texImages });
    }, undefined, reject);
  });
}

// ================================================================
// UPLOAD DE GEOMETRIA PARA A GPU
// Layout de vértice intercalado: [px,py,pz, nx,ny,nz, u,v] = 32 bytes.
// Meshes sem UV (Cenário A) recebem (0,0) — irrelevante, pois usam a
// textura placeholder de 1x1.
// ================================================================
function uploadMeshes(gl, meshes) {
  // Agrupa por modo de culling para minimizar trocas de estado no loop de render.
  const ordered = [...meshes].sort((a, b) => Number(a.doubleSided) - Number(b.doubleSided));
  return ordered.map(({ pos, nor, uv, indices, fmt, texKey, doubleSided }) => {
    const vCount      = pos.length / 3;
    const interleaved = new Float32Array(vCount * 8);
    for (let i = 0; i < vCount; i++) {
      interleaved[i*8+0] = pos[i*3+0]; interleaved[i*8+1] = pos[i*3+1]; interleaved[i*8+2] = pos[i*3+2];
      interleaved[i*8+3] = nor[i*3+0]; interleaved[i*8+4] = nor[i*3+1]; interleaved[i*8+5] = nor[i*3+2];
      interleaved[i*8+6] = uv ? uv[i*2+0] : 0;
      interleaved[i*8+7] = uv ? uv[i*2+1] : 0;
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); // aPosition
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); // aNormal
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(2); // aUV
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);

    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return {
      vao,
      indexCount: indices.length,
      glType: fmt === "uint32" ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      texKey,
      doubleSided,
    };
  });
}

// ================================================================
// TEXTURAS — upload das imagens decodificadas, mais um placeholder
// cinza para meshes sem textura (Cenário A).
// ================================================================
function createGLTexture(gl, image) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

function createPlaceholderTexture(gl) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

function createTextureCache(gl, texImages) {
  const cache = new Map();
  for (const [key, image] of texImages) cache.set(key, createGLTexture(gl, image));
  return cache;
}

// ================================================================
// EXPORTAÇÃO — mesmo formato do main.js e do main-raw-webgpu.js
// ================================================================
function exportReport(data, loadTime, autoStartEpochMs) {
  if (!data.length) return;

  const n         = data.length;
  const fpsMedio  = data.reduce((s, r) => s + r.fps, 0) / n;
  const fpsMin    = Math.min(...data.map(r => r.fps));
  const fpsMax    = Math.max(...data.map(r => r.fps));
  const ftMedio   = data.reduce((s, r) => s + r.ft, 0) / n;
  const ftMax     = Math.max(...data.map(r => r.ft));
  const dcMedio   = data.reduce((s, r) => s + r.dc, 0) / n;
  const dcMax     = Math.max(...data.map(r => r.dc));

  let txt = "";
  txt += `API de Renderizacao: ${CONFIG_API.toUpperCase()}\n`;
  txt += `Cenario: ${CONFIG_CENARIO.toUpperCase()}\n`;
  txt += `Timestamp Unix de Inicio do Ensaio (ms): ${autoStartEpochMs}\n`;
  txt += `Tempo de Carregamento Inicial (Assets + Draco): ${(loadTime/1000).toFixed(2)} segundos (${loadTime.toFixed(2)} ms)\n`;
  txt += `Taxa de Quadros (FPS) Media: ${fpsMedio.toFixed(2)} FPS\n`;
  txt += `Taxa de Quadros (FPS) Minima (Pico de Engasgo): ${fpsMin.toFixed(2)} FPS\n`;
  txt += `Taxa de Quadros (FPS) Maxima: ${fpsMax.toFixed(2)} FPS\n`;
  txt += `Tempo de Frame Medio: ${ftMedio.toFixed(2)} ms\n`;
  txt += `Tempo de Frame Maximo: ${ftMax.toFixed(2)} ms\n`;
  txt += `Draw Calls Medio: ${dcMedio.toFixed(1)}\n`;
  txt += `Draw Calls Maximo: ${dcMax}\n`;
  txt += `Total de Quadros Amostrados: ${n} frames\n`;
  txt += `\n--- DADOS BRUTOS QUADRO A QUADRO ---\n`;
  txt += `Tempo Decorrido (ms),FPS Instantaneo,Tempo de Frame (ms),Draw Calls\n`;
  data.forEach(r => {
    txt += `${r.t.toFixed(0)},${r.fps.toFixed(1)},${r.ft.toFixed(2)},${r.dc}\n`;
  });

  const a = Object.assign(document.createElement("a"), {
    href:     URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8;" })),
    download: `relatorio_benchmark_${CONFIG_API}_cenario_${CONFIG_CENARIO}.txt`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ================================================================
// ENTRADA PRINCIPAL
// ================================================================
async function main() {
  const canvas = Object.assign(document.createElement("canvas"), {
    width: window.innerWidth, height: window.innerHeight,
  });
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;display:block";
  document.body.appendChild(canvas);

  const overlay = Object.assign(document.createElement("div"), {
    style: "position:fixed;top:0;left:0;background:rgba(0,0,0,.75);color:#0f0;" +
           "font:12px monospace;padding:8px;z-index:9;white-space:pre;pointer-events:none",
  });
  document.body.appendChild(overlay);
  overlay.textContent = "Inicializando WebGL2...";

  const gl = initWebGL(canvas);

  overlay.textContent = "Carregando e decomprimindo assets (Draco)...";
  const loadStart = performance.now();
  const { meshes: meshData, texImages } = await loadAssets(ASSET_PATH);
  const loadTime  = performance.now() - loadStart;
  console.log(`%c[WEBGL-RAW] Assets: ${loadTime.toFixed(2)}ms | ${meshData.length} meshes | ${texImages.size} texturas`, "color:#0f0");

  overlay.textContent = "Enviando geometria e texturas para a GPU...";
  const gpuMeshes      = uploadMeshes(gl, meshData);
  const texCache       = createTextureCache(gl, texImages);
  const placeholderTex = createPlaceholderTexture(gl);

  const program      = createProgram(gl);
  const uViewProjLoc = gl.getUniformLocation(program, "uViewProj");
  const uTexLoc      = gl.getUniformLocation(program, "uTex");

  window.addEventListener("resize", () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Estado do benchmark
  let running    = false;
  let metricsLog = [];
  let t0         = 0;
  let prevTs     = 0;
  let autoStartEpochMs = 0;

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    running = !running;
    if (running) {
      metricsLog = [];
      autoStartEpochMs = Date.now();
      t0 = prevTs = performance.now();
    }
  });

  const fovY = 75 * Math.PI / 180; // mesmo campo de visão do main.js

  function frame(ts) {
    const aspect = canvas.width / canvas.height;
    const proj   = mat4Perspective(fovY, aspect, 0.1, 1000);

    let eye, target;

    if (running) {
      const elapsed = ts - t0;
      const t       = Math.min(elapsed / DURATION_MS, 1.0);
      eye    = catmullRomPoint(WAYPOINTS, t);
      target = catmullRomPoint(WAYPOINTS, Math.min(t + 0.05, 1.0));

      const dt = ts - prevTs;
      prevTs   = ts;

      if (dt > 1) {
        metricsLog.push({ t: elapsed, fps: 1000 / dt, ft: dt, dc: gpuMeshes.length });
        const last = metricsLog[metricsLog.length - 1];
        overlay.textContent =
          `WEBGL-RAW | Cenário ${CONFIG_CENARIO.toUpperCase()} | [SPACE] parar\n` +
          `FPS: ${last.fps.toFixed(1)} | Frame: ${last.ft.toFixed(2)}ms\n` +
          `Draw Calls: ${last.dc} | Progresso: ${(t * 100).toFixed(1)}%`;
      }

      if (t >= 1.0) {
        running = false;
        exportReport(metricsLog, loadTime, autoStartEpochMs);
        overlay.textContent =
          `WEBGL-RAW | Cenário ${CONFIG_CENARIO.toUpperCase()}\n` +
          `Benchmark concluído — relatório baixado.\n` +
          `[SPACE] para iniciar novamente`;
      }
    } else {
      // Câmera parada no ponto inicial enquanto aguarda [SPACE]
      eye    = catmullRomPoint(WAYPOINTS, 0);
      target = catmullRomPoint(WAYPOINTS, 0.05);

      if (!metricsLog.length) {
        overlay.textContent =
          `WEBGL-RAW | Cenário ${CONFIG_CENARIO.toUpperCase()}\n` +
          `Meshes: ${gpuMeshes.length} | Texturas: ${texCache.size} | Carregamento: ${loadTime.toFixed(0)}ms\n` +
          `[SPACE] iniciar benchmark (60s)`;
      }
    }

    const view     = mat4LookAt(eye, target, [0, 1, 0]);
    const viewProj = mat4Mul(proj, view);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.05, 0.05, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniformMatrix4fv(uViewProjLoc, false, viewProj);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTexLoc, 0);

    // gpuMeshes está ordenado por doubleSided (false primeiro), então o
    // estado de culling alterna no máximo uma vez por frame.
    let cullEnabled = null;
    for (const { vao, indexCount, glType, texKey, doubleSided } of gpuMeshes) {
      const wantCull = !doubleSided;
      if (wantCull !== cullEnabled) {
        if (wantCull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
        cullEnabled = wantCull;
      }
      gl.bindTexture(gl.TEXTURE_2D, texKey ? texCache.get(texKey) : placeholderTex);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, glType, 0);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML =
    `<pre style="color:red;padding:20px;font-size:14px">${err.message}\n\n${err.stack ?? ""}</pre>`;
});
