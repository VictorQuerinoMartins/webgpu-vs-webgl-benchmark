# CLAUDE.md - DIRETRIZES DE IA E CONTEXTO OPERACIONAL DO TCC

> 🚨 **INSTRUÇÃO :** Este repositório hospeda um ambiente de testes científicos controlado para um Trabalho de Conclusão de Curso (TCC) em Ciência da Computação. Antes de gerar, alterar ou refatorar qualquer trecho de código, leia este documento para garantir a consistência metodológica e evitar regressões de desempenho ou desvios de métricas.

---

## 1. CONTEXTO DO PROJETO E METODOLOGIA DO TCC
* **Autor:** Victor Querino Martins
* **Instituição:** Universidade Estadual do Paraná (UNESPAR) - Campus de Apucarana.
* **Título do Projeto:** WebGL e WebGPU em Renderização Arquitetônica de Larga Escala: Um Estudo Comparativo de Desempenho e Eficiência Energética.
* **Objetivo Científico:** Comparar o desempenho gráfico bruto, a eficiência de baixo nível e o impacto ecológico (Computação Verde / Green IT) entre as APIs WebGL e WebGPU sob cenários polimórficos de estresse.

---

## 2. ESPECIFICAÇÕES DO HARDWARE E AMBIENTE DE TESTE (HOST)
Os ensaios experimentais são executados sob uma arquitetura fixa e imutável para garantir a reprodutibilidade dos resultados:

* **Modelo do Dispositivo:** Laptop Acer Nitro AN517-54
* **Processador (CPU):** 11th Gen Intel(R) Core(TM) i7-11800H @ 2.30GHz (8 Cores físicos / 16 Processadores Lógicos).
* **Memória RAM:** 16 GB Física Instalada (~16,5 GB visível ao sistema operacional).
* **Unidade Gráfica Integrada (iGPU):** Intel(R) UHD Graphics (Utilizada pelo Host para economia de energia).
* **Unidade Gráfica Dedicada (dGPU):** NVIDIA GeForce RTX 3050 Laptop GPU (4GB VRAM - Alvo principal do estresse gráfico).
* **Sistema Operacional:** Microsoft Windows 11 Home Single Language (Ambiente Host: pt-BR).

### Condições de coleta do dataset oficial (atualizado 2026-10-31)
* **Navegador:** Microsoft Edge 156 (Chromium), via Playwright (`--canal msedge`). O Chrome foi abandonado porque nesta máquina recusa parte dos blobs de textura do Cenário D (`ERR_BLOB_OUT_OF_MEMORY`, limite ~500 MB contra ~1 GB do Edge). Dados anteriores do Chrome estão arquivados fora do repositório e **não** entram na análise.
* **GPU dedicada obrigatória no Windows:** `HKCU\Software\Microsoft\DirectX\UserGpuPreferences` precisa ter `msedge.exe` com `GpuPreference=2;` (Configurações > Sistema > Vídeo). Sem isso o Edge roda na Intel UHD e o coletor invalida o ensaio (guarda de VRAM, delta mínimo de 60 MiB sobre o repouso).
* **Sem vsync:** flags `--disable-frame-rate-limit --disable-gpu-vsync` (opção `--sem-vsync` do coletor; saída em `resultados_sem_vsync/`). Medições com vsync ficam como trabalho futuro.
* **MSAA 4x nos quatro modos** (paridade; o WebGPU-RAW antigo sem MSAA foi descartado).
* **Ventilação:** NitroSense com ventoinhas no máximo, idêntico nos três lotes; notebook na tomada; sem tocar no mouse/teclado durante o lote (~100 min).

---

## 3. MATRIZ DE MÉTRICAS COMPARATIVAS (ESCOPO DO EXPERIMENTO)

A avaliação quantitativa entre as duas APIs é governada estritamente pelas seguintes variáveis capturadas quadro a quadro ou via monitoramento externo de hardware:

