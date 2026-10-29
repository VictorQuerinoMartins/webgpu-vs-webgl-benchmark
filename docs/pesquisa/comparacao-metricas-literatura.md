# Como a literatura mede e reporta WebGL vs WebGPU, frente a este TCC

Levantamento de 2026-10-19. Convenção de verificação:
- **[ABERTO]** = abri o texto (HTML/página) e extraí a metodologia; mesmo assim a extração passou por um sumarizador automático, então valores finos (ex.: "não especifica nº de execuções") merecem conferência no PDF.
- **[RESUMO]** = só abstract/metadados confirmados; metodologia NÃO verificada.
- **[SNIPPET]** = só trecho de resultado de busca ou citação de terceiros; NÃO verificado.
- Células da tabela: **S** = sim (verificado em [ABERTO]), **N** = o texto aberto não reporta, **?** = não consegui verificar (fonte não aberta), **n/a** = não se aplica.
- Limitação geral: vários PDFs (Usta 2024, RenderCore, FusionRender/OpenReview, tese DiVA) não puderam ser lidos por restrição das ferramentas (PDF binário, bloqueio, conexão recusada). Isso reduz o N de trabalhos realmente analisados a **2** com metodologia aberta (Sung et al.; Han et al.). Conclusões sobre "prática comum" têm, portanto, base muito pequena e não são generalizáveis.

---

## 1. Trabalhos levantados

### Verificados com texto aberto [ABERTO]

**SUNG, N.-J.; MA, J.; KIM, T.; CHOI, Y.; CHOI, M.-H.; HONG, M.** Real-time cloth simulation using WebGPU: evaluating limits of high-resolution. arXiv:2507.11794 [cs.GR], 2025. URL: https://arxiv.org/abs/2507.11794 (HTML: https://arxiv.org/html/2507.11794). Preprint, sem evidência de revisão por pares.
- Carga: simulação massa-mola de tecido (compute) + colisão com malhas (esfera, Armadillo 50,6K tri, Dragon 100K tri); 4K a 640K nós.
- Métrica: somente FPS (limiares 30 e 60 fps). Frame time não reportado.
- Hardware/navegador: i7-7700, RTX 4070 Ti 12 GB, Chrome 122; um único sistema.
- WebGL: "biblioteca como Three.js" (three 0.160.1), sem detalhe de implementação.
- Repetições, variância, testes, energia, separação CPU/GPU: não reportados no texto aberto. Diz "todos os experimentos sob as mesmas condições".
- Resultado: WebGPU sustenta 60 fps até 640K nós (limite: buffer de 128 MB); WebGL cai para 3,58 fps com 65,5K nós.

**HAN, Y.; XU, C.; YE, X.; BI, W.; DONG, Z.; MA, Y.** WebSplatter: enabling cross-device efficient Gaussian splatting in web browsers via WebGPU. arXiv:2602.03207, 2026. URL: https://arxiv.org/abs/2602.03207 (HTML: https://arxiv.org/html/2602.03207v1). Preprint.
- Carga: renderização de Gaussian Splatting (7 cenas reais, 0,34M a 6,1M splats), com sort/compute.
- Métricas: mediana do frame time total e por estágio (pré-processamento, sort, render); desvio-padrão e P99 do frame time (apenas num dispositivo, MacBook Air M4, cena garden); pico de VRAM (RTX 3070, garden); comparação visual com CUDA.
- Hardware: RTX 3070, Intel NUC iGPU, MacBook Pro M1, MacBook Air M4, Lenovo MX350, iPhone 15 Pro Max, Redmi K70 Pro, Oppo Find X2. Navegadores: principalmente Chrome; Safari (M4, iPhone); Firefox (RTX 3070), com resultados omitidos onde o WebGPU era bloqueado ou os timestamp queries não eram confiáveis.
- Baselines: 2 WebGL (antimatter15/splat, mkkellogg/GaussianSplats3D) e 2 WebGPU (web-splat, gaussian-splatting-webgpu), commits listados em apêndice. V-Sync ligado em todos os experimentos. Os autores instrumentaram os baselines para medir tempo de execução na GPU, excluindo overhead de CPU/JS.
- Nº de execuções, aquecimento, testes estatísticos, energia, decomposição CPU/GPU detalhada: não especificados no texto aberto. Menciona desconfiança dos timestamp queries do Firefox.

### Apenas resumo/metadados [RESUMO]

**SENGUPTA, S.; WU, N.; VARVELLO, M.; JANA, K.; CHEN, S.; HAN, B.** From WebGL to WebGPU: a reality check of browser-based GPU acceleration. In: ACM INTERNET MEASUREMENT CONFERENCE (IMC), 2025. *Proceedings...* ACM, 2025. p. 1018-1024. DOI: 10.1145/3730567.3764504. Peer-reviewed (conferência). Resumo via OpenAlex; página da ACM bloqueada (403).
- Do resumo: compara WebGL e WebGPU como GPGPU (16 kernels PolyBench + 2 funções CHStone), vários tamanhos de entrada, contra CPU. Conclusões: ambos mais lentos que CPU em entradas pequenas; WebGPU supera WebGL em entradas grandes e em algoritmos com laço dirigido pela CPU.
- **Não é renderização**; é compute. Métricas, hardware, repetições, estatística e energia: NÃO verificados.

**USTA, Z.** WebGPU: a new graphic API for 3D WebGIS applications. *Int. Arch. Photogramm. Remote Sens. Spatial Inf. Sci.*, v. XLVIII-4/W9-2024, p. 377-382, 2024. DOI: 10.5194/isprs-archives-XLVIII-4-W9-2024-377-2024. Anais de evento (ISPRS).
- Da página: compara as duas APIs e mede quanta dado cada uma renderiza a ≥60 fps; conclui WebGPU "substancialmente mais rápido". O PDF não pôde ser lido (conteúdo comprimido); metodologia, hardware, repetições e estatística: NÃO verificados. A página/resumo não menciona repetições nem estatística (isso não prova que o texto completo não as tenha).

**BOHAK, C. et al.** RenderCore: a new WebGPU-based rendering engine for ROOT-EVE. arXiv:2312.11729 [hep-ex], 2023. URL: https://arxiv.org/abs/2312.11729. Preprint.
- Do abstract: descreve motor sobre WebGPU para display de eventos (CMS); compara com Three.js/WebGL só qualitativamente. Corpo do PDF não lido; benchmark quantitativo: NÃO verificado.

### Apenas citação de terceiros ou snippet [SNIPPET], NÃO verificados

