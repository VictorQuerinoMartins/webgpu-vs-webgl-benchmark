# Limitações Metodológicas — Validação Contra a Literatura Atual (2026-08-24)

> Texto-fonte para a seção de Limitações/Metodologia da monografia. Produzido
> a partir de uma auditoria pedida pelo autor: verificar se cada métrica
> coletada (CLAUDE.md §3) faz sentido frente à literatura técnica atual sobre
> WebGL/WebGPU/Three.js e às limitações conhecidas das ferramentas de
> instrumentação usadas (`nvidia-smi`, contadores do Windows). Adapte a
> redação/tom conforme o padrão do restante do TCC antes de colar no
> `main.tex`. Onde uma citação foi gerada por uma ferramenta de busca/fetch
> automatizada, isso está marcado explicitamente — **confirme o registro
> bibliográfico exato na fonte primária antes de colar em `references.bib`**.

---

## 1. Amostragem de potência via `nvidia-smi` a 1 Hz

> **Atualização 2026-08-24:** resolvido na raiz (opção 2 abaixo) —
> `iniciarAmostradorDeGpu` em `scripts/automatizar_coleta.mjs` foi reescrito
> para usar um único processo `nvidia-smi --loop-ms=100` (10 Hz) com o
> timestamp de precisão de milissegundo do próprio `nvidia-smi`, em vez de
> `setInterval` de 1s chamando `nvidia-smi` a cada tick. `analisar_energia.mjs`
> foi ajustado para detectar automaticamente epoch em ms (formato novo) vs.
> em s (formato antigo do `power_monitor.sh`, mantido compatível). Validado
> com um ensaio real (WebGPU, Cenário A, 60s): 597 amostras (~9,95 Hz),
> timestamps em ms estritamente crescentes, correlação sem erro. A próxima
> recoleta oficial (pendente por causa da atualização do three.js, ver item 3)
> já vai sair a 10 Hz — sem precisar de um spot-check 1Hz-vs-10Hz separado.
>
> **Confirmação empírica do próprio achado do paper citado abaixo:** no CSV
> desse ensaio de validação, a potência ficou **repetida em leituras
> consecutivas** apesar de amostrada a 10Hz — ex.: `10.61 W` em 4 leituras
> seguidas (~316ms) no início do ensaio, e `35.64 W` em outras 4 leituras
> seguidas (~318ms) perto do fim —, enquanto a VRAM (mesma linha do CSV,
> lida na mesma chamada de `nvidia-smi`) mudava a cada leitura no mesmo
> intervalo (ex.: 1165→1167→830→594→509 MB nas mesmas 4 leituras onde a
> potência ficou parada em 35,64 W). Isso é evidência direta de que o sensor
> de potência embarcado da RTX 3050 Laptop **não atualiza de fato a 10Hz**
> — ele tem um ritmo interno de firmware mais lento que o polling do
> `nvidia-smi`, e o utilitário só reporta "a última leitura que o sensor
> tinha", igual ao mecanismo descrito por Yang, Adamek e Armour (SC24) para
> as GPUs A100/H100 que eles testaram. O paper original cobre principalmente
> GPUs de datacenter/desktop; esse padrão observado aqui é, até onde se
> sabe, o primeiro indício documentado do mesmo comportamento numa GPU
> **mobile/laptop** (RTX 3050 Ampere) — vale citar como corroboração
> independente do achado do paper, não como limitação nova. O dataset
> oficial da recoleta (10Hz completo, todos os cenários) permitirá
> quantificar essa taxa de atualização efetiva com rigor (ex.: % de leituras
> consecutivas idênticas, análogo à métrica "25% do tempo amostrado" do
> paper) em vez de só uma observação pontual como esta.
>
> **Onde colocar no `main.tex` (decisão 2026-08-24, revisada):** como
> **parágrafo** dentro de Limitações (aqui mesmo) ou como item extra em
> "Sugestões para Trabalhos Futuros"/fechamento da Conclusão — não como
> seção própria com título dedicado. Uma seção nomeada só pra isso corre o
> risco de soar como scope creep numa banca (o comportamento do sensor de
> potência não é o objetivo de pesquisa do TCC) e de superestimar o peso de
> uma observação de n=1 frente ao estudo sistemático de 70+ GPUs do paper
> original.