### A. Dimensão de Renderização Computacional
* **Quadros por Segundo (FPS Instantâneo):** Calculado de forma discreta frame a frame por meio da relação inversa do tempo de transição gráfico ($1/\Delta t$).
* **Tempo de Quadro (Frame Time - ms):** Tempo exato gasto para processar, atualizar matrizes e desenhar um único frame (métrica primária contra *stuttering*).
* **Chamadas de Renderização (Draw Calls):** Contagem de instruções enviadas da CPU para a GPU por frame. Variável principal para expor o gargalo de overhead do WebGL.
* **Alocação de Memória de Vídeo (VRAM - MB):** Volume de memória volátil da dGPU alocado dinamicamente para geometria, malhas e texturas.
* **Tempo para o Primeiro Quadro (Time to First Frame - TTFF):** Delta de tempo desde o início da requisição de rede do arquivo compactado via algoritmo Google Draco até a renderização do primeiro pixel na tela.
* **Decomposição CPU/GPU (Tempo de GPU e Overhead de CPU - ms, adicionado 2026-08-24):** GPU timestamp queries (`timestamp-query` do WebGPU nativo/`WebGPURenderer` via `trackTimestamp`; `EXT_disjoint_timer_query_webgl2` do WebGL2) medem o tempo real de execução na GPU, isolado do tempo de parede do quadro. Overhead de CPU = Frame Time − Tempo de GPU. Objetivo: separar quanto da diferença de desempenho entre APIs vem de trabalho de GPU genuinamente mais caro vs. overhead de submissão de comandos no lado da CPU — a promessa central do WebGPU é reduzir especificamente o segundo. **Ressalva (atualizada 2026-10-31):** sem vsync a contaminação por espera do monitor deixa de existir, mas o intervalo da consulta de GPU abrange o tempo entre o primeiro e o último comando; se a CPU submete mais devagar que a GPU executa, a espera entra na medida. Logo, o tempo de GPU entre APIs é indício, não prova, e a explicação por overhead de CPU permanece hipótese (indício indireto: potência de ~22 W do WebGL do Three.js no instancing, contra ~60 W nos demais).

### B. Dimensão de Computação Verde (Green IT)
* **Potência Instantânea da dGPU (Power Draw - W):** Consumo energético bruto exigido pela RTX 3050 sob estresse, solicitado a 10 Hz via `nvidia-smi` (`--loop-ms=100`), mas o sensor atualiza a cada ~500 ms (resolução efetiva ~2 Hz); inclui o consumo em repouso, e a energia da CPU não é medida.
* **Assinatura Energética por Quadro (Joules):** Custo de hardware real por frame individual, calculado por: $E_f = P_{\text{inst}} \times (\Delta t_{\text{frame}} / 1000)$.
* **Coeficiente de Eficiência Quadro-por-Watt (Frames/W):** Razão matemática que define a produtividade ecológica dividindo o FPS instantâneo pelos Watts consumidos.
* **Consumo Acumulado do Ensaio (Joules / Wh):** A integral sob a curva de potência consumida durante os 60 segundos exatos do trajeto da câmera.

---

## 4. ARQUITETURA DE ARQUIVOS E CENÁRIOS (MATRIZ DE ESTRESSE)
O modelo tridimensional utilizado é o **Amazon Lumberyard Bistro** (cena *Exterior* apenas). Para os ensaios de carga de textura, foi dividido em quatro arquivos `.glb` dentro da pasta `public/`, todos com a mesma geometria-base (1.297 nodes, 1.591 primitivas):

* **Cenário A (Baseline):** `CenarioBistroA.glb` (~15 MB) - Geometria pura desprovida de materiais complexos e mapas de textura.
* **Cenário B (Média Carga):** `CenarioBistroB.glb` (~115 MB) - Materiais com mapas de textura PNG em resolução de 512x512 pixels (0.5K).
* **Cenário C (Alta Carga):** `CenarioBistroC.glb` (~328 MB) - Materiais com mapas de textura PNG em resolução fixa de 1024x1024 pixels (1K).
* **Cenário D (Ruptura, extrapolação de escopo):** `CenarioBistroD.glb` (~728 MB) - Mesma cena, texturas em 2048x2048 pixels (2K) com compressão Draco menos agressiva; 4º ponto da progressão de carga de textura A→B→C→D, usado para mapear o ponto de colapso de cada API. Documentado no `main.tex` e em `COMO-TESTAR-CENARIOS.md` §6.

Além da progressão de textura, há um **eixo experimental paralelo de estresse de Draw Calls (instancing)**, isolando a variável de número de objetos em vez de resolução de textura: várias cópias (`scene.clone()`, sem `THREE.InstancedMesh`) do objeto Vespa extraído do próprio Bistro Exterior (`public/objetos/vespa.glb`), em três densidades — **N=500, N=2000, N=5000** — acessadas via `?densidade=N` (ver `src/main.js`, `CONFIG_DENSIDADE_INSTANCING`, e `COMO-TESTAR-CENARIOS.md` §6.1). Cenário D e o cenário de instancing fazem parte do escopo oficial de dados do TCC (confirmado pelo usuário em 2026-08-21) — **D já está descrito no `main.tex`; o eixo de instancing ainda precisa de uma seção própria na metodologia antes da defesa.**

