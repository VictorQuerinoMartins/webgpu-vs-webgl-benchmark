# Changes Log

Este arquivo registra, em ordem cronológica e em primeira pessoa, toda
modificação que fiz neste repositório: **o que fiz** e **por quê**, de
forma resumida. Cada nova alteração é adicionada como uma entrada no final
deste arquivo, nunca reescrevendo o histórico anterior.

> Nota: entradas anteriores a 2026-06-22 não fazem parte do contexto de
> nenhuma sessão de chat específica — a referência abaixo foi reconstruída
> a partir do histórico do `git log`, não de memória de conversa.

---

## 2026-04-16 — Compressão dos modelos em formato GLB

- **Arquivo:** commit `eab0d0f feat: Compressão dos modelos em formato glb`.
- **O que:** Converti/comprimi os modelos 3D do Bistro para o formato `.glb`.
- **Porque:** Reduzi o tamanho dos *assets* para viabilizar o carregamento via
rede nos ensaios de *benchmark* (Time to First Frame). *(Sessão anterior, sem
detalhes de implementação disponíveis neste contexto — apenas referência
factual do commit.)*

---

## 2026-06-22 — Criação do experimento de controle WebGPU-RAW

- **Arquivo:** `raw-webgpu.html`, `src/main-raw-webgpu.js`.
- **O que:** Criei um renderizador WebGPU 100% puro (sem Three.js na
renderização; Three.js usado só para descomprimir Draco/GLB), reproduzindo o
mesmo trilho de câmera, cenário e formato de relatório do `main.js`.
- **Porque:** Quis validar se a desvantagem de FPS do WebGPU vs. WebGL
observada via Three.js é uma limitação da API ou da maturidade do
*framework* — precisava isolar a variável "*framework*" com um experimento
de controle.

---

## 2026-06-22 — Correção de inconsistência de versão no AGENTS.md

- **Arquivo:** `AGENTS.md`.
- **O que:** Atualizei três menções à versão `0.162.0` do Three.js para
`0.183.2`.
- **Porque:** O `package.json` instala `0.183.2`, mas o `AGENTS.md` exigia
congelamento em `0.162.0` — inconsistência que comprometeria a credibilidade
metodológica do TCC (regra de congelamento de versões).

---

## 2026-06-22 — Criação do experimento de controle WebGL-RAW (simetria)

- **Arquivo:** `raw-webgl.html`, `src/main-raw-webgl.js`.
- **O que:** Criei a contrapartida em WebGL2 puro do experimento WebGPU-RAW,
mesma arquitetura e formato de relatório.
- **Porque:** O controle estava unilateral (só WebGPU). Sem o equivalente em
WebGL, a banca poderia questionar se o *overhead* medido era exclusivo do
WebGPU ou também presente do lado WebGL — os resultados (WebGPU-RAW 96,4 FPS
vs. WebGL-RAW 64,7 FPS efetivos) confirmaram a vantagem teórica do WebGPU
quando isolado do *framework*.

---

## 2026-06-22 — Extensão dos RAW para suportar texturas e os 3 cenários

- **Arquivo:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`.
- **O que:** Adicionei suporte a `?cenario=a|b|c`, extração de UV e textura
de cor base (`material.map`) dos materiais do GLTF, envio de textura para a
GPU (com deduplicação) e amostragem no *shader*. Placeholder cinza 1×1 para
*meshes* sem textura (Cenário A), mantendo um único *pipeline* para os 3
cenários.
- **Porque:** Os RAW só sabiam desenhar geometria pura (Cenário A). Pra
testar os Cenários B/C (com textura), precisava de um *pipeline* de material
mínimo nos dois renderizadores.

---

## 2026-06-22 — Correção de z-fighting por *culling* incondicional

- **Arquivo:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`.
- **O que:** Tornei o *culling* de face condicional: sem *culling* apenas no
Cenário A (replica o material `DoubleSide` forçado pelo `main.js`) ou quando
o material original do GLTF já é `DoubleSide`; nos demais casos, *culling*
de face traseira (`cullMode: "back"` / `gl.cullFace(BACK)`).
- **Porque:** Os dois RAW desabilitavam *culling* para todos os cenários.
Combinado com geometria fina (folhagem, tecido, toldos) do Cenário C, isso
causava *z-fighting* massivo entre faces de frente e de trás — visualmente
um efeito de "vidro estilhaçado".

---

## 2026-06-22 — Criação do guia de uso dos cenários

- **Arquivo:** `COMO-TESTAR-CENARIOS.md`.
- **O que:** Documentei as 12 combinações de teste (4 modos × 3 cenários),
URLs, passo a passo de ensaio, convenção de nomes de relatório e cuidados de
rigor experimental.
- **Porque:** Quis centralizar as instruções de uso dos 4 modos de
renderização recém-criados.

---

## 2026-06-22 — Correção da extração de vértices (*bug* do InterleavedBuffer)

