# Changelog de Modificações (IA)

Este arquivo registra, em ordem cronológica, toda modificação feita por IA
neste repositório: **o que foi feito** e **por quê**, de forma resumida.
Cada nova alteração deve ser adicionada como uma entrada no final deste
arquivo, nunca reescrevendo o histórico anterior.

> Nota: entradas anteriores a 2026-06-22 não fazem parte do contexto desta
> sessão de chat — a referência abaixo foi reconstruída a partir do
> histórico do `git log`, não de memória da conversa.

---

## 2026-04-16 — Compressão dos modelos em formato GLB
**Commit:** `eab0d0f feat: Compressão dos modelos em formato glb`
**O quê:** Conversão/compressão dos modelos 3D do Bistro para o formato `.glb`.
**Por quê:** Reduzir o tamanho dos assets para viabilizar o carregamento via
rede nos ensaios de benchmark (Time to First Frame). *(Sessão anterior, sem
detalhes de implementação disponíveis neste contexto — apenas referência
factual do commit.)*

---

## 2026-06-22 — Criação do experimento de controle WebGPU-RAW
**Arquivos:** `raw-webgpu.html`, `src/main-raw-webgpu.js`
**O quê:** Renderizador WebGPU 100% puro (sem Three.js na renderização;
Three.js usado só para descomprimir Draco/GLB), reproduzindo o mesmo trilho
de câmera, cenário e formato de relatório do `main.js`.
**Por quê:** Validar se a desvantagem de FPS do WebGPU vs WebGL observada
via Three.js é uma limitação da API ou da maturidade do framework — exigia
isolar a variável "framework" com um experimento de controle.

---

## 2026-06-22 — Correção de inconsistência de versão no AGENTS.md
**Arquivo:** `AGENTS.md`
**O quê:** Três menções à versão `0.162.0` do Three.js foram atualizadas
para `0.183.2`.
**Por quê:** O `package.json` instala `0.183.2`, mas o `AGENTS.md` exigia
congelamento em `0.162.0` — inconsistência que comprometeria a credibilidade
metodológica do TCC (regra de congelamento de versões).

---

## 2026-06-22 — Criação do experimento de controle WebGL-RAW (simetria)
**Arquivos:** `raw-webgl.html`, `src/main-raw-webgl.js`
**O quê:** Contrapartida em WebGL2 puro do experimento WebGPU-RAW, mesma
arquitetura e formato de relatório.
**Por quê:** O controle estava unilateral (só WebGPU). Sem o equivalente em
WebGL, a banca poderia questionar se o overhead medido era exclusivo do
WebGPU ou também presente do lado WebGL — os resultados (WebGPU-RAW 96,4
FPS vs WebGL-RAW 64,7 FPS efetivos) confirmaram a vantagem teórica do
WebGPU quando isolado do framework.

---

## 2026-06-22 — Extensão dos RAW para suportar texturas e os 3 cenários
**Arquivos:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`
**O quê:** Adicionado suporte a `?cenario=a|b|c`, extração de UV e textura
de cor base (`material.map`) dos materiais do GLTF, upload de textura para
a GPU (com deduplicação) e amostragem no shader. Placeholder cinza 1×1 para
meshes sem textura (Cenário A), mantendo um único pipeline para os 3
cenários.
**Por quê:** Os RAW só sabiam desenhar geometria pura (Cenário A). Para
testar os Cenários B/C (com textura), era necessário um pipeline de
material mínimo nos dois renderizadores.

---

## 2026-06-22 — Correção de z-fighting por culling incondicional
**Arquivos:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`
**O quê:** Culling de face passou a ser condicional: sem culling apenas no
Cenário A (replica o material `DoubleSide` forçado pelo `main.js`) ou
quando o material original do GLTF já é `DoubleSide`; nos demais casos,
culling de face traseira (`cullMode: "back"` / `gl.cullFace(BACK)`).
**Por quê:** Os dois RAW desabilitavam culling para todos os cenários.
Combinado com geometria fina (folhagem, tecido, toldos) do Cenário C, isso
causava z-fighting massivo entre faces de frente e de trás — visualmente
um efeito de "vidro estilhaçado".

---

## 2026-06-22 — Criação do guia de uso dos cenários
**Arquivo:** `COMO-TESTAR-CENARIOS.md`
**O quê:** Documentação das 12 combinações de teste (4 modos × 3 cenários),
URLs, passo a passo de ensaio, convenção de nomes de relatório e cuidados
de rigor experimental.
**Por quê:** Pedido explícito do usuário para centralizar instruções de uso
dos 4 modos de renderização recém-criados.

---