### Dataset oficial e análise (atualizado 2026-10-31)
* **Desenho:** 28 combinações (4 modos x 7 cenários), 3 lotes x 3 repetições = N=9 por combinação (252 ensaios), blocos com ordem aleatória por repetição, 1 aquecimento descartado por lote. Dados em `resultados_sem_vsync/<modo>/ensaioN/{cenarioA..D,testeDrawCall}/`; potência e logs em `resultados/power_logs_sem_vsync/ensaioN/`. A coleta é `node scripts/automatizar_coleta.mjs ... --sem-vsync --canal msedge` (opção `--apenas-runs` repõe repetições específicas).
* **Análise:** rodar os scripts com `SEM_VSYNC=1` (`consolidar_medias.mjs`, `gerar_tabela_txt.mjs`, `analise_estatistica.mjs`, `verificar_premissas.py`, `gerar_graficos.py`). Saídas em `resultados/conclusões/dados-gerados_sem_vsync/` e figuras em `TCC_CComp_2026 (1)/imagens_sem_vsync/`. **Sem `SEM_VSYNC=1` os scripts leem/sobrescrevem o dataset antigo.**
* **Estatística:** Brunner-Munzel (permutação exata) + Vargha-Delaney A12 + Holm por família (par de APIs x primárias|exploratórias). Primárias: tempo de quadro médio, VRAM média, energia por quadro. Exploratórias: FPS, TTFF, tempo de GPU, overhead de CPU, potência, quadros/W, draw calls. Energia acumulada é só descritiva.
* **Cuidados de leitura:** o FPS médio (1/Δt por quadro) infla quando o modo alterna rajadas e paradas — usar tempo de quadro; draw calls são reportados ponderados pelo tempo de quadro (`draw_calls_pond_tempo`), pois a média por quadro depende da taxa de quadros; 17 dos 252 ensaios têm potência atípica (>8 W da mediana), causa não identificada.

---

## 5. REGRAS E DIRETRIZES PARA GERAÇÃO DE CÓDIGO (GUARDRAILS)

* **🚨 Regra 1 (Chaveamento Monolítico):** Toda a aplicação reside em um único ponto de entrada (`src/main.js`). O chaveamento de motor e cenário é feito exclusivamente alterando as constantes `CONFIG_API` e `CONFIG_CENARIO` no topo do arquivo. Nunca fragmente o projeto.
* **🚨 Regra 2 (Forçamento de Hardware Dedicado):** Ambos os inicializadores de renderização devem possuir a flag `powerPreference: "high-performance"`. O WebGPU exige a inicialização assíncrona por meio de `await renderer.init()`. Sem isso, o ecossistema WebGPU é empurrado por padrão para a iGPU Intel UHD, invalidando o rigor do ensaio.
* **🚨 Regra 3 (Imutabilidade do Trilho da Câmera):** O array `THREE.CatmullRomCurve3` possui 12 pontos calibrados milimetricamente para guiar a câmera de forma suave sem colidir com paredes ou com o mancebo decorativo interno. Nunca altere essas coordenadas sem validação visual explícita (screenshots cobrindo os 60s do trajeto) — a calibração de 2026-06-22 tinha um trecho (pontos 4-6, t≈0.30-0.65) atravessando uma estrutura coberta perto do café, corrigido em 2026-08-21 (ver `docs/CHANGES-LOG.md`). Os três arquivos (`main.js`, `main-raw-webgl.js`, `main-raw-webgpu.js`) devem manter coordenadas idênticas.
* **🚨 Regra 4 (Automação do Relatório):** A função `exportarMetricasCSV` consolida dados armazenados na memória e dispara o download automático de um arquivo `.txt` estruturado ao término exato de 60 segundos (`duration = 60000`). O nome do arquivo baixado deve seguir de forma dinâmica o padrão de nomenclatura das constantes de configuração.

---

## 6. ESTRUTURA DO RELATÓRIO ESPERADO DE SAÍDA
Qualquer refatoração deve manter o output final da telemetria idêntico a este modelo de string para colagem direta nas tabelas da monografia:
```text
Tempo de Carregamento Inicial (Assets + Draco): X.XX segundos (XXXX.XX ms)
Taxa de Quadros (FPS) Média: XX.XX FPS
Taxa de Quadros (FPS) Mínima (Pico de Engasgo): XX.XX FPS
Taxa de Quadros (FPS) Máxima: XX.XX FPS
Tempo de Frame Médio: XX.XX ms
Tempo de Frame Máximo: XX.XX ms
Total de Quadros Amostrados: XXXX frames