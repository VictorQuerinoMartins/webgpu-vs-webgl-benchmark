# 🏛️ WebGL vs WebGPU: Benchmark de Renderização Arquitetônica de Larga Escala

Bancada de testes experimentais desenvolvida para o Trabalho de Conclusão de Curso (TCC) em Ciência da Computação. O projeto mede e compara, com dados reais, o desempenho gráfico, a eficiência de baixo nível e o consumo de energia entre as APIs **WebGL** e **WebGPU** na renderização de um modelo arquitetônico de larga escala no navegador.

**Pesquisador:** Victor Querino Martins
**Instituição:** UNESPAR — Universidade Estadual do Paraná (Campus Apucarana)

---

## 🎯 Objetivo e Justificativa

Aplicações web de visualização arquitetônica, engenharia e maquetes virtuais (BIM) esbarram frequentemente num limite conhecido do WebGL: o custo de CPU por *Draw Call*. Antes de cada comando de desenho, o navegador precisa validar a máquina de estados ativa (*shader*, *buffers*, textura) — em cenas com muitos objetos, esse trabalho de validação pode dominar o tempo de quadro, mesmo com uma GPU capaz de renderizar a geometria quase instantaneamente.

A **WebGPU** promete resolver isso com *pipelines* pré-compilados e validados uma única vez, eliminando a revalidação por comando. Este projeto constrói um ambiente controlado e reprodutível para medir, na prática, se esse ganho teórico se converte em ganho real — e, principalmente, para **isolar quanto do desempenho observado vem da especificação da API e quanto vem da maturidade da implementação do *framework*** (Three.js) que a maioria das aplicações reais usa para acessá-la.

---

## 🔬 Metodologia

### Quatro modos de renderização

| Modo | O que é |
|---|---|
| **WebGL** | `THREE.WebGLRenderer`, *pipeline* completo de materiais PBR. |
| **WebGPU** | `THREE.WebGPURenderer`, mesmo *pipeline* de materiais — única variável independente em relação ao anterior. |
| **WebGL-RAW** | WebGL2 puro, sem Three.js, *shader* mínimo — grupo de controle que isola o custo real da API sem o *overhead* do *framework*. |
| **WebGPU-RAW** | WebGPU puro, equivalente direto do anterior. |

Comparar RAW-vs-completo é o que permite atribuir corretamente uma diferença de desempenho à API em si ou à maturidade do `WebGPURenderer` do Three.js — sem esse grupo de controle, a comparação WebGL-vs-WebGPU sozinha não distingue as duas causas.

### Dois eixos experimentais independentes

- **Progressão de carga de textura (Cenários A–D):** mesma geometria-base (1.297 *nodes*, 1.591 primitivas — Amazon Lumberyard Bistro, cena *Exterior*), variando só a resolução de textura, de "sem textura" até 2048×2048px.
- **Estresse de *Draw Calls* (*instancing*, N=500/2000/5000):** textura fixa, variando o número de objetos desenhados por quadro — várias cópias independentes (`scene.clone()`, sem `THREE.InstancedMesh`, decisão deliberada para não colapsar os *draw calls* que o eixo quer medir) de um objeto real extraído do próprio modelo (a Vespa decorativa do Bistro).

### Controle experimental

- **Stack purista:** *Vanilla JavaScript* + Vite, sem *frameworks* reativos, para não introduzir ruído no *Event Loop* durante a coleta.
- **Hardware fixo e documentado:** notebook Acer Nitro AN517-54, Intel Core i7-11800H, 16GB RAM, GPU dedicada NVIDIA GeForce RTX 3050 Laptop (4GB VRAM) — reprodutibilidade em troca de generalização (documentado como limitação).
- **Câmera 100% automatizada:** nenhuma interação humana durante os 60s de cada ensaio; um trilho (*spline* Catmull-Rom, curva centrípeta idêntica nos 4 modos) garante que todas as combinações renderizem o mesmo *frustum* visual a cada instante.
- **Coleta sem intervenção manual:** toda a bateria de testes é automatizada via Playwright controlando um Chrome real, com randomização em blocos (ordem sorteada de novo a cada repetição) para mitigar viés de deriva térmica ao longo de lotes longos.

---

## 📊 Métricas Coletadas

### Renderização Computacional

| Métrica | Como é medida |
|---|---|
| FPS (instantâneo, médio, mín., máx.) | `1/Δt` por quadro |
| *Frame Time* (médio, máx.) | `performance.now()` por quadro |
| *Draw Calls* por quadro | `renderer.info` (Three.js) / contagem manual (RAW) |
| VRAM alocada (MB) | `nvidia-smi --query-gpu=memory.used`, processo externo ao navegador |
| *Time to First Frame* (TTFF) | Requisição de rede + descompressão Draco até o primeiro pixel |
| Tempo de GPU / *Overhead* de CPU | *Timestamp queries* nativas (`timestamp-query` do WebGPU, `EXT_disjoint_timer_query_webgl2` do WebGL2) — decompõe o *Frame Time* entre trabalho real de GPU e submissão/validação de CPU |

### Green IT (Computação Verde)