## 2026-06-22 — Correção da extração de vértices (bug do InterleavedBuffer)
**Arquivos:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`
**O quê:** A extração de posição/normal/UV passou a usar
`attribute.getX(i)/getY(i)/getZ(i)` por vértice, em vez de ler
`attribute.array` diretamente.
**Por quê:** O fix de culling não resolveu o "vidro estilhaçado" no
Cenário C/B — diagnóstico via `console.warn` revelou que `pos.array` e
`uv.array` tinham o mesmo tamanho (deveriam ser proporcionais por
itemSize). Causa: o DRACOLoader decodifica posição/normal/UV em um único
`InterleavedBuffer` compartilhado; ler `.array` retorna o buffer
intercalado INTEIRO, não os valores daquele atributo — corrompendo toda a
geometria desde a primeira versão do RAW (nunca confirmada visualmente no
Cenário A). `getX/getY/getZ` lida corretamente com atributos intercalados.
Mantida validação de coordenadas não-finitas (NaN/Infinity) como rede de
segurança para nós com matriz de mundo singular.

---

## 2026-06-22 — Atualização do guia de uso (limitações conhecidas)
**Arquivo:** `COMO-TESTAR-CENARIOS.md`
**O quê:** Seção "Limitações conhecidas" atualizada de "em investigação"
para "[RESOLVIDO]", documentando a causa raiz do bug do InterleavedBuffer.
**Por quê:** Manter a documentação consistente com o estado real do código
após a correção.

---

## 2026-06-22 — Criação deste changelog
**Arquivo:** `CHANGELOG-IA.md`
**O quê:** Criado este arquivo de changelog de modificações por IA.
**Por quê:** Pedido explícito do usuário para manter um registro resumido
de toda modificação feita, com o quê e o porquê, a partir de agora.

---

## 2026-06-22 — Confirmação do fix do InterleavedBuffer + alerta sobre powerPreference no Windows
**Arquivo:** `COMO-TESTAR-CENARIOS.md`
**O quê:** Adicionado alerta na seção de pré-requisitos sobre o bug do
Chromium que ignora `powerPreference: "high-performance"` em
`requestAdapter()` no Windows ([crbug.com/369219127](https://crbug.com/369219127)),
com instrução para confirmar a GPU ativa via `chrome://gpu`.
**Por quê:** Usuário reportou o aviso no console ao re-testar o
WebGPU-RAW; o mesmo log confirmou 1591 meshes/132 texturas carregadas sem
nenhum descarte (validando o fix anterior). Como o hint de software é
ignorado pelo navegador no Windows, a única garantia real de uso da GPU
dedicada (Regra 2 do CLAUDE.md) é a configuração no SO — isso precisava
estar documentado explicitamente para não comprometer o rigor experimental.

---

## 2026-06-22 — Log de diagnóstico da GPU selecionada (WebGPU-RAW e WebGL-RAW)
**Arquivos:** `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`
**O quê:** Adicionado `console.log` em `initWebGPU`/`initWebGL` que imprime
a GPU física realmente selecionada — via `adapter.info` no WebGPU e via a
extensão `WEBGL_debug_renderer_info` (`UNMASKED_VENDOR_WEBGL`/
`UNMASKED_RENDERER_WEBGL`) no WebGL.
**Por quê:** Usuário compartilhou um dump do `chrome://gpu` mostrando a
iGPU Intel marcada `*ACTIVE*` e erros repetidos de
`SharedTextureMemory::BeginAccess() failed` / `Error creating wgpu::Texture`
no log da GPU (possível fricção de compartilhamento de textura entre
adaptadores diferentes em notebooks híbridos). Como `chrome://gpu` reflete
o contexto da própria aba, não necessariamente o da página de teste, e o
hint `powerPreference` é ignorado no Windows, a única forma confiável de
confirmar qual GPU cada ensaio realmente usou é logar isso diretamente no
código, por execução — em vez de inferir de um dump separado.

---

## 2026-06-22 — Correção do passo a passo de GPU dedicada (Windows, não Chrome)
**Arquivo:** `COMO-TESTAR-CENARIOS.md`
**O quê:** Reescrito o passo "garanta GPU dedicada" com caminho explícito
e numerado nas **Configurações do Windows** (`Win + I` → Sistema → Tela →
Gráficos → Procurar → Opções → Alto desempenho), deixando claro que essa
opção **não existe em `chrome://settings`**.
**Por quê:** Usuário mostrou capturas de tela procurando essa opção dentro
de `chrome://settings/system` e `chrome://settings/performance` — a
instrução anterior ("Configurações > Sistema > Tela > Gráficos") era
ambígua e dava a entender que era uma configuração do navegador, quando na
verdade é do sistema operacional.