- **FRANSSON, E.; HERMANSSON, J.** Performance comparison of WebGPU and WebGL in the Godot game engine, 2023. Citado como ref. [13] por Sung et al. (verificado que a citação existe lá, sem venue/URL). **Não localizei o documento** (provavelmente TCC/dissertação sueca; DiVA não acessível). Secundário diz que mede CPU e GPU frame time/FPS médios e que WebGPU é melhor no Godot. O link IEEE (https://ieeexplore.ieee.org/document/10585437/) que apareceu antes numa busca não abriu, e **não confirmei que corresponda a este trabalho**. Tratar como não verificado. (Isto corrige a atribuição "Fransson et al. 2024" do relatório anterior: a única datação que consegui é 2023, via Sung et al.)
- **Tese "Performance Comparison of WebGPU and WebGL for 2D ... particle systems"** (DiVA, URL: https://www.diva-portal.org/smash/get/diva2:1945245/FULLTEXT02). Conexão recusada; título completo, autor, instituição e metodologia NÃO verificados. O snippet citava ~37 e ~20 milhões de partículas a 60 fps em WebGPU vs ~2,7 e ~2,3 milhões em WebGL (RTX 3080, Chrome Canary); não confirmei esses números.
- **PETER, B.** Particle systems em WebGPU, TCC TU Wien, 2023 (https://cg.tuwien.ac.at/research/publications/2023/PETER-2023-PSW). Pelo snippet, compara variantes WebGPU entre si (instancing vs vertex pulling), **não WebGL**; não aberto.
- **FusionRender** (OpenReview, preprint anônimo; URL do PDF: https://openreview.net/pdf/9279e47ad0e3300efad55781c6b88e63619cb896.pdf). A página exigia verificação do navegador; não abri. Pelo snippet, afirma que frameworks WebGPU ficam atrás de WebGL por comunicação CPU-GPU redundante e propõe batching (ganho mediano 29,3%-122,1% em testes simulados). Sem revisão por pares conhecida.

### Material de praticante (não é pesquisa; só contexto)

- **toji.dev.** WebGPU/WebGL performance comparison best practices (atualizado 4 jun 2024). https://toji.dev/webgpu-best-practices/webgl-performance-comparison. [ABERTO] Recomenda `powerPreference: 'high-performance'` nas duas APIs, logar o adaptador usado, igualar parâmetros do canvas e conteúdo. Não trata de vsync, warm-up, frame time ou estatística.
- Demo/blog ICS Media (https://ics.media/en/entry/230426/): snippet de busca, 10.000 draw calls, WebGL ~30 FPS vs WebGPU ~50 FPS, MacBook Air M1, Chrome 113; não aberto, sem metodologia estatística conhecida.
- Fóruns three.js/Babylon.js/Unity (ex.: https://discourse.threejs.org/t/webgpu-performance-issue/87939): relatos anedóticos de WebGPURenderer mais lento que WebGLRenderer com muitos draw calls não agrupados. Só snippet de busca.

---

## 2. Tabela trabalho × métrica

Só entram linhas com algo verificado. Colunas: FPS = FPS reportado; FT = frame time; Pct = percentis/dispersão do frame time; GPU = tempo de GPU separado de CPU; VRAM; En = energia/potência; Rep = repetições declaradas; Est = teste estatístico/tamanho de efeito/IC; Disp = nº de dispositivos; Nav = nº de navegadores.

| Trabalho | Tipo de carga | FPS | FT | Pct | GPU/CPU | VRAM | En | Rep | Est | Disp | Nav | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sung et al. 2025 | compute (tecido) + colisão | S | N | N | N | N | N | N | N | 1 | 1 | ABERTO |
| Han et al. 2026 (WebSplatter) | splatting real (compute+render) | N | S (mediana) | S (DP e P99, 1 dispositivo) | S (tempo de GPU instrumentado) | S (pico, 1 dispositivo) | N | N | N | 8 | 3 (Chrome, Safari, Firefox) | ABERTO |
| Sengupta et al. 2025 (IMC) | GPGPU (PolyBench) | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | RESUMO |
| Usta 2024 | WebGIS, dados 3D | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | RESUMO |
| Fransson e Hermansson 2023 (Godot) | jogo/sintético | ? (secundário: FPS médio CPU e GPU) | ? | ? | ? (secundário: CPU e GPU) | ? | ? | ? | ? | ? | ? | SNIPPET |
| RenderCore 2023 | display de eventos | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | RESUMO |
| FusionRender (OpenReview) | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | SNIPPET |
| **Este TCC** | cena real (Bistro A-D) + instancing N=500/2000/5000, 4 configs (Three.js e RAW, WebGL e WebGPU) | S | S | N (só médio/máx.) | S (timestamp queries; overhead = FT − GPU) | S (nvidia-smi) | S (10 Hz, J/frame, frames/W) | S (N=9, ordem randomizada em blocos) | S (Welch, d, IC95%, Mann-Whitney) | 1 | 1 | próprio |

(Dispositivos/navegadores do TCC: 1 máquina, RTX 3050 Laptop; navegador conforme protocolo do projeto, confirmar no texto.)

---

## 3. Leitura do que a tabela sustenta

Nota de método: tudo abaixo se limita às linhas com texto aberto (2 trabalhos). As demais células "?" não contam como evidência de ausência.

**O que a tabela mostra (fatos dos 2 trabalhos abertos)**
- Sung et al. (2025) reporta apenas FPS, num único hardware e navegador, sem repetições, variância ou estatística declaradas. Han et al. (2026) usa frame time (mediana), com DP e P99 em um dispositivo, e instrumentou GPU time e VRAM.
- Nenhum dos dois (nos textos abertos) mede energia/potência nem reporta teste estatístico ou tamanho de efeito.
- Han et al. cobre muitos dispositivos e 3 navegadores, e relata que os timestamp queries do Firefox não foram confiáveis, o que é pertinente à validade do GPU time no TCC (que usa Chrome/Windows, a confirmar).
- Cargas encontradas: compute (tecido), splatting. Nenhum dos abertos usa cena arquitetônica real com cargas de textura progressivas nem eixo de instancing/draw calls puro.
- Fontes de praticante e relatos de fórum apontam mais para draw calls (10.000 draws, cubos) do que para a estatística.

**Onde o TCC parece ir além (com a cautela acima)**
- Energia/potência da dGPU e J/frame, frames/W: ausentes nos 2 trabalhos abertos e em todo resumo/snippet que vi (nenhum o menciona), mas "não vi" não é "não existe". Minha busca específica por energia WebGPU vs WebGL não retornou nenhum paper de energia; isso é resultado de busca, não prova.
- Tratamento estatístico (Welch, d, IC95%, Mann-Whitney), N=9 e ordem randomizada em blocos: ausentes nos 2 trabalhos abertos.
- Comparação Three.js vs implementação RAW em ambas as APIs (isola custo do framework): não encontrei equivalente nos abertos. Ponto relevante porque o próprio FusionRender (snippet) e fóruns sugerem que parte da desvantagem do WebGPU vem do framework, não da API.
- Decomposição CPU/GPU com timestamp queries: Han et al. também mede tempo de GPU instrumentado, então o TCC não é único nisso.

**Onde a literatura aberta tem algo que o TCC não tem**
- Mais dispositivos e navegadores (Han et al.: 8 dispositivos, 3 navegadores, inclusive mobile).
- Dispersão e cauda do frame time (DP e P99 em Han et al.). O TCC reporta só média e máximo; o P95/P99 seria uma adição barata, já que os frames amostrados existem (raciocínio meu).
- Cargas de compute (Sung; Han; Sengupta). O TCC é só renderização, o que é escolha de escopo e deve constar em Limitações.

**Não consegui estabelecer**
- Qual é a prática "comum" no campo. Com 2 trabalhos abertos não há base para dizer "a maioria faz X". Para sustentar isso na monografia é preciso abrir ao menos Usta (2024), Sengupta (2025), a tese de Fransson e Hermansson e o FusionRender, e buscar mais (Web3D, I3D, HPG não retornaram nenhum estudo WebGL vs WebGPU comparável; uma busca por Web3D só retornou um paper de instancing em WebGL-three.js e um motor WebGPU, sem comparação de APIs verificada).
- Se algum desses trabalhos usa repetições ou testes estatísticos no texto completo.

## 4. Frase de uso sugerida para a monografia
"Dos estudos comparativos de WebGL e WebGPU cuja metodologia foi possível examinar, os que reportam métricas em ms ou FPS não apresentaram, no texto verificado, repetições com teste de hipóteses, tamanho de efeito ou medições de energia (SUNG et al., 2025; HAN et al., 2026); este trabalho acrescenta essas dimensões sobre uma cena arquitetônica real e um eixo de instancing." Ajustar a "dos estudos examinados" ao N final depois de abrir os demais.
