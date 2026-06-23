# Como Testar os Cenários — Guia de Uso

Este projeto possui **4 modos de renderização** e **4 cenários de estresse**,
totalizando 16 combinações de ensaio. Este guia explica como rodar cada um.

---

## 1. Pré-requisitos

- `npm install` já executado.
- Navegador baseado em Chromium atualizado (Chrome ou Edge). WebGPU exige
  versão recente; se não funcionar, verifique `chrome://gpu` para confirmar
  que o WebGPU está disponível.
- **Importante (Regra 2 do CLAUDE.md):** garanta que o navegador está usando
  a GPU dedicada (RTX 3050), não a iGPU Intel. **Esta é uma configuração do
  Windows, não do Chrome** — não existe em `chrome://settings`. Caminho
  correto:
  1. Abra as **Configurações do Windows** (tecla `Win + I`), **não** o menu
     de configurações do Chrome.
  2. `Sistema` → `Tela` (ou `Vídeo`) → role até **"Gráficos"** (ou
     "Configurações gráficas").
  3. Clique em **"Procurar"** (Browse) e selecione o executável do Chrome
     (normalmente `C:\Program Files\Google\Chrome\Application\chrome.exe`),
     ou selecione "Google Chrome" se já estiver listado.
  4. Clique no app adicionado → **"Opções"** → marque **"Alto desempenho"**
     → **Salvar**.
  5. Feche e reabra completamente o Chrome (todas as janelas) para a
     mudança ter efeito.