---

## 2026-06-22 — Verificação: correções confirmadas funcionando (WebGPU-RAW, Cenário A)
**Status, sem alteração de código.**
**O quê:** Usuário confirmou via captura de tela que, após a configuração
de GPU dedicada no Windows, o console mostra
`[WEBGPU-RAW] GPU selecionada → vendor=nvidia arch=ampere ... "NVIDIA
GeForce RTX 3050 Laptop GPU"` e a cena renderiza corretamente (rua,
prédios, jardineiras, grades — sem nenhum traço do "vidro estilhaçado").
**Por quê (registro de fechamento):** Confirma, em conjunto, três
correções anteriores: (1) extração de vértices via `getX/getY/getZ`
eliminou a geometria fantasma; (2) o log de diagnóstico de GPU funciona e
mostra a dGPU correta; (3) a configuração de GPU dedicada do Windows
(corrigida no passo a passo) realmente direciona o navegador para a RTX
3050. Cenário A validado ponta a ponta — próximo passo é repetir a
verificação visual nos Cenários B/C (com textura) antes de coletar os
números oficiais.

---

## 2026-06-22 — Correção do addressMode da textura (chão sem padrão no WebGPU-RAW)
**Arquivo:** `src/main-raw-webgpu.js`
**O quê:** Adicionado `addressModeU: "repeat", addressModeV: "repeat"` no
`device.createSampler()`.
**Por quê:** Usuário reportou que, após o fix da geometria, o chão (e
provavelmente outras superfícies com UV telado/repetido) aparecia sem
textura visível **só no WebGPU-RAW**, não no WebGL-RAW. Causa: o
`gl.TEXTURE_WRAP_S/T` do WebGL-RAW já estava configurado como `gl.REPEAT`,
mas o sampler do WebGPU-RAW não definia `addressMode` — o padrão do WebGPU
é `"clamp-to-edge"`, que esmaga qualquer UV fora de `[0,1]` no pixel da
borda, fazendo superfícies grandes com textura repetida parecerem lisas/
sem padrão.

---

## 2026-06-22 — Correção crítica: alphaMode=BLEND em todos os materiais do asset (Cenários B/C)
**Arquivo:** `src/main.js`
**O quê:** Para os Cenários B/C, força `material.transparent = false` e
`material.depthWrite = true` em todos os materiais carregados do GLB
(antes só o Cenário A recebia tratamento de material). Removida também a
exposição de debug temporária `window.scene`/`window.camera` (usada só
para a investigação, não é mais necessária).
**Por quê:** Usuário reportou paredes/texturas "desaparecendo" ao mover a
câmera, reproduzível tanto em WebGL quanto WebGPU via Three.js, mas
**ausente nos dois renderizadores RAW**. Investigação eliminou hipóteses
de frustum culling (testado com `frustumCulled = false` no console — bug
persistiu) e de suporte a `KHR_materials_specular`/tonemapping (código-
fonte do Three.js conferido, sem divergência). Inspecionando o JSON dos
três GLBs (`CenarioBistroA/B/C.glb`) diretamente, foi confirmado que
**os 132 materiais do asset exportam `alphaMode: "BLEND"`** — incluindo
concreto, calçada e tijolo, claramente um defeito de exportação, não
intenção de design. O Three.js marca todo material BLEND como
`transparent = true`, o que força reordenação back-to-front de
praticamente toda a cena (1591 meshes) a cada frame — ordenação instável
que causa popping/desaparecimento de superfícies dependente do ângulo da
câmera. Os RAW nunca implementaram transparência/blending, por isso nunca
seriam afetados, independente de qualquer fix tentado neles.
**⚠️ Impacto nos dados já coletados:** todos os relatórios
`relatorio_benchmark_webgl_cenario_{b,c}.txt` e
`relatorio_benchmark_webgpu_cenario_{b,c}.txt` em `resultados/` foram
medidos **antes** desta correção — refletem o overhead de ordenação de
transparência quebrada, não a carga real do asset. Precisam ser
re-coletados antes de qualquer conclusão final na monografia.

---