- **Arquivo:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`.
- **O que:** Passei a extrair posição/normal/UV usando
`attribute.getX(i)/getY(i)/getZ(i)` por vértice, em vez de ler
`attribute.array` diretamente.
- **Porque:** O *fix* de *culling* não resolveu o "vidro estilhaçado" no
Cenário C/B — diagnostiquei via `console.warn` que `pos.array` e `uv.array`
tinham o mesmo tamanho (deveriam ser proporcionais por *itemSize*). Causa: o
DRACOLoader decodifica posição/normal/UV em um único `InterleavedBuffer`
compartilhado; ler `.array` retorna o *buffer* intercalado INTEIRO, não os
valores daquele atributo — corrompendo toda a geometria desde a primeira
versão do RAW (nunca confirmada visualmente no Cenário A). `getX/getY/getZ`
lida corretamente com atributos intercalados. Mantive validação de
coordenadas não-finitas (NaN/Infinity) como rede de segurança para nós com
matriz de mundo singular.

---

## 2026-06-22 — Atualização do guia de uso (limitações conhecidas)

- **Arquivo:** `COMO-TESTAR-CENARIOS.md`.
- **O que:** Atualizei a seção "Limitações conhecidas" de "em investigação"
para "[RESOLVIDO]", documentando a causa raiz do *bug* do InterleavedBuffer.
- **Porque:** Quis manter a documentação consistente com o estado real do
código após a correção.

---

## 2026-06-22 — Criação deste changelog

- **Arquivo:** `CHANGELOG-IA.md` (renomeado depois para `CHANGES-LOG.md`).
- **O que:** Criei este arquivo de registro de modificações.
- **Porque:** Quis manter um registro resumido de toda modificação feita, com
o quê e o porquê, a partir de agora.

---

## 2026-06-22 — Confirmação do *fix* do InterleavedBuffer + alerta sobre powerPreference no Windows

- **Arquivo:** `COMO-TESTAR-CENARIOS.md`.
- **O que:** Adicionei um alerta na seção de pré-requisitos sobre o *bug* do
Chromium que ignora `powerPreference: "high-performance"` em
`requestAdapter()` no Windows ([crbug.com/369219127](https://crbug.com/369219127)),
com instrução para confirmar a GPU ativa via `chrome://gpu`.
- **Porque:** Ao re-testar o WebGPU-RAW, vi o aviso no console; o mesmo log
confirmou 1591 *meshes*/132 texturas carregadas sem nenhum descarte
(validando o *fix* anterior). Como o *hint* de *software* é ignorado pelo
navegador no Windows, a única garantia real de uso da GPU dedicada (Regra 2
do CLAUDE.md) é a configuração no SO — isso precisava estar documentado
explicitamente para não comprometer o rigor experimental.

---

## 2026-06-22 — Log de diagnóstico da GPU selecionada (WebGPU-RAW e WebGL-RAW)

- **Arquivo:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`.
- **O que:** Adicionei `console.log` em `initWebGPU`/`initWebGL` que imprime
a GPU física realmente selecionada — via `adapter.info` no WebGPU e via a
extensão `WEBGL_debug_renderer_info` (`UNMASKED_VENDOR_WEBGL`/
`UNMASKED_RENDERER_WEBGL`) no WebGL.
- **Porque:** Recebi um *dump* do `chrome://gpu` mostrando a iGPU Intel
marcada `*ACTIVE*` e erros repetidos de `SharedTextureMemory::BeginAccess()
failed` / `Error creating wgpu::Texture` no log da GPU (possível fricção de
compartilhamento de textura entre adaptadores diferentes em notebooks
híbridos). Como `chrome://gpu` reflete o contexto da própria aba, não
necessariamente o da página de teste, e o *hint* `powerPreference` é
ignorado no Windows, a única forma confiável de confirmar qual GPU cada
ensaio realmente usou é logar isso diretamente no código, por execução — em
vez de inferir de um *dump* separado.

---

## 2026-06-22 — Correção do passo a passo de GPU dedicada (Windows, não Chrome)

- **Arquivo:** `COMO-TESTAR-CENARIOS.md`.
- **O que:** Reescrevi o passo "garanta GPU dedicada" com caminho explícito e
numerado nas **Configurações do Windows** (`Win + I` → Sistema → Tela →
Gráficos → Procurar → Opções → Alto desempenho), deixando claro que essa
opção **não existe em `chrome://settings`**.
- **Porque:** Vi capturas de tela mostrando essa opção sendo procurada dentro
de `chrome://settings/system` e `chrome://settings/performance` — a
instrução anterior ("Configurações > Sistema > Tela > Gráficos") era ambígua
e dava a entender que era uma configuração do navegador, quando na verdade é
do sistema operacional.

---

## 2026-06-22 — Verificação: correções confirmadas funcionando (WebGPU-RAW, Cenário A)

- **Arquivo:** nenhum — só status, sem alteração de código.
- **O que:** Confirmei, via captura de tela, que após a configuração de GPU
dedicada no Windows o console mostra `[WEBGPU-RAW] GPU selecionada →
vendor=nvidia arch=ampere ... "NVIDIA GeForce RTX 3050 Laptop GPU"` e a cena
renderiza corretamente (rua, prédios, jardineiras, grades — sem nenhum traço
do "vidro estilhaçado").
- **Porque (registro de fechamento):** Confirmei, em conjunto, três
correções anteriores: (1) a extração de vértices via `getX/getY/getZ`
eliminou a geometria fantasma; (2) o log de diagnóstico de GPU funciona e
mostra a dGPU correta; (3) a configuração de GPU dedicada do Windows
(corrigida no passo a passo) realmente direciona o navegador para a RTX
3050. Cenário A validado ponta a ponta — próximo passo é repetir a
verificação visual nos Cenários B/C (com textura) antes de coletar os
números oficiais.

---

## 2026-06-22 — Correção do addressMode da textura (chão sem padrão no WebGPU-RAW)

- **Arquivo:** `src/main-raw-webgpu.js`.
- **O que:** Adicionei `addressModeU: "repeat", addressModeV: "repeat"` no
`device.createSampler()`.
- **Porque:** Depois do *fix* da geometria, notei que o chão (e
provavelmente outras superfícies com UV telado/repetido) aparecia sem
textura visível **só no WebGPU-RAW**, não no WebGL-RAW. Causa: o
`gl.TEXTURE_WRAP_S/T` do WebGL-RAW já estava configurado como `gl.REPEAT`,
mas o *sampler* do WebGPU-RAW não definia `addressMode` — o padrão do
WebGPU é `"clamp-to-edge"`, que esmaga qualquer UV fora de `[0,1]` no pixel
da borda, fazendo superfícies grandes com textura repetida parecerem
lisas/sem padrão.

---

## 2026-06-22 — Correção crítica: alphaMode=BLEND em todos os materiais do *asset* (Cenários B/C)

- **Arquivo:** `src/main.js`.
- **O que:** Para os Cenários B/C, passei a forçar `material.transparent =
false` e `material.depthWrite = true` em todos os materiais carregados do
GLB (antes só o Cenário A recebia tratamento de material). Removi também a
exposição de *debug* temporária `window.scene`/`window.camera` (usada só
para a investigação).
- **Porque:** Vi paredes/texturas "desaparecendo" ao mover a câmera,
reproduzível tanto em WebGL quanto WebGPU via Three.js, mas **ausente nos
dois renderizadores RAW**. Investigação eliminou hipóteses de *frustum
culling* (testado com `frustumCulled = false` no console — *bug*
persistiu) e de suporte a `KHR_materials_specular`/*tonemapping*
(código-fonte do Three.js conferido, sem divergência). Inspecionando o JSON
dos três GLBs (`CenarioBistroA/B/C.glb`) diretamente, confirmei que **os
132 materiais do *asset* exportam `alphaMode: "BLEND"`** — incluindo
concreto, calçada e tijolo, claramente um defeito de exportação, não
intenção de design. O Three.js marca todo material BLEND como `transparent
= true`, o que força reordenação *back-to-front* de praticamente toda a
cena (1591 *meshes*) a cada quadro — ordenação instável que causa
*popping*/desaparecimento de superfícies dependente do ângulo da câmera. Os
RAW nunca implementaram transparência/*blending*, por isso nunca seriam
afetados, independente de qualquer *fix* tentado neles. **⚠️ Impacto nos
dados já coletados:** todos os relatórios
`relatorio_benchmark_webgl_cenario_{b,c}.txt` e
`relatorio_benchmark_webgpu_cenario_{b,c}.txt` em `resultados/` foram
medidos **antes** desta correção — refletiam o *overhead* de ordenação de
transparência quebrada, não a carga real do *asset*. Precisavam ser
re-coletados antes de qualquer conclusão final na monografia.

---

## 2026-06-22 — Criação do Cenário D (mesmo modelo-base de A/B/C, resolução maior)

- **Arquivo:** `public/CenarioBistroD.glb` (novo, gerado), `src/main.js`,
`src/main-raw-webgpu.js`, `src/main-raw-webgl.js`, `COMO-TESTAR-CENARIOS.md`.
- **O que:** Adicionei suporte a `?cenario=d` nos 4 modos de renderização,
apontando para `CenarioBistroD.glb`. Gerei o arquivo a partir de
`public/bistro_exterior_base.glb` (941,85 MB, sem compressão Draco, mesmos
132 materiais com o mesmo defeito `alphaMode: BLEND` encontrado em A/B/C —
confirma que esse é o arquivo-fonte original de onde A/B/C foram derivados)
via `gltf-transform resize --width 2048 --height 2048` seguido de
`gltf-transform draco`. Resultado final: **728,47 MB**.
- **Porque:** Quis retestar um cenário com textura 2K, já que numa tentativa
anterior (antes de todas as correções desta sessão) o teste não estava
usando a GPU dedicada e o Cenário C travava bastante. Com o *pipeline* mais
estável agora, o objetivo é mapear o ponto de ruptura de VRAM antes de
tentar o arquivo bruto (4K, sem compressão) como próximo passo. Sem limite
de tamanho imposto (diferente de B/C) — é esperado e desejado que esse
cenário seja mais pesado que C, possivelmente disparando *OOM* de VRAM na
RTX 3050 (4GB), o que é parte do que quero observar/documentar.

---

## 2026-06-22 — Consolidação: análise final dos 4 modos × 4 cenários

- **Arquivo:** `resultados/conclusões/analise_final_4cenarios.txt` (novo).
- **O que:** Re-coletei todos os relatórios (WebGL/WebGPU via Three.js e
WebGL-RAW/WebGPU-RAW) para os Cenários A/B/C/D após as correções desta
sessão (InterleavedBuffer, alphaMode=BLEND, addressMode, GPU dedicada).
Consolidei tudo em um documento único com 9 seções: tabelas completas,
achados numerados, resumo executivo e ressalvas.
- **Porque / principais achados pós-*fix*:**
  - O WebGL agora vence o WebGPU via Three.js de forma crescente com a carga
    de textura (+0,6% no A até +94,7% no D) — inverteu o que se via antes do
    *fix* do alphaMode, que mascarava parte da geometria.
  - A razão de *draw calls* WebGPU/WebGL **aumentou** após o *fix* (de ~6,4x
    para 10x–19,5x) — a transparência quebrada antes escondia parte do
    problema real de *overhead* do *renderer* WebGPU do Three.js.
  - O Cenário D expõe que o WebGPU sofre engasgos muito mais severos sob
    pressão de VRAM (FPS mínimo 6,66 vs. 18,25 do WebGL) sem que nenhuma das
    APIs trave totalmente.
  - Os 8 testes RAW (A/B/C/D × 2 APIs) revelaram que a média de FPS está
    saturada no V-Sync de 144Hz do monitor em TODOS os casos — inclusive no
    Cenário D (728MB) — tornando a média inútil para comparar as APIs nesse
    nível; só os picos de *frame time* sob estresse (423ms WebGL-RAW vs.
    222ms WebGPU-RAW no D) mostram diferença, com uma amostra de N=1 por API
    que precisa ser repetida antes de virar conclusão.
  - O tempo de carregamento favorece o WebGPU a partir do Cenário B em todos
    os 4 modos — único aspecto onde o WebGPU mostrou vantagem consistente.

---

## 2026-06-23 — Atualização final: engasgo do Cenário D nos RAW com amostra maior (N=3-4)

- **Arquivo:** `resultados/conclusões/analise_final_4cenarios.txt`.
- **O que:** Rodei mais execuções do Cenário D em ambos os RAW (total 4
brutas de cada lado). Identifiquei que 2 das 4 execuções do WebGPU-RAW eram
duplicatas idênticas do mesmo ensaio (mesmo tempo de carregamento, FPS
mínimo, *frame* máximo e total de quadros até a casa decimal) — descartei
uma como redundante, restando N=3 distintas. Atualizei a Seção 6 e o resumo
executivo (Seção 8) do arquivo de conclusões com os números finais.
- **Porque / achado final revisado:** Com amostra maior, o padrão inverteu a
leitura inicial (que era N=1 por API): o **WebGL-RAW engasgou em 3 de 4
execuções (75%)** no Cenário D, com picos de 257–423ms; o **WebGPU-RAW
engasgou em apenas 1 de 3 execuções distintas (33%)**, com um único pico de
222ms e as outras duas completamente limpas (~7ms). Isso é o padrão OPOSTO
ao observado via Three.js (onde o WebGPU sofre mais sob VRAM) — reforça que
a fragilidade sob pressão de memória de textura é uma característica da
implementação do Three.js, não da API WebGPU em si, que se mostrou mais
robusta quando testada sem *framework*. Registrei no próprio arquivo a
ressalva: N=3-4 ainda é amostra modesta para um número estatisticamente
robusto, mas suficiente para apoiar a afirmação qualitativa com razoável
confiança.

---

## 2026-08-06 — Instrumentação da dimensão Green IT (energia) + roteiro de apresentação

- **Arquivo:** `src/main.js`, `src/main-raw-webgl.js`, `src/main-raw-webgpu.js`,
`scripts/analisar_energia.mjs` (novo), `package.json`,
`COMO-TESTAR-CENARIOS.md`, `resultados/conclusões/METODOLOGIA-ENERGIA.md` (novo).
- **O que:** Fiz os três renderizadores exportarem `Timestamp Unix de
Inicio do Ensaio (ms)` no relatório `.txt` (capturado via `Date.now()` no
instante do `[SPACE]`). Criei `scripts/analisar_energia.mjs`, que
correlaciona esse relatório com o log de potência do
`scripts/power_monitor.sh` (`nvidia-smi` a 1Hz) e calcula Joules/*Frame*,
*Frames*/Watt e o consumo acumulado do ensaio (integral trapezoidal da
curva de potência bruta sobre os 60s), conforme a Seção 3.B do CLAUDE.md.
Validei o *script* com dados sintéticos (a integral bateu com o cálculo
manual). Adicionei `npm run analisar-energia`, a Seção 10 do guia de testes
com o passo a passo operacional, e o texto de metodologia (com ressalva
sobre a citação de Feitosa et al., 2017) pronto para adaptação na
monografia.
- **Porque:** A dimensão de Green IT do escopo do TCC (seção 3.B do
CLAUDE.md) ainda não tinha nenhuma instrumentação — as métricas de FPS,
*frame time* e *draw calls* já existiam, mas potência, energia por quadro e
eficiência *Frames*/Watt não eram coletadas nem calculadas em lugar nenhum
do projeto. Também elaborei, junto com o autor do TCC, um roteiro de fala
para a apresentação da banca (15-20 min) e uma simulação de perguntas e
respostas, cobrindo metodologia, arquitetura técnica e o achado central da
inversão de *ranking* WebGL/WebGPU via Three.js vs. RAW.
- **Próximos passos (confirmados após a simulação de banca):**
  1. **Rodar o experimento de controle RAW (WebGL-RAW e WebGPU-RAW) para os
     Cenários B e C** — só o Cenário A tinha contraparte RAW completa até
     então; faltava verificar se a inversão de *ranking* observada via
     Three.js se mantinha, sumia, ou invertia de novo sob carga de textura.
  2. **Concluir a coleta de dados energéticos** — a instrumentação
     (`power_monitor.sh` + `analisar_energia.mjs`) estava pronta e validada,
     mas nenhum ensaio real com `nvidia-smi` rodando em paralelo havia sido
     executado ainda.

---

## 2026-08-06 — Automação da coleta de ensaios (Playwright)

- **Arquivo:** `src/main.js`, `src/main-raw-webgl.js`, `src/main-raw-webgpu.js`,
`scripts/automatizar_coleta.mjs` (novo), `package.json`,
`COMO-TESTAR-CENARIOS.md`.
- **O que:** Fiz os três renderizadores setarem `window.__assetsReady =
true` no exato momento em que ficam prontos para o `[SPACE]` (após
`scene.add(gltf.scene)` no `main.js`; após o registro do *listener* de
teclado, com todos os *uploads* de GPU já concluídos, nos dois RAW). Criei
`scripts/automatizar_coleta.mjs` (`npm run coletar`), que usa
`playwright-core` para abrir o Chrome real do sistema (canal `chrome`,
preservando a preferência de GPU dedicada configurada no Windows), navega
por cada combinação modo×cenário, espera `__assetsReady`, simula o
`[SPACE]`, captura o *download* do relatório via `page.waitForEvent` e
salva já na subpasta certa de `resultados/`, com sufixo `_run<N>` por
repetição. Validei com uma execução real completa (WebGL-RAW, Cenário A,
60s, 8.357 *frames*) — arquivo gerado em
`resultados/web-gl_puro/relatorio_benchmark_webgl-raw_cenario_a_run1.txt`.
- **Porque:** Era uma das duas prioridades que defini depois de uma
simulação de perguntas de banca (junto com adicionar um cenário de *compute
shader*, ainda não implementado), pra resolver o problema de repetições
manuais não padronizadas e tornar a coleta reproduzível por qualquer pessoa
(`npm run dev` + `npm run coletar`), sem depender de um humano cronometrando
60s e apertando espaço pra cada uma das até 64 combinações possíveis (4
modos × 4 cenários × N repetições).

---

## 2026-08-06 — Energia integrada na coleta automatizada (marco: primeiro dado real de Green IT)

- **Arquivo:** `scripts/automatizar_coleta.mjs`.
- **O que:** Fiz `npm run coletar` ligar a dimensão Green IT por padrão: um
amostrador de `nvidia-smi` a 1 Hz embutido no próprio *script* (sem
depender de `power_monitor.sh`/*bash*) roda durante todo o lote, gravando em
`resultados/power_logs/power_log_<timestamp>.csv`; depois de cada relatório
salvo, `scripts/analisar_energia.mjs` é chamado automaticamente sobre esse
log, gerando o `_energia.txt` correlacionado. Flag `--sem-energia` desativa
(para máquinas sem GPU NVIDIA). Validei com uma execução real completa:
WebGL-RAW, Cenário A — **primeiro dado de energia real do projeto**, com
número plausível (21,29 W médio, 0,159 J/*frame*, 6,54 FPS/W, 62 amostras de
potência cobrindo 8.011 *frames* em 60s).
- **Porque:** Fechei duas pendências ao mesmo tempo — a coleta de energia
deixou de precisar de um segundo terminal manual rodando
`power_monitor.sh` sincronizado por *timestamp*; agora é automática e faz
parte do mesmo comando que já coleta FPS/*Frame Time*/*Draw Calls*.

---

## 2026-08-07 — Consolidação em um único procedimento de coleta + métrica de VRAM (MB)

- **Arquivo:** `scripts/automatizar_coleta.mjs`, `scripts/analisar_energia.mjs`,
`scripts/power_monitor.sh`, `COMO-TESTAR-CENARIOS.md`.
- **O que:** Decidi que queria apenas um jeito de rodar os testes, medindo
todas as métricas descritas na pesquisa — duas mudanças:
  1. **VRAM em MB passou a ser medida** — métrica que faltava desde o
     início: o `main.js` só tinha uma contagem de objetos (`renderer.info`,
     não MB) e os RAW não tinham nada. A mesma chamada de `nvidia-smi` que
     já lia `power.draw` passou a ler também `memory.used`
     (`--query-gpu=power.draw,memory.used`), então VRAM sai "de graça" na
     mesma amostra de 1Hz, sem custo adicional e igual pros 4 modos.
     Generalizei `analisar_energia.mjs` (interpolador parametrizado por
     campo, não só potência) para calcular VRAM Média/Mínima/Máxima do
     ensaio e incluir no `_energia.txt`, com retrocompatibilidade pra logs
     antigos de 2 colunas. Atualizei `power_monitor.sh` (legado) pro mesmo
     formato de 3 colunas.
  2. **`npm run coletar` documentado como o único procedimento oficial** —
     reescrevi `COMO-TESTAR-CENARIOS.md`: a seção 4 virou a fonte única de
     verdade, com uma tabela mapeando cada métrica da seção 3 do CLAUDE.md
     pro arquivo/mecanismo exato que a mede. Rebaixei o modo manual ([SPACE]
     direto no navegador) a "debug visual, não gera dado oficial". Renomeei
     a flag `--sem-energia` para `--sem-metricas-gpu`.
  Validei com dois ensaios reais (WebGL-RAW, Cenário A): 813 MB de VRAM
  média (792–851 MB), 22,19 W médio, 0,1665 J/*frame*, 6,24 FPS/W — a
  tabela de métricas do CLAUDE.md agora sai inteira de um único comando.
- **Porque:** Havia duas lacunas reais: (a) VRAM em MB nunca foi medida
corretamente em lugar nenhum do projeto; (b) com duas formas de rodar teste
(manual vs. automatizada) coexistindo, havia risco real de gerar dados
"incompletos" pensando que eram oficiais — já tinha acontecido antes
(relatórios antigos sem *timestamp*, sem energia). Consolidar em um único
caminho documentado elimina essa ambiguidade.

---

## 2026-08-11 — Reversão do cenário de Compute Shader (fora de escopo)

- **Arquivo removido:** `compute-particulas.html`, `src/compute-particulas.js`,
`resultados/conclusões/METODOLOGIA-COMPUTE-SHADER.md`, seção 8 de
`COMO-TESTAR-CENARIOS.md`, modo `webgpu-compute` em
`scripts/automatizar_coleta.mjs`, artefatos de depuração em
`resultados/power_logs/` (`ordem_execucao_*.json` e os dois
`power_log_*.csv` associados a execuções de teste do modo).
- **O que:** Removi por completo o cenário de partículas via *compute
shader* (implementado em 2026-08-07), incluindo código, documentação e
artefatos de teste. Nenhum dado oficial havia sido coletado para esse modo
(`resultados/webgpu_compute/` estava vazio).
- **Porque:** Reavaliei o escopo do TCC: o objetivo é um *benchmark* de
renderização de **modelos arquitetônicos de grande porte** com relevância
de mercado, não um levantamento aberto de toda capacidade categórica do
WebGPU. *Compute shader* (simulação de partículas) não é um caso de uso
representativo de visualização arquitetônica/BIM — é uma capacidade da API
sem contraparte de comparação (WebGL não tem equivalente nativo), o que já
a tornava uma demonstração qualitativa isolada, fora da matriz comparativa
quantitativa que é o núcleo do trabalho. Mantê-la arriscava diluir o foco
do TCC e abrir uma pergunta de banca sobre por que um caso de uso
não-representativo foi incluído.
- **Direção futura (na época, ainda não implementada):** propus substituir o
cenário de partículas por testes derivados de casos de uso reais de
renderização arquitetônica em grande escala — candidatos discutidos:
estresse de *instancing*/*draw calls* (muitas cópias de um objeto, ex.
mobiliário/vegetação repetidos num modelo BIM) e estresse de iluminação
(múltiplas luzes/sombras). Nenhum desses estava implementado ainda; a
decisão de quais entrariam no escopo final dependia de validação contra
literatura/práticas de mercado antes de codificar.

---

## 2026-08-13 — Sincronização do `main.tex` com a reversão do Compute Shader e escopo Exterior do Bistro

- **Arquivo:** `TCC_CComp_2026 (1)/main.tex` (fora deste repositório, em
`C:\Users\yguin\Academy\TCC\`).
- **O que:** O texto do TCC ainda descrevia, em detalhe, o cenário de
Compute Shader/partículas como parte do trabalho (objetivo específico na
introdução e uma seção inteira de metodologia, "Cenário Complementar:
Compute Shader como Demonstração Exclusiva WebGPU") mesmo após a reversão
de código de 2026-08-11 — o texto nunca tinha sido atualizado pra
acompanhar essa decisão de escopo. Removi o *bullet* de objetivo específico
sobre *Compute Shader* e a seção de metodologia completa (identificação da
lacuna, descrição da implementação em WGSL, o *bug* de
`maxComputeWorkgroupsPerDimension` e sua correção). Também corrigi a
descrição do modelo Bistro, que dizia "cena arquitetônica externa e
interna" sem deixar claro que apenas a cena *Exterior* do ativo (distribuído
com *Exterior* e *Interior* separados) foi usada nos quatro cenários
A/B/C/D — agora isso está declarado explicitamente em duas seções (Modelo
de Referência e Seleção e Preparação do Modelo Arquitetônico).
- **Porque:** Reversões e decisões de escopo feitas no código/projeto
precisam se refletir no texto submetido à banca — um trecho de metodologia
descrevendo um cenário que não existe mais no projeto, ou uma descrição
imprecisa do modelo usado, é exatamente o tipo de inconsistência que uma
banca pode questionar. Decidi tratar essa sincronização como regra
permanente: toda escolha metodológica tomada no projeto deve se propagar ao
`main.tex`.

---

## 2026-08-20 — Implementação do cenário de estresse de *Draw Calls* (*instancing*)

- **Arquivo:** `src/main.js`, `src/main-raw-webgl.js`, `src/main-raw-webgpu.js`,
`scripts/automatizar_coleta.mjs`, `COMO-TESTAR-CENARIOS.md`. Reaproveitei
*assets* já existentes (criados em 2026-08-11, nunca antes ligados a
código de renderização): `public/objetos/vespa.glb`,
`scripts/extrair_objeto.mjs`.
- **O que:** Implementei o substituto do cenário de *compute shader*
definido como "direção futura" em 2026-08-11: um cenário que isola a
variável *Draw Calls* (não textura/geometria, como A-D) desenhando N cópias
independentes de um objeto real extraído do próprio Bistro (a Vespa
decorativa) num *grid* 3D regular. Ativei isso por um parâmetro de URL novo
e ortogonal a `cenario`, `?densidade=500|2000|5000`, que quando presente
ignora `cenario`/`ASSET_PATH` por completo e troca a cena do Bistro por N
`Mesh` (Three.js) ou N *draws* manuais (RAW) do `vespa.glb`, dispostos num
*grid* cúbico (lado = `ceil(cbrt(N))`, espaçamento fixo de 4m — calibrado a
partir do *bounding box* real do objeto, ~2.06 x 2.06 x 2.26m, inspecionado
via `@gltf-transform/core`). Criei um trilho de câmera novo, gerado por
fórmula (não *hardcoded* como o do Bistro), que orbita o *grid* com
raio/altura proporcionais ao seu tamanho, pra manter as N cópias dentro do
*frustum* ao longo dos 60s — a Regra 3 do `CLAUDE.md` protege
especificamente a curva do Bistro, não se aplica aqui.

  Decisão técnica central: cada cópia é um objeto de desenho
  **independente**, não `InstancedMesh`/*instancing* de GPU — essa técnica
  colapsaria as N cópias num único *draw call*, o oposto do que o ensaio
  precisa medir (a seção 3.A do `CLAUDE.md` chama *Draw Calls* de "variável
  principal para expor o gargalo de *overhead* do WebGL"). Nos modos
  Three.js isso sai de graça (N `Mesh` compartilhando a mesma
  `BufferGeometry`/`Material` via `.clone()` — reaproveita os dados na
  VRAM, mas cada um ainda emite seu próprio *draw call*). Nos modos RAW,
  que não têm noção de matriz de modelo por objeto, precisei adicionar
  isso: no WebGL, um *uniform* `vec3 uOffset` setado antes de cada
  `gl.drawElements`; no WebGPU, como `device.queue.writeBuffer()` chamado
  repetidamente durante a gravação de um único `GPUCommandEncoder` não gera
  N valores distintos por *draw*, a solução foi pré-criar N *bind groups*
  de *offset* uma única vez no início, e alternar `pass.setBindGroup(2,
  ...)` a cada *draw*.

  O `vespa.glb` tem 3 primitivos (2 *meshes*, 3 materiais) — cada cópia
  gera ~3 *draw calls* reais, então N=500/2000/5000 produzem
  aproximadamente 1.500/6.000/15.000 *draw calls* por quadro. Dei suporte a
  esse cenário em `scripts/automatizar_coleta.mjs` tratando
  `n500`/`n2000`/`n5000` como pseudo-valores de `--cenarios`, traduzindo
  pra `?densidade=N` na URL e pro nome de arquivo `instancing_n<N>`.
  Adicionei uma seção 6.1 em `COMO-TESTAR-CENARIOS.md` explicando o
  cenário e uma tabela de URLs manuais.
- **Porque:** Implementei o cenário de *draw calls* discutido e deixado
pendente em 2026-08-11, com foco em manter o resultado como caso de uso
representativo de BIM (objeto real do próprio modelo, não *asset* externo)
e em documentar o raciocínio de cada decisão técnica, não só o resultado
final. Ainda não havia dados coletados para este cenário nesse momento — o
texto do `main.tex` só seria atualizado depois da coleta oficial.

---

## 2026-08-20 — *Baseline* automático do sistema antes de cada lote de coleta

- **Arquivo:** `scripts/automatizar_coleta.mjs`, `COMO-TESTAR-CENARIOS.md`.
- **O que:** Adicionei `lerEstadoWindows()` e `capturarBaselineSistema()`,
chamadas uma única vez no início de `main()` (antes do ensaio de
aquecimento, antes até do amostrador contínuo de `nvidia-smi` começar), que
gravam `resultados/power_logs/baseline_<timestamp>.txt` com:
temperatura/potência/VRAM/utilização da GPU em *idle*, plano de energia
ativo do Windows (`powercfg /getactivescheme`), alimentação AC/bateria e a
lista de processos com janela visível — via uma única chamada `powershell
-Command` que já serializa tudo em JSON. Se a utilização da GPU já estiver
acima de 10% nesse instante, o terminal emite um aviso explícito de
possível carga residual, sem abortar o lote.
- **Porque:** Quis confirmar e documentar o estado da máquina (apps
abertos, temperatura) antes de cada coleta, depois de ter disparado um
lote de ~2h sem checar isso primeiro (interrompido a tempo). Captura
manual seria fácil de esquecer; automatizar dentro do próprio
`automatizar_coleta.mjs` mantém o princípio de **um único procedimento
oficial**. Validei isoladamente (sem abrir navegador) contra o estado real
da máquina: acusou corretamente ~60-70°C/38% de utilização residual de um
lote interrompido minutos antes, e resfriando ao longo de leituras
sucessivas.

---

## 2026-08-21 — Correção do trilho da câmera (Regra 3): trecho atravessava estrutura coberta

- **Arquivo:** `src/main.js`, `src/main-raw-webgl.js`, `src/main-raw-webgpu.js`,
`CLAUDE.md` (deste repositório e o do diretório pai `TCC/`).
- **O que:** Recebi o relato de que a câmera atravessava uma parede durante
o trajeto de 60s. Investiguei via Playwright (teleporte direto da câmera
para amostras de `curve.getPointAt(t)` em vez de esperar tempo real, usando
*hooks* de *debug* temporários) e confirmei *clipping* sustentado entre
t≈0.30 e t≈0.65 — correspondendo aos pontos de índice 3, 4 e 5 do *array*
de 12 pontos. Renderização com materiais semi-transparentes (`opacity=0.12`,
*X-ray*) e marcadores 3D nos pontos revelou a causa: esse trecho cortava em
linha quase reta por dentro de uma estrutura coberta (toldo/cúpula) ao lado
do café, em vez de contornar a praça circular aberta. Testes empíricos de
deslocamentos perpendiculares simples (2,5 unidades) pioraram o *clipping*
em ambas as direções — a correção final veio de mapear visualmente (vistas
aéreas com os 12 pontos marcados por cor) a área de pavimento aberto da
praça e realocar os 3 pontos para dentro dela:

  | Ponto | Original | Corrigido |
  |---|---|---|
  | 4º (índice 3) | `(2.0, 2.3, 2.1)` | `(3.0, 2.3, 5.0)` |
  | 5º (índice 4) | `(0.0, 2.2, -1.0)` | `(-4.0, 2.2, 2.0)` |
  | 6º (índice 5) | `(-2.0, 2.2, -4.0)` | `(-4.5, 2.2, -3.0)` |

  Os outros 9 pontos não foram alterados. Validei com varredura fina (41
  amostras) da curva real já modificada, cobrindo os 60s inteiros — sem
  *clipping* sustentado. Atualizei `CLAUDE.md` (Regra 3, nos dois
  diretórios) para exigir validação visual antes de qualquer alteração
  futura do trilho, em vez de proibição absoluta.
- **Porque:** A Regra 3 do `CLAUDE.md` diz explicitamente "Nunca altere
essas coordenadas" — alterá-la exigiu confirmação explícita antes de
prosseguir, registrada aqui para não virar uma mudança silenciosa de uma
diretriz de reprodutibilidade central do TCC. Como nenhum dado oficial
havia sido coletado ainda com o trilho antigo neste ponto, corrigir agora
não invalida nenhum dado já coletado. A calibração original de 2026-06-22
provavelmente nunca foi validada visualmente quadro a quadro contra a
geometria real — só testada informalmente, o que permitiu o defeito passar
despercebido por quase dois meses.

---

## 2026-08-21 — Correção da câmera do cenário de *instancing* nos modos RAW

- **Arquivo:** `src/main-raw-webgl.js`, `src/main-raw-webgpu.js`.
- **O que:** Recebi o relato de que, observando um lote rodar, a câmera do
cenário de *instancing* (`?densidade=N`) não mostrava os objetos. Em
`main.js`, o modo *instancing* tem um caso especial explícito —
`camera.lookAt(0, 0, 0)`, olhando pro centro do *grid* — que nunca existia
nos dois RAW: `target` era sempre o próximo ponto da própria órbita, então
a câmera olhava tangente à sua trajetória em vez de para o *grid*. Corrigi
com `target = MODO_INSTANCING ? [0,0,0] : catmullRomPoint(...)` nos dois
pontos de cada arquivo. Validei visualmente (*screenshots* em N=500,
WebGL-RAW e WebGPU-RAW): *grid* inteiro centralizado no quadro ao longo do
trajeto.
- **Porque:** Era um *bug* de paridade entre `main.js` e os dois RAW — a
lógica de *instancing* foi implementada primeiro no Three.js e replicada
nos RAW sem portar esse caso especial do `lookAt`. Como nenhum dado oficial
de *instancing* tinha sido coletado ainda, a correção não invalidou nenhum
resultado existente.

---

## 2026-08-21 — *Script* de consolidação de médias por combinação modo×cenário

- **Arquivo:** `scripts/consolidar_medias.mjs` (novo). Gerado:
`resultados/conclusões/medias_por_teste.csv`.
- **O que:** Criei um *script* que varre
`resultados/{webgl,webgpu,web-gl_puro,web-gpu_puro}/` por relatórios
oficiais (`_run<N>.txt`, ignora `_aquecimento` e formatos pré-automação),
agrupa por combinação modo×cenário (incluindo os 3 níveis de *instancing*)
e calcula a média das repetições de cada métrica — desempenho (FPS, *frame
time*, *draw calls*) e Green IT (potência, energia por quadro, VRAM,
temperatura). Uma linha por combinação, 28 no total (4 modos × 7 cenários)
na primeira execução.
- **Porque:** Quis um arquivo consolidado com as médias por teste, pra
facilitar a escrita da seção de Resultados do `main.tex` sem abrir os 168
arquivos um a um. Reaproveitável: roda de novo automaticamente sobre
qualquer lote futuro sem precisar editar nada.
- **Complemento (2026-08-21):** Criei `scripts/gerar_tabela_txt.mjs`, que lê
o CSV acima e gera `resultados/conclusões/tabela_medias.txt` — tabelas de
texto alinhadas (Cenário × Modo), separadas pelas dimensões da seção 3 do
`CLAUDE.md`. Quis um formato de leitura direta, sem precisar abrir o CSV
numa planilha.

---

## 2026-08-24 — Auditoria metodológica contra a literatura atual (WebGPU/WebGL/Three.js) e 5 correções de código

- **Arquivo gerado:** `resultados/conclusões/LIMITACOES-VALIDACAO-LITERATURA.md`
(texto-fonte completo, com citações, para a seção de Limitações do `main.tex`).
- **O que:** Revisei todas as métricas do CLAUDE.md §3 contra a literatura
técnica atual (*papers*, *issues* públicas do `mrdoob/three.js`,
documentação de engenheiros do Chrome/WebGPU) e contra um *review* de
código feito pelo subagente `webgpu-graphics-expert`. A auditoria resultou
em 5 correções de código, todas *smoke*-testadas (Playwright, todos os
modos) antes de aceitas:
  1. **`three` atualizado de `0.183.2` para `0.185.1`** (`package.json`,
     travado sem `^`) — *issues* públicas (`mrdoob/three.js` #30560,
     #31055) documentam o `WebGPURenderer` sendo 4×-10× mais lento que o
     `WebGLRenderer` em cenas com muitos *meshes* não-instanciados em
     versões anteriores — o padrão de carga do eixo de *instancing* deste
     TCC. O achado oficial é o oposto (WebGPU vence); a versão mais nova
     provavelmente já tinha o gargalo mitigado, mas o `main.tex` nunca
     declarava a versão usada, tornando o resultado não-auditável.
  2. **Amostragem de potência de 1Hz para 10Hz**
     (`scripts/automatizar_coleta.mjs`, `iniciarAmostradorDeGpu`): troquei
     `setInterval` chamando `nvidia-smi` a cada 1s por um único processo
     `nvidia-smi --loop-ms=100`. Ajustei `scripts/analisar_energia.mjs`
     pra detectar automaticamente *epoch* em ms vs. em s (formato antigo).
     Motivado por Yang, Adamek e Armour (SC24), que documentam que o
     sensor de potência da NVIDIA só fica "ativo" por uma fração do tempo
     entre leituras.
  3. **Geração manual de *mipmap* em `src/main-raw-webgpu.js`**: o WebGPU
     não tem `gl.generateMipmap` nativo — antes desta correção, o
     WebGPU-RAW renderizava menos trabalho de amostragem de textura que o
     WebGL-RAW nos Cenários B/C/D **e no eixo de *instancing***,
     favorecendo artificialmente o WebGPU-RAW por um motivo não relacionado
     à API.
  4. **Perfil de velocidade da câmera nos RAWs corrigido**: troquei a
     função `catmullRomPoint` (Catmull-Rom "uniforme") por
     `criarCurvaCentripetal`, que replica
     `THREE.CatmullRomCurve3.getPoint()`/`getPointAt()` usado em `main.js`.
     Antes, com os mesmos 12 *waypoints*, a câmera dos RAWs
     acelerava/desacelerava de forma diferente da câmera do `main.js` no
     mesmo instante `t` — ruído não controlado no eixo "Three.js vs RAW".
     Validei matematicamente contra o `THREE.CatmullRomCurve3` real (erro
     máximo de `9,6×10⁻¹⁵` em 21 amostras) e visualmente. Durante a
     validação, apareceu um *bug* adicional: o primeiro
     `requestAnimationFrame` pós-`[SPACE]` podia gerar `t` negativo e
     `NaN`; corrigi com um *clamp* defensivo.
  5. **Três otimizações neutras de baixo risco**: `curveAtiva.getPointAt(0)`
     aquecido antes do `[SPACE]` em `main.js`; `depth.createView()`
     cacheada em vez de recriada todo quadro em `main-raw-webgpu.js`;
     *overlay* de texto (DOM) com *throttle* de 150ms nos dois RAWs.
     Decidi explicitamente **não** *hastear* o *re-set* de estado do WebGL
     por quadro em `main-raw-webgl.js` (não afeta *draw calls*, que é o
     que o TCC mede).
- **Porque:** Fiz uma auditoria sistemática de "esses dados fazem sentido
com a literatura atual?" — questionando toda decisão metodológica contra a
pesquisa publicada, não só contra a intuição. Aceitei as 5 correções com
validação (matemática, visual, ou *smoke-test* *end-to-end*) antes de mexer
nos três arquivos protegidos pelo CLAUDE.md; todas exigiam uma recoleta
completa do dataset oficial antes de qualquer número entrar no `main.tex`
de novo.

---

## 2026-08-24 — Decomposição CPU/GPU via *timestamp queries* nativas

- **Arquivo:** `src/main.js`, `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`,
`scripts/consolidar_medias.mjs`, `scripts/gerar_tabela_txt.mjs`,
`CLAUDE.md` (as duas cópias).
- **O que:** Implementei uma métrica nova — Tempo de GPU (ms) e *Overhead*
de CPU (ms) por ensaio — medida via *timestamp queries* nativas de cada
API: `timestamp-query` do WebGPU (`GPUQuerySet` tipo `'timestamp'`; no
`main.js`, via a *flag* `trackTimestamp: true` do `WebGPURenderer` do
próprio Three.js) e `EXT_disjoint_timer_query_webgl2` do WebGL2. *Overhead*
de CPU = *Frame Time* − Tempo de GPU. Implementei com *pool* de 4 *slots*
em rotação em cada arquivo (o *begin/end* da *query* é síncrono por
quadro, só a leitura do resultado é assíncrona). Atualizei
`consolidar_medias.mjs`/`gerar_tabela_txt.mjs` pra reconhecer as duas
colunas novas e gerar uma Tabela 3 dedicada. Testei *end-to-end* nos 4
modos via `npm run coletar` avulso (não oficial, dados descartados):
valores plausíveis e coerentes com a literatura — no eixo de *instancing*
N=2000 (*CPU-bound*), o *overhead* de CPU do WebGPU-RAW ficou na metade do
WebGL-RAW (0,158ms vs. 0,314ms), na direção esperada.
- **Porque:** Recebi a pergunta de se havia "algum meio melhor de testar a
eficiência das APIs" que estivesse sendo deixado de lado. FPS/*Frame Time*
(via `requestAnimationFrame`) misturam JS, submissão de comandos e tempo
real de GPU — sem decompor isso, o TCC só podia afirmar indiretamente que
"WebGPU é mais rápido", sem conseguir atribuir quanto da vantagem vem de
*overhead* de CPU reduzido (a promessa central da API) vs. trabalho de GPU
genuinamente mais barato. Essa mudança reabriu o congelamento de código
estabelecido mais cedo no mesmo dia — decisão consciente, ciente de que
adiava a recoleta oficial mais uma vez. **Ressalva registrada em
`CLAUDE.md`:** nos Cenários A/B/C, onde o FPS satura perto do teto do
monitor (~144Hz), o "*Overhead* de CPU" calculado fica contaminado por
tempo de espera de *vsync*, não custo real de submissão — mais confiável
no Cenário D e no eixo de *instancing*.