- **⚠️ Limitação conhecida do Chromium no Windows:** mesmo com o passo
  acima, a opção `powerPreference: "high-performance"` passada para
  `requestAdapter()` (WebGPU) é **ignorada pelo Chrome/Edge no Windows**
  ([crbug.com/369219127](https://crbug.com/369219127), bug aberto) — ou
  seja, o hint de software não tem efeito; só a configuração do Windows
  acima garante a GPU dedicada. Os renderizadores RAW (`raw-webgl.html` e
  `raw-webgpu.html`) já imprimem no console (F12) qual GPU física foi
  selecionada em cada execução — confirme ali antes de coletar dados
  oficiais, em vez de depender só do `chrome://gpu`.

---

## 2. Iniciar o servidor

```
npm run dev
```

Abre em `http://localhost:5173`.

---

## 3. Os 4 modos de renderização

| Modo | Motor | Entrada | Suporta texturas? |
|---|---|---|---|
| **WebGL (Three.js)** | Three.js `WebGLRenderer` | `/?api=webgl&cenario=X` | Sim (PBR completo) |
| **WebGPU (Three.js)** | Three.js `WebGPURenderer` | `/?api=webgpu&cenario=X` | Sim (PBR completo) |
| **WebGL-RAW** | WebGL2 puro (sem framework) | `/raw-webgl.html?cenario=X` | Sim (apenas cor base) |
| **WebGPU-RAW** | WebGPU puro (sem framework) | `/raw-webgpu.html?cenario=X` | Sim (apenas cor base) |

`X` = `a`, `b`, `c` ou `d`. Os modos RAW usam Three.js **somente** para
descomprimir o Draco/GLB — a renderização em si não usa nenhum framework
(servem como experimento de controle).

---

## 4. Tabela completa de URLs (16 combinações)

| Cenário | WebGL (Three.js) | WebGPU (Three.js) | WebGL-RAW | WebGPU-RAW |
|---|---|---|---|---|
| **A** (sem textura) | `/?api=webgl&cenario=a` | `/?api=webgpu&cenario=a` | `/raw-webgl.html?cenario=a` | `/raw-webgpu.html?cenario=a` |
| **B** (textura 512px) | `/?api=webgl&cenario=b` | `/?api=webgpu&cenario=b` | `/raw-webgl.html?cenario=b` | `/raw-webgpu.html?cenario=b` |
| **C** (textura 1024px) | `/?api=webgl&cenario=c` | `/?api=webgpu&cenario=c` | `/raw-webgl.html?cenario=c` | `/raw-webgpu.html?cenario=c` |
| **D** (Exterior, textura 2048px) | `/?api=webgl&cenario=d` | `/?api=webgpu&cenario=d` | `/raw-webgl.html?cenario=d` | `/raw-webgpu.html?cenario=d` |

Prefixe sempre com `http://localhost:5173`.

### Sobre o Cenário D (mesmo modelo-base de A/B/C, em resolução ainda maior)

`CenarioBistroA/B/C.glb` e `public/bistro_exterior_base.glb` (origem do
Cenário D) são **o mesmo modelo 3D** — confirmado pela estrutura interna
idêntica do `.glb` (1.297 nodes, 1.296 meshes, 1.591 primitivas, 132
materiais, mesma bounding box). A diferença entre os 4 cenários é só a
resolução de textura/compressão usada na exportação, não um modelo
diferente. O Cenário D é, na prática, uma continuação natural da
progressão A→B→C: a mesma cena, com textura ainda maior (2048px) e sem
a mesma otimização de compressão aplicada em B/C.

`CenarioBistroD.glb` foi gerado a partir de `public/bistro_exterior_base.glb`
(941,85 MB, sem compressão) via:
```
gltf-transform resize bistro_exterior_base.glb _tmp.glb --width 2048 --height 2048
gltf-transform draco _tmp.glb CenarioBistroD.glb
```
Resultado final: **728,47 MB** — bem mais pesado que o Cenário C, porque o
peso é dominado por ~405 texturas PNG não comprimidas (muitas já em
2048×2048, por isso o resize não ajudou tanto quanto em B/C). **Risco de
OOM de VRAM é maior que no Cenário C** — é esperado e faz parte do que se
quer observar. O arquivo `bistro_exterior_base.glb` original (4K, sem
compressão) também pode ser testado depois com o mesmo `cenario=d` apontando
para ele temporariamente, para mapear o ponto exato de ruptura.

---

## 5. Como rodar um ensaio (passo a passo)

1. Abra a URL desejada da tabela acima.
2. Aguarde o carregamento completo dos assets:
   - Modos Three.js: a cena aparece e a câmera fica livre (mouse/OrbitControls).
   - Modos RAW: o overlay no canto superior esquerdo mostra o status
     ("Carregando...", depois "Meshes: N | Carregamento: Xms").
3. Pressione **[SPACE]** para iniciar o trilho automatizado da câmera (60s).
   - **Não toque no mouse ou teclado durante o ensaio.**
4. Ao final dos 60 segundos, o relatório `.txt` baixa automaticamente para a
   pasta de Downloads do navegador.
5. Mova o arquivo para a subpasta correspondente em `resultados/` (veja a
   seção 7).

---

## 6. Convenção de nomes dos relatórios

```
relatorio_benchmark_<api>_cenario_<x>.txt
```

Exemplos:
- `relatorio_benchmark_webgl_cenario_a.txt`
- `relatorio_benchmark_webgpu_cenario_b.txt`
- `relatorio_benchmark_webgl-raw_cenario_c.txt`
- `relatorio_benchmark_webgpu-raw_cenario_a.txt`

---

## 7. Organização das pastas em `resultados/`

| Pasta | Conteúdo |
|---|---|
| `resultados/webgl/` | Ensaios via Three.js + WebGL |
| `resultados/webgpu/` | Ensaios via Three.js + WebGPU |
| `resultados/web-gl_puro/` | Ensaios WebGL-RAW |
| `resultados/web-gpu_puro/` | Ensaios WebGPU-RAW |
| `resultados/conclusões/` | Análises e textos consolidados |

---

## 8. Cuidados durante a coleta (rigor experimental)

- Não use o mouse/teclado durante os 60s do ensaio automatizado.
- Feche abas e processos pesados em segundo plano antes de iniciar.
- Repita cada combinação pelo menos 3 vezes e use a média — isolar outliers
  de GC/JIT do navegador (ex: o pico isolado de 55ms visto no WebGPU-RAW A).
- Aguarde a GPU "resfriar" entre ensaios consecutivos pesados (Cenário C
  principalmente) para não distorcer o Frame Time por *throttling* térmico.
- Para a dimensão de Green IT, inicie a coleta do `nvidia-smi` (1 Hz) **antes**
  de pressionar [SPACE], para sincronizar os timestamps de energia com os
  do relatório de FPS/Frame Time.

---

## 9. Limitações conhecidas

- **Fidelidade de material nos modos RAW:** apenas a textura de cor base
  (BaseColor) é amostrada. Normal maps e specular maps são ignorados — isso
  não afeta as métricas de desempenho (mesma contagem de triângulos, draw
  calls e binds de textura), apenas a fidelidade visual do material.
- **[RESOLVIDO] Geometria fantasma nos modos RAW:** versões anteriores liam
  os atributos de vértice via `.array` diretamente, o que corrompia a
  geometria porque o DRACOLoader decodifica posição/normal/UV em um único
  buffer intercalado (`InterleavedBuffer`) compartilhado — ler `.array` de
  um atributo retornava o buffer inteiro (todos os atributos misturados),
  não apenas os valores daquele atributo. Corrigido extraindo vértice a
  vértice via `getX/getY/getZ`, que lida corretamente com atributos
  intercalados. Há também uma validação que descarta e registra no console
  (`console.warn`) qualquer mesh com coordenadas não-finitas (NaN/Infinity)
  após o bake da transform — útil para detectar nós auxiliares com escala
  zero no GLB.