## 2026-06-22 — Criação do Cenário D (mesmo modelo-base de A/B/C, resolução maior)
**Arquivos:** `public/CenarioBistroD.glb` (novo, gerado), `src/main.js`,
`src/main-raw-webgpu.js`, `src/main-raw-webgl.js`, `COMO-TESTAR-CENARIOS.md`.
**O quê:** Adicionado suporte a `?cenario=d` nos 4 modos de renderização,
apontando para `CenarioBistroD.glb`. O arquivo foi gerado a partir de
`public/bistro_exterior_base.glb` (941,85 MB, sem compressão Draco, mesmos
132 materiais com o mesmo defeito `alphaMode: BLEND` encontrado em A/B/C —
confirma que esse é o arquivo-fonte original de onde A/B/C foram
derivados) via `gltf-transform resize --width 2048 --height 2048` seguido
de `gltf-transform draco`. Resultado final: **728,47 MB**.
**Por quê:** Usuário quis retestar um cenário com textura 2K, já que numa
tentativa anterior (antes de todas as correções desta sessão) o teste não
estava usando a GPU dedicada e o Cenário C travava bastante. Com o
pipeline mais estável agora, o objetivo é mapear o ponto de ruptura de
VRAM antes de tentar o arquivo bruto (4K, sem compressão) como próximo
passo. Sem limite de tamanho imposto (diferente de B/C) — é esperado e
desejado que esse cenário seja mais pesado que C, possivelmente
disparando OOM de VRAM na RTX 3050 (4GB), o que é parte do que se quer
observar/documentar.

---

## 2026-06-22 — Consolidação: análise final dos 4 modos × 4 cenários
**Arquivo:** `resultados/conclusões/analise_final_4cenarios.txt` (novo).
**O quê:** Usuário re-coletou todos os relatórios (WebGL/WebGPU via
Three.js e WebGL-RAW/WebGPU-RAW) para os Cenários A/B/C/D após as
correções desta sessão (InterleavedBuffer, alphaMode=BLEND, addressMode,
GPU dedicada). Consolidei tudo em um documento único com 9 seções:
tabelas completas, achados numerados, resumo executivo e ressalvas.
**Por quê / principais achados pós-fix:**
- WebGL agora vence o WebGPU via Three.js de forma crescente com a carga
  de textura (+0,6% no A até +94,7% no D) — inverteu o que se via antes
  do fix do alphaMode, que mascarava parte da geometria.
- A razão de draw calls WebGPU/WebGL **aumentou** após o fix (de ~6,4x
  para 10x–19,5x) — a transparência quebrada antes escondia parte do
  problema real de overhead do renderer WebGPU do Three.js.
- Cenário D expõe que o WebGPU sofre engasgos muito mais severos sob
  pressão de VRAM (FPS mínimo 6,66 vs 18,25 do WebGL) sem que nenhuma das
  APIs trave totalmente.
- Os 8 testes RAW (A/B/C/D × 2 APIs) revelaram que a média de FPS está
  saturada no V-Sync de 144Hz do monitor em TODOS os casos — inclusive no
  Cenário D (728MB) — tornando a média inútil para comparar as APIs nesse
  nível; só os picos de frame time sob estresse (423ms WebGL-RAW vs
  222ms WebGPU-RAW no D) mostram diferença, com uma amostra de N=1 por
  API que precisa ser repetida antes de virar conclusão.
- Tempo de carregamento favorece o WebGPU a partir do Cenário B em todos
  os 4 modos — único aspecto onde o WebGPU mostrou vantagem consistente.

---

## 2026-06-23 — Atualização final: engasgo do Cenário D nos RAW com amostra maior (N=3-4)
**Arquivo:** `resultados/conclusões/analise_final_4cenarios.txt`.
**O quê:** Usuário rodou mais execuções do Cenário D em ambos os RAW
(total 4 brutas de cada lado). Identifiquei que 2 das 4 execuções do
WebGPU-RAW eram duplicatas idênticas do mesmo ensaio (mesmo tempo de
carregamento, FPS mínimo, frame máximo e total de frames até a casa
decimal) — descartada uma como redundante, restando N=3 distintas.
Atualizei a Seção 6 e o resumo executivo (Seção 8) do arquivo de
conclusões com os números finais.
**Por quê / achado final revisado:** Com amostra maior, o padrão
inverteu a leitura inicial (que era N=1 por API): o **WebGL-RAW engasgou
em 3 de 4 execuções (75%)** no Cenário D, com picos de 257–423ms; o
**WebGPU-RAW engasgou em apenas 1 de 3 execuções distintas (33%)**, com
um único pico de 222ms e as outras duas completamente limpas (~7ms). Isso
é o padrão OPOSTO ao observado via Three.js (onde o WebGPU sofre mais sob
VRAM) — reforça que a fragilidade sob pressão de memória de textura é uma
característica da implementação do Three.js, não da API WebGPU em si,
que se mostrou mais robusta quando testada sem framework. Ressalva
registrada no próprio arquivo: N=3-4 ainda é amostra modesta para um
número estatisticamente robusto, mas suficiente para apoiar a afirmação
qualitativa com razoável confiança.