| Métrica | Como é medida |
|---|---|
| Potência instantânea (W) | `nvidia-smi`, amostrado a 10Hz |
| Assinatura energética por quadro (J) | `Potência × (Δt_quadro / 1000)` |
| Coeficiente Frames/Watt | FPS ÷ Watts |
| Consumo acumulado do ensaio (J/Wh) | Integral trapezoidal da curva de potência sobre os 60s |
| Clock de núcleo e *throttling* térmico | `clocks.current.graphics` + `clocks_throttle_reasons.*_thermal_slowdown` — mais direto que temperatura, que satura num teto de fábrica e não revela *throttling* sustentado por si só |

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/)
- Google Chrome instalado (a coleta usa o canal `chrome` real do sistema, não o Chromium do Playwright — necessário para respeitar a preferência de GPU dedicada configurada no Windows)
- GPU NVIDIA dedicada, se quiser as métricas de Green IT (`nvidia-smi` no PATH)

### Instalação

```bash
git clone <url-do-repositorio>
cd webgpu-vs-webgl-benchmark
npm install
```

### Rodar o visualizador (modo manual/debug)

```bash
npm run dev
```

Abre em `http://localhost:5173`. Parâmetros de URL: `?api=webgl|webgpu&cenario=a|b|c|d` (ou `?densidade=500|2000|5000` para o eixo de *instancing*). Modo manual serve para *debug* visual — **não gera dado oficial**.

### Coletar dados oficiais (procedimento único)

Com `npm run dev` rodando em outro terminal:

```bash
npm run coletar -- --modos webgl,webgpu,webgl-raw,webgpu-raw --cenarios a,b,c,d,n500,n2000,n5000 --repeticoes 3
```

Mede **todas** as métricas das duas tabelas acima automaticamente, sem intervenção manual. Principais *flags*:

| Flag | Efeito |
|---|---|
| `--modos` / `--cenarios` / `--repeticoes` | Quais combinações rodar e quantas vezes |
| `--sentinela-termica` | Repete a combinação sorteada em 1º lugar como o último ensaio do lote, e gera automaticamente uma comparação de deriva térmica entre os dois |
| `--intervalo-blocos <min>` | Pausa de N minutos entre rodadas, para dar tempo de recuperação térmica em lotes longos |
| `--sem-randomizar` | Desativa a randomização em blocos (ordem sequencial) |
| `--sem-metricas-gpu` | Desativa a captura de potência/VRAM/clock (para máquinas sem GPU NVIDIA) |
| `--sem-aquecimento` | Pula o ensaio de aquecimento descartado |

---

## 🛠️ Scripts do Projeto

| Script | Função |
|---|---|
| `scripts/automatizar_coleta.mjs` (`npm run coletar`) | Orquestra a coleta oficial completa via Playwright |
| `scripts/analisar_energia.mjs` (`npm run analisar-energia`) | Correlaciona um relatório de ensaio com o log de potência, calculando Green IT, VRAM, temperatura e clock/*throttling* |
| `scripts/comparar_deriva_termica.mjs` | Compara dois ensaios (tipicamente 1º vs. último de um lote com `--sentinela-termica`) e gera uma tabela de delta |
| `scripts/consolidar_medias.mjs` | Agrega todas as repetições de `resultados/` numa única planilha CSV por combinação modo×cenário |
| `scripts/gerar_tabela_txt.mjs` | Gera tabelas de texto prontas para colar na monografia a partir do CSV consolidado |
| `scripts/gerar_graficos.py` | Gera as figuras (Frame Time, VRAM, Frames/Watt etc.) em estilo de artigo científico |
| `scripts/extrair_objeto.mjs` | Extrai e poda um objeto isolado de um GLB maior (usado para gerar `vespa.glb`) |
| `scripts/spotcheck_vram_processo.mjs` | Verificação pontual de VRAM por processo, para auditar se a leitura do `nvidia-smi` reflete só o navegador |

---

## 📁 Estrutura de Resultados

```
resultados/
├── threejs-webgl/, threejs-webgpu/, raw-webgl/, raw-webgpu/   # relatórios brutos por modo, organizados em ensaioN/
├── power_logs/                                                 # logs de potência/VRAM/temperatura/clock do nvidia-smi
├── spotcheck_vram/                                             # verificação pontual de VRAM por processo (fora do dataset oficial)
└── conclusões/
    ├── *.md                                                    # análises e documentos de texto (não gerados por script)
    └── dados-gerados/                                          # CSV, tabela e comparações de deriva térmica, recriados por script
```

---

## 📚 Documentação Adicional

- [`docs/COMO-TESTAR-CENARIOS.md`](docs/COMO-TESTAR-CENARIOS.md) — guia operacional completo de cada cenário e modo.
- [`CLAUDE.md`](CLAUDE.md) — contexto metodológico completo do projeto (hardware, métricas, regras de reprodutibilidade).
- [`docs/CHANGES-LOG.md`](docs/CHANGES-LOG.md) — histórico cronológico de toda modificação feita no projeto, com o quê e o porquê.

---

## 🧱 Stack Tecnológica

- **Vite** — *bundler* e servidor de desenvolvimento
- **Three.js `0.185.1`** — `WebGLRenderer` e `WebGPURenderer`, versão travada para reprodutibilidade
- **WebGL2** / **WebGPU** puros — nos dois modos RAW (grupo de controle)
- **Playwright** (`playwright-core`) — automação da coleta via Chrome real
- **@gltf-transform** — preparação e compressão Draco dos modelos `.glb`