**O que era a limitação:** a dimensão Green IT do TCC dependia de `nvidia-smi
--query-gpu=power.draw` amostrado a 1 Hz (`scripts/automatizar_coleta.mjs`,
`iniciarAmostradorDeGpu`). Essa era a única fonte de potência instantânea usada
para calcular Assinatura Energética por Quadro (Joules/Frame) e o
Coeficiente de Eficiência (Frames/Watt).

**Por quê isso é uma limitação:** o sensor de potência embarcado da NVIDIA,
lido via `nvidia-smi`, não amostra continuamente — em algumas gerações de
GPU, o sensor só está "ativo" durante uma fração do intervalo entre leituras
do `nvidia-smi`, o que pode causar sub ou superestimação sistemática do
consumo real, especialmente em cargas de trabalho com variação rápida de
potência (como o Cenário D, onde o Frame Time salta de ~7ms para picos de
2,9s dentro do mesmo ensaio — potenciais transientes de potência entre duas
amostras de 1s ficam invisíveis à sonda atual). Repetições estáveis tendem a
convergir para um viés de aproximadamente -5% no regime permanente
("steady-state"), mas isso não foi caracterizado especificamente para a
RTX 3050 Laptop (o estudo original cobre principalmente GPUs de datacenter e
desktop — A100, H100, RTX 4090/3090).

**Como resolver (ações concretas, em ordem de custo/esforço):**
1. **Mínimo (documental, sem recoletar):** adicionar este parágrafo como
   limitação explícita no capítulo de Limitações, citando o estudo abaixo —
   nenhuma mudança de dado é necessária, só honestidade metodológica.
2. **✅ Feito (2026-08-24):** aumentar a frequência de amostragem do
   `nvidia-smi` de 1 Hz para 10 Hz (`--loop-ms=100`) — implementado
   diretamente no coletor oficial (`iniciarAmostradorDeGpu`), não como
   spot-check à parte. Toda recoleta a partir de agora já sai a 10 Hz.
3. **Caro/fora de escopo:** substituir `nvidia-smi` por um medidor de
   potência físico externo (wattímetro na fonte do notebook, ou uma placa de
   medição inline) — bem mais rigoroso, mas exige hardware que o projeto não
   tem e mede a potência do sistema inteiro, não só da dGPU, então introduz
   outro problema de isolamento.

**Citações:**
- **Verificado em 2026-08-24** (checagem cruzada: título/DOI na ACM Digital
  Library, IEEE Xplore, J-GLOBAL e no programa do próprio SC24, todos
  batendo com o mesmo trio de autores e a mesma alegação central — "só 25%
  do tempo de execução é amostrado em GPUs A100/H100"). O preprint no arXiv
  foi **retitulado** entre o depósito e a publicação final no proceedings —
  são o mesmo trabalho, não dois papers diferentes:
  - **Título publicado (usar este no `references.bib`):** Yang, Zeyu;
    Adamek, Karel; Armour, Wesley. **"Accurate and Convenient Energy
    Measurements for GPUs: A Detailed Study of NVIDIA GPU's Built-In Power
    Sensor"**. In: *Proceedings of SC24: International Conference for High
    Performance Computing, Networking, Storage, and Analysis*, p. 307–323,
    IEEE Computer Society, 2024. DOI: 10.1109/SC41406.2024.00028.
  - **Preprint (título antigo, citar só se preferir a versão de acesso
    aberto):** arXiv:2312.02741, "Part-time Power Measurements: nvidia-smi's
    Lack of Attention" (dez/2023).
  - **Já colada em `references.bib`** (pasta do `main.tex`, `TCC_CComp_2026 (1)/references.bib`, logo após `muralidhar2020`), chave `yang2024nvidiasmi`:
    ```bibtex
    @inproceedings{yang2024nvidiasmi,
      author = {Yang, Zeyu and Adamek, Karel and Armour, Wesley},
      title = {Accurate and Convenient Energy Measurements for {GPUs}: A Detailed Study of {NVIDIA} {GPU}'s Built-In Power Sensor},
      booktitle = {Proceedings of SC24: International Conference for High Performance Computing, Networking, Storage, and Analysis},
      pages = {307--323},
      year = {2024},
      publisher = {IEEE Computer Society},
      doi = {10.1109/SC41406.2024.00028}
    }
    ```
    Use `\cite{yang2024nvidiasmi}` no `main.tex` quando for reescrever a
    limitação de amostragem de potência (após a recoleta).

---

## 2. VRAM medida via `nvidia-smi memory.used` (GPU inteira, não por processo)

**O que é a limitação:** `nvidia-smi --query-gpu=memory.used` reporta o
total de VRAM ocupado na GPU **por todos os processos**, não isolado ao
processo do Chrome sob teste. Esse é o único método usado na coleta oficial
(`scripts/automatizar_coleta.mjs`) para a métrica de VRAM do CLAUDE.md §3.

**Por quê isso é uma limitação:** qualquer outro processo usando a dGPU
durante a coleta (outra janela do Chrome, compositor do Windows, etc.)
contaminaria a leitura. **Isso já foi verificado e não invalida o achado
principal** (ver `resultados/spotcheck_vram/`, spot-check de 2026-08-23):
isolando por processo via contador nativo do Windows (`GPU Process
Memory\Dedicated Usage`), o valor do Chrome sozinho (3502 MB) ficou muito
próximo do valor total do `nvidia-smi` (3860 MB) num ensaio WebGPU N=5000 —
diferença de ~358 MB, compatível com o baseline idle da máquina (~420 MB de
outros apps já abertos). Ou seja, ~91% do número da tabela é atribuível ao
próprio Chrome/WebGPURenderer. **Ressalva que sobra:** esse offset de
ruído de fundo (~350–420 MB) está embutido em **todas** as células da tabela
oficial (WebGL e WebGPU, todos os cenários), porque o método oficial nunca
isolou por processo — não muda a *forma* do achado (WebGL fica praticamente
plano entre N=500→5000 enquanto WebGPU cresce linear com N — um offset
constante não cria essa relação com N), mas os valores *absolutos* nas
tabelas provavelmente superestimam o consumo real do render, principalmente
nas células mais leves (ex.: Cenário A), onde o offset é proporcionalmente
maior.

**Como resolver:**
1. **Já feito (mínimo):** citar o spot-check de validação como nota de
   rodapé no achado de VRAM do eixo de instancing — reforça que o achado não
   é artefato de medição.
2. **Se quiser fechar de vez:** rodar o mesmo protocolo de
   `scripts/spotcheck_vram_processo.mjs` (isolamento por processo via
   contador do Windows) para as 7 combinações oficiais × 2 modos
   (WebGL/WebGPU via Three.js) com pelo menos 3 repetições cada, e comparar
   contra os valores atuais de `medias_por_teste.csv` — permitiria reportar
   VRAM isolada por processo como métrica oficial, não só como spot-check
   avulso. Não é obrigatório para o TCC atual, mas fecharia a lacuna de vez
   para uma extensão futura ou réplica.
3. Documentar no capítulo de Limitações, junto com o número do spot-check
   (3502 MB isolado vs. 3860 MB total, n=1, fora do dataset oficial de n=9).

**Citações:**
- Google/Skia team, discussão pública sobre uso de memória do backend D3D12
  do Dawn (mesmo backend usado pelo WebGPU no Chrome/Windows): alocação de
  1,7 GB de VRAM para uma superfície que "deveria" usar 256 MB (~6,6×) —
  mesma ordem de grandeza dos 2,2×–10,3× observados neste TCC. Fonte:
  grupo de discussão público `skia-discuss`, thread "Performance question on
  Graphite Dawn backend with D3D12":
  https://groups.google.com/g/skia-discuss/c/FDWdJ-uWv08
  ⚠️ Não é uma publicação acadêmica revisada por pares — é evidência
  anedótica/técnica de engenheiros do próprio time do Chrome discutindo o
  comportamento do backend. Cite como tal (ex.: "relato técnico da equipe do
  Chrome/Skia"), não como paper.

---

## 3. O achado do eixo de instancing depende da versão exata do Three.js — e isso não está documentado

> **Atualização 2026-08-24:** resolvido na raiz — `package.json` foi
> atualizado de `three@0.183.2` para `three@0.185.1` (a mais recente
> disponível no npm nesta data), travado sem `^` (nenhum range, igual já era
> antes). Smoke-test manual das 5 combinações principais (WebGL/WebGPU via
> Three.js cenário A, WebGL-RAW/WebGPU-RAW cenário A, WebGPU via Three.js
> instancing N=500) passou sem erros de console/página — `renderer.init()`
> e `renderer.info.render.drawCalls` continuam funcionando como esperado, e
> os release notes de r184/r185 não listam *breaking changes* nessa API.
> **Pendente:** o dataset oficial (`resultados/`, `medias_por_teste.csv`,
> Capítulo RESULTADOS E DISCUSSÃO do `main.tex`) ainda reflete a coleta
> feita sob `0.183.2` — o autor vai rodar `npm run coletar` novamente do
> zero (84 ensaios, ~101 min) para gerar o dataset oficial sob `0.185.1`
> antes de declarar a versão na Metodologia e regenerar tabelas/figuras do
> `main.tex`. Não editar a versão no `main.tex` nem regenerar
> `gerar_graficos.py`/`gerar_tabela_txt.mjs` antes dessa recoleta estar
> completa, para não deixar o texto inconsistente com os números.

**O que era a limitação (antes de 2026-08-24):** o `main.tex` não declarava
em nenhum lugar a versão do Three.js usada (`three@0.183.2`, ver
`package.json`). Isso importava porque
o comportamento do `WebGPURenderer` mudou de direção entre versões da
biblioteca no exato padrão de carga usado no eixo de instancing deste TCC
(muitos meshes clonados via `scene.clone()`, deliberadamente sem
`InstancedMesh`).

**Por quê isso é uma limitação:** issues públicas no repositório do
`three.js` documentam, em versões anteriores (r173–r175, fev/2025), o
**WebGPURenderer sendo 4×–10× mais lento** que o WebGLRenderer especifi-
camente em cenas com muitos meshes não-instanciados — o padrão estrutural
quase idêntico ao eixo de instancing deste TCC. O achado oficial deste TCC é
o **oposto** (WebGPU vence em Frame Time no eixo de instancing, -17,2% a
-30,6% via Three.js). A reconciliação mais provável: o pacote instalado
(`0.183.2`) é posterior a esses releases, e buscas indicam que o sistema de
*bindings* do `WebGPURenderer` foi reorganizado (grupos separados
FRAME/RENDER/OBJECT) especificamente para atacar esse tipo de gargalo, com
relatos de melhorias de "2×–10× em cenas complexas" depois disso. Isso não
invalida o achado — é evidência a favor da hipótese central do TCC (o
gargalo é da maturidade da implementação, não da especificação da API) —
mas sem declarar a versão exata, o resultado não é auditável/reproduzível
por quem tentar replicar com outra versão do Three.js.

**Como resolver:**
1. **Obrigatório, baixo custo:** declarar `three@0.183.2` explicitamente na
   seção de Metodologia (onde o Three.js é descrito como camada de
   abstração, `main.tex` linha ~722) e no capítulo de Limitações.
2. **Recomendado:** adicionar uma nota citando as issues #30560/#31055 como
   evidência de que o comportamento do `WebGPURenderer` é sensível à versão
   — fortalece o argumento de "imaturidade de implementação, não da API" com
   um exemplo concreto e verificável de como o mesmo padrão de carga
   (muitos meshes não-instanciados) produziu resultado oposto em uma versão
   anterior da mesma biblioteca.
3. **Opcional, se houver tempo antes da defesa:** rodar 1 ensaio avulso de
   instancing N=2000/WebGPU numa versão anterior do Three.js (ex.: fixar
   `three@0.175.0` num ambiente separado) para confirmar empiricamente a
   reversão de comportamento — reforçaria a narrativa com dado próprio em
   vez de só citar as issues de terceiros. Não obrigatório; as issues já são
   evidência pública suficiente para a banca.

**Citações:**
- mrdoob/three.js, Issue #30560 — "WebGPURenderer: Current UBO system has
  severe performance issues with many render items" (aberta, r173, fev/2025).
  https://github.com/mrdoob/three.js/issues/30560
- mrdoob/three.js, Issue #31055 — "The performance of the WebGPU Renderer is
  much slower than WebGL" (fechada como duplicata da #30560; r175, 3.000
  cubos não-instanciados, WebGL 60fps vs. WebGPU 15fps).
  https://github.com/mrdoob/three.js/issues/31055
  ⚠️ Issues do GitHub não são fonte acadêmica formal — cite como "relato de
  regressão documentado no rastreador de issues do projeto", com data e
  número da issue, não como publicação. Adequado para uma nota de rodapé de
  limitação, não como referência bibliográfica principal do capítulo.

---

## 4. Assimetria de mipmap entre WebGPU-RAW e WebGL-RAW

> **Atualização 2026-08-24:** resolvido no código — `src/main-raw-webgpu.js`
> agora gera a cadeia completa de mipmaps por textura (função
> `criarGeradorDeMipmaps`, chamada em `createTextureBindGroups`), usando a
> técnica padrão da comunidade WebGPU (blit por render pass, nível a nível,
> já que o WebGPU não tem `gl.generateMipmap` nativo). Validado com
> smoke-test visual em Cenário B (132 texturas) — carregou sem erro de
> página/console e renderizou corretamente. **Correção de escopo
> (2026-08-24):** não afeta só os Cenários B/C/D — `public/objetos/vespa.glb`
> (objeto do eixo de instancing) também tem uma `baseColorTexture`
> (`Vespa_BaseColor`), então o eixo N=500/2000/5000 também estava rodando
> WebGPU-RAW sem mipmap e também é afetado por este fix (1 textura só,
> compartilhada entre todos os clones — custo de geração desprezível, mas o
> efeito na amostragem durante o render vale igual). **Pendente:** como
> qualquer mudança nos três arquivos protegidos pelo CLAUDE.md, isso
> invalida qualquer dado de VRAM/Frame Time de B/C/D **e do eixo de
> instancing** coletado com WebGPU-RAW antes desta data — já estava
> programada uma recoleta completa (itens 1 e 3), então isso só se soma à
> mesma recoleta pendente.

**O que era a limitação (achado pela revisão do subagente
`webgpu-graphics-expert`, 2026-08-24):** `src/main-raw-webgl.js`
(`createGLTexture`) chamava `gl.generateMipmap(gl.TEXTURE_2D)` e usava
filtragem `LINEAR_MIPMAP_LINEAR` (trilinear completa). `src/main-raw-webgpu.js`
criava a `GPUTexture` sem `mipLevelCount` (padrão do spec = 1) e nunca gerava
níveis adicionais — o `sampler` já declarava `mipmapFilter: "linear"`, mas
isso era um no-op sem mais de 1 nível de mip.

**Por quê isso era uma limitação:** os dois lados do experimento RAW não
estavam renderizando a mesma carga de trabalho nos Cenários B/C/D — WebGL-RAW
fazia mais trabalho de amostragem de textura (trilinear, texturas reduzidas a
distância) que WebGPU-RAW (bilinear no único nível full-res, sempre), o que
tende a favorecer artificialmente o desempenho do WebGPU-RAW nesses cenários
por um motivo que não tem relação com a API em si — e sim com uma etapa de
implementação ausente. É esperado tecnicamente: o WebGPU não oferece geração
de mipmap embutida no spec, precisa ser implementada manualmente.

**Como resolver:** já implementado (ver Atualização acima). Alternativa que
não foi escolhida: desativar mipmap também no WebGL-RAW (mais simples, mas
reduziria o rigor visual/de amostragem do WebGL-RAW abaixo do que uma
implementação WebGL razoável faria — optou-se por elevar o WebGPU-RAW ao
nível do WebGL-RAW, não o contrário).

**Citações:**
- webgpufundamentals.org — "WebGPU Importing Textures": "WebGPU currently
  provides no facilities to generate mipmaps." Mantido por ex-engenheiro do
  time Chrome/WebGPU; referência técnica community-padrão, não
  peer-reviewed — cite como tal.
  https://webgpufundamentals.org/webgpu/lessons/webgpu-importing-textures.html

---

## 5. Perfil de velocidade da câmera divergia entre `main.js` e os RAWs

> **Atualização 2026-08-24:** resolvido no código — `src/main-raw-webgpu.js`
> e `src/main-raw-webgl.js` trocaram a função `catmullRomPoint` (Catmull-Rom
> "uniforme", sem reparametrização) por `criarCurvaCentripetal`, que replica
> `THREE.CatmullRomCurve3.getPoint()`/`getPointAt()` (curveType padrão
> `'centripetal'`, `arcLengthDivisions=200`) usado em `main.js`. **Validado
> matematicamente** contra o `THREE.CatmullRomCurve3` real (script avulso,
> não faz parte do repo): erro máximo de `9.6×10⁻¹⁵` em 21 amostras de
> `t` — ruído de ponto flutuante, essencialmente zero. **Validado
> visualmente**: screenshots de WebGL-RAW e WebGPU-RAW no mesmo instante
> (`t≈6.7%` do trajeto) mostram exatamente o mesmo enquadramento — antes do
> fix, cada modo olhava para um ponto ligeiramente diferente da cena no
> mesmo `t`.
>
> **Bug adicional encontrado e corrigido durante a validação (não fazia
> parte do achado original do subagente):** a primeira chamada de
> `getPointAt()` após o `[SPACE]` podia receber `u` negativo — o timestamp
> do primeiro `requestAnimationFrame` pós-clique pode ser anterior ao
> `performance.now()` capturado no listener de `keydown` (o timestamp do rAF
> é definido antes do processamento do evento de input), gerando
> `elapsed`/`t` negativo por 1 quadro. A função antiga (`catmullRomPoint`)
> tolerava isso por acidente (`Math.max(0, Math.min(t, 0.9999))` inline); a
> nova implementação de parametrização por arco não tinha esse clamp e
> retornava `NaN` nesse quadro, quebrando a página (`Cannot read properties
> of undefined`). Corrigido com um clamp defensivo na entrada de
> `getPointAt`. Achado e corrigido via smoke-test end-to-end (Playwright),
> não só leitura de código — reforça o valor de rodar o app de verdade antes
> de aceitar uma correção como pronta.

**O que era a limitação (achado pela revisão do subagente
`webgpu-graphics-expert`, 2026-08-24):** `main.js` usa
`curveAtiva.getPointAt(t)`, que internamente reparametriza por comprimento
de arco (velocidade constante ao longo do trajeto físico). Os arquivos RAW
usavam uma função Catmull-Rom "uniforme" que interpolava `t` diretamente
sem reparametrização — como os 12 waypoints do trilho do Bistro não são
equidistantes, a câmera acelerava/desacelerava de forma diferente entre
`main.js` e os RAWs no mesmo instante `t`. Além disso, `THREE.CatmullRomCurve3`
usa por padrão o tipo `'centripetal'` (evita cúspides/auto-interseção em
pontos não-equidistantes), enquanto a fórmula manual antiga era a variante
"uniforme" clássica — divergência de forma geométrica, não só de velocidade.

**Por quê isso era uma limitação:** os 12 pontos são idênticos entre
`main.js` e os RAWs (Regra 3 respeitada), mas a *interpolação* entre eles
divergia — em um dado `t` dos 60s, a câmera do `main.js` e a dos RAWs podiam
estar olhando para partes diferentes do Bistro, introduzindo ruído não
controlado especificamente no eixo de comparação "Three.js vs RAW" (um dos
quatro modos formais comparados em toda tabela do `main.tex`).

**Como resolver:** já implementado (ver Atualização acima).

**Citações:**
- Código-fonte de `THREE.CatmullRomCurve3` e `Curve.getPointAt`/`getLengths`/
  `getUtoTmapping` (`node_modules/three/src/extras/curves/CatmullRomCurve3.js`
  e `node_modules/three/src/extras/core/Curve.js`, `three@0.185.1`) — fonte
  primária do algoritmo replicado, não uma referência externa.

---

## Resumo executivo (para copiar/colar na seção de Limitações)

| # | Limitação | Status (2026-08-24) | Ação mínima obrigatória |
|---|---|---|---|
| 1 | `nvidia-smi` a 1 Hz tem viés conhecido (~-5%) e cobertura parcial do sensor | **✅ Corrigido no código** — coletor oficial agora amostra a 10 Hz | Citar Yang/Adamek/Armour (`yang2024nvidiasmi`, já em `references.bib`) como limitação residual |
| 2 | VRAM via `nvidia-smi` mede GPU inteira, não por processo | Não invalida — já validado por spot-check (3502MB isolado vs. 3860MB total) | Citar o spot-check como nota de rodapé no achado de VRAM |
| 3 | Versão do Three.js não declarada; achado de instancing é version-dependent | **✅ Corrigido no código** — `three` travado em `0.185.1`; recoleta pendente | Declarar `three@0.185.1` no `main.tex` + citar issues #30560/#31055 |
| 4 | WebGPU-RAW não gerava mipmaps (WebGL-RAW gerava) — carga de textura assimétrica em B/C/D e instancing | **✅ Corrigido no código** — geração manual de mipmap implementada; recoleta pendente | Citar webgpufundamentals.org como referência da ausência de mipmap nativo no WebGPU |
| 5 | Perfil de velocidade da câmera divergia entre `main.js` e os RAWs (waypoints idênticos, interpolação diferente) | **✅ Corrigido no código** — validado matematicamente (erro ~1e-14) e visualmente; recoleta pendente | Nenhuma — código-fonte do three.js é a própria referência |
| 6 | (Não é limitação) Métrica nova: decomposição CPU/GPU via timestamp queries | **✅ Implementado nos 4 modos**; confiável só no Cenário D e instancing (efeito de vsync em A/B/C) | Restringir interpretação de "Overhead de CPU" aos cenários onde o FPS não satura no teto do monitor |

---

## Correções de baixo risco aplicadas junto (achados Tier 2 da revisão do subagente, 2026-08-24)

Três ineficiências neutras (não mudam a carga de trabalho medida, só removem
overhead acidental) foram corrigidas na mesma leva, já que qualquer uma delas
exigiria recoleta de qualquer forma:

- **`main.js`**: `curveAtiva.getPointAt(0)` agora é chamado uma vez antes do
  `[SPACE]` pra aquecer o cache de comprimento de arco do three.js — antes,
  essa primeira chamada (cara) acontecia dentro do primeiro quadro
  cronometrado, podendo contaminar o Frame Time Máximo/FPS Mínimo.
- **`main-raw-webgpu.js`**: `depth.createView()` deixou de ser recriada a
  cada quadro (~3600 alocações desnecessárias por ensaio de 60s); agora é
  cacheada em `depthView` e só recriada no resize.
- **`main-raw-webgpu.js`/`main-raw-webgl.js`**: o overlay de texto (DOM) —
  antes reescrito a cada quadro — agora tem throttle de 150ms (~6,7Hz);
  `metricsLog` continua sendo alimentado a cada quadro, só o texto na tela
  ficou mais espaçado.

**Decisão tomada e não aplicada (2026-08-24):** o estado do WebGL redefinido
a cada quadro sem necessidade (`gl.enable`, `gl.cullFace`, `gl.clearColor`
etc. em `main-raw-webgl.js`, que nunca mudam de valor entre quadros) foi
**mantido como está**, por decisão explícita do autor — como o TCC mede
*overhead por draw call* (não por quadro) e a contagem de draw calls não
muda com essa redefinição, hastear essas chamadas pra fora do loop não
afetaria a validade da comparação, mas também não há necessidade clara de
"otimizar" um comportamento que ninguém pediu pra medir isoladamente.

---

## 6. Nova métrica: Decomposição CPU/GPU via timestamp queries (2026-08-24)

> Isto não é uma limitação corrigida — é uma métrica nova adicionada ao
> CLAUDE.md §3.A, a pedido do autor ("tem algum meio melhor de testar a
> eficiência das APIs que estou deixando passar?"). Reabriu o congelamento
> de código estabelecido mais cedo no mesmo dia — decisão consciente do
> autor, ciente do custo de mais uma correção antes da recoleta oficial.

**O que mede:** Tempo de GPU (ms, tempo real de execução na GPU, isolado
de JS/submissão de comandos/espera de sincronização) e Overhead de CPU
(ms) = Frame Time − Tempo de GPU, por ensaio. Implementado via GPU
timestamp queries nativas: `timestamp-query` do WebGPU (`main-raw-webgpu.js`,
e `main.js` via `trackTimestamp: true` do `WebGPURenderer`, que já tem a
feature embutida) e `EXT_disjoint_timer_query_webgl2` do WebGL2
(`main-raw-webgl.js`, e manualmente em `main.js` pro `THREE.WebGLRenderer`
clássico, que não tem suporte nativo).

**Por que importa:** FPS/Frame Time medem tempo de parede do quadro
inteiro — misturam JS, submissão de comandos e execução real de GPU. Sem
decompor isso, o TCC só conseguia afirmar indiretamente "WebGPU é mais
rápido", sem atribuir quanto da vantagem vem de overhead de CPU reduzido
(a promessa central da API, citada na própria Introdução) vs. trabalho de
GPU genuinamente mais barato.

**Validação:** testado end-to-end nos 4 modos (`npm run coletar` avulso,
dados descartados, não oficiais). No Cenário B (perto do teto de 144Hz do
monitor), os números pareciam contraintuitivos à primeira vista — ver
ressalva abaixo. No eixo de instancing N=2000 (CPU-bound de verdade, muito
abaixo do teto do monitor), o padrão bateu com a literatura: overhead de
CPU do WebGPU-RAW ficou na metade do WebGL-RAW (0,158ms vs. 0,314ms) —
direcionalmente consistente com a promessa central do WebGPU, mesmo que
pequeno em termos absolutos nesse cenário específico (dominado por tempo
de GPU, ~41-50ms).

**Ressalva metodológica importante (já registrada no CLAUDE.md):** nos
Cenários A, B e C, o FPS satura perto do teto de atualização do monitor
(~144Hz, ~6,9ms/quadro) — já documentado no `main.tex` como motivo de usar
Frame Time em vez de FPS como indicador central nesses cenários. O mesmo
problema contamina a métrica nova: quando o quadro termina de renderizar
antes do próximo vsync, o tempo de espera até o vsync entra no "Frame
Time" mas não no "Tempo de GPU" (que mede só a janela de execução real),
inflando artificialmente o "Overhead de CPU" calculado — que nesses
cenários mede principalmente tempo ocioso esperando o monitor, não custo
real de submissão de comandos. **Essa decomposição só é cientificamente
confiável no Cenário D (onde o Frame Time colapsa bem além do teto do
monitor) e no eixo de instancing** (N=2000/5000 especialmente, onde o
Frame Time já passa de dezenas/centenas de ms). Ao escrever os resultados
no `main.tex`, restringir a interpretação de "Overhead de CPU" a esses
cenários, ou normalizar explicitamente por essa ressalva se decidir
reportar A/B/C também.

**Não fazer:** não tentar "corrigir" o efeito de vsync desabilitando
v-sync do navegador ou forçando um FPS cap artificial — isso mudaria a
carga de trabalho real medida em todas as outras métricas (Categoria 1),
não é uma correção neutra. A ressalva sobre onde a métrica é confiável já
resolve o problema sem tocar em mais nada.
