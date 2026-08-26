# Pesquisa Técnica: WebGPU vs. WebGL — Literatura, Arquitetura e Revisão de Código

**Contexto:** este documento apoia o TCC "WebGL e WebGPU em Renderização Arquitetônica de Larga Escala: Um Estudo Comparativo de Desempenho e Eficiência Energética" (Victor Querino Martins, UNESPAR). Consolida três documentos de pesquisa produzidos em sessões anteriores (originalmente `revisao-literatura-webgpu-webgl.md`, `referencia-tecnica-webgpu.md` e `revisao-codigo-webgpu.md`, unificados em 2026-08-26), mantidos aqui como três partes com propósitos distintos e complementares:

- **Parte I — Revisão de Literatura:** situa a metodologia do experimento frente à literatura técnica e científica externa (peer-reviewed, specs, documentação de engenharia), com cada fonte classificada por peso epistêmico.
- **Parte II — Referência Técnica de Arquitetura:** mapeia cada conceito da API WebGPU, contrastado com o modelo do WebGL, para trechos concretos do código deste projeto (`arquivo:linha`), ancorado em spec W3C e documentação oficial.
- **Parte III — Revisão Crítica do Código:** achados de uma leitura do código-fonte real do experimento, ranqueados por severidade — bugs e vieses metodológicos identificados, sem alterar nenhum arquivo do experimento.

Nenhum arquivo-fonte do experimento foi alterado pela produção destas três partes — são apenas relatórios de pesquisa e análise.

---

# Parte I — Revisão de Literatura: WebGPU vs. WebGL — Desempenho e Eficiência Energética

Este documento situa a metodologia do experimento (cenário Bistro Exterior em Three.js, cargas A–D de textura, eixo de instancing N=500/2000/5000, medição de FPS/frame time/draw calls/VRAM/TTFF/potência via `nvidia-smi`) frente à literatura técnica e científica disponível publicamente em agosto de 2026.

Cada fonte é classificada por peso epistêmico: **[peer-reviewed]** (artigo revisado por pares, veículo indexado), **[preprint]** (não revisado formalmente, ex. arXiv), **[spec oficial]** (padrão W3C/Khronos), **[doc. técnica]** (documentação de engenharia de navegador/engine, não é marketing), ou **[blog de fabricante/terceiro]** (conteúdo promocional ou não verificado por revisão de pares). Nenhum número é apresentado sem fonte; onde a literatura não fornece dado quantitativo confiável, isso é dito explicitamente.

## I.1 Overhead de Draw Calls: WebGL vs. WebGPU

### I.1.1 O que a especificação oficial diz

O **WebGPU Explainer** do grupo de trabalho GPU for the Web **[spec oficial]** (https://gpuweb.github.io/gpuweb/explainer/) afirma que o design do WebGL "traces its roots back to the OpenGL 1.0 API released in 1992", o que gera problemas de desempenho tanto de CPU quanto de GPU. A justificativa arquitetural central do WebGPU é que ele permite que aplicações sejam "chatty" — isto é, emitam milhares de chamadas por frame — sem o custo de validação de estado duplicada entre o processo de conteúdo (JavaScript) e o processo de GPU do navegador. Isso acontece porque o WebGPU adota o modelo de **pipeline pré-validado**: todo o estado de renderização (shaders, layout de vértices, blend, etc.) é compilado e validado uma única vez na criação do `GPURenderPipeline`, e não a cada `draw()`. Já no WebGL, cada chamada de desenho dispara validação do estado acumulado na máquina de estados implícita do `WebGLRenderingContext`.

Esse ponto é reforçado por fontes de documentação técnica de engenharia de navegador: o **Chromium WebGPU Technical Report** **[doc. técnica]** (https://chromium.googlesource.com/chromium/src/+/main/docs/security/research/graphics/webgpu_technical_report.md) descreve que, na arquitetura multiprocesso do Chrome, os objetos WebGPU no processo de conteúdo (`GPUBuffer`, `GPUTexture`, `GPURenderPipeline`) são majoritariamente "handles" — os drivers de GPU reais e as alocações grandes (buffers, texturas) vivem inteiramente no processo de GPU. Isso é relevante para a Regra 2 deste TCC (forçar a dGPU via `high-performance`): a fronteira de processo é a mesma independentemente da API, mas o *tipo* de tráfego entre processos muda — no WebGL, cada draw call cruza essa fronteira IPC com validação; no WebGPU, o cruzamento ocorre na submissão do `command buffer` já validado, reduzindo o número de idas e vindas síncronas.

O documento também reconhece explicitamente que o suporte a **multithreading na submissão de comandos** — um dos pilares teóricos da redução de overhead de CPU do WebGPU — ainda **não está implementado** ("not yet") no momento da redação do explainer, com "synchronous object transfer" listado como questão em aberto. Isso é uma ressalva importante: parte do ganho teórico de WebGPU sobre draw calls não vem (ainda) de paralelismo real de submissão em múltiplas threads, mas da eliminação de revalidação de estado repetida e de uma API menos verborrágica por chamada.

### I.1.2 Evidência empírica peer-reviewed

O estudo mais diretamente comparável ao eixo de instancing deste TCC é **Fransson, Hermansson & Hu (2024), "A Comparison of Performance on WebGPU and WebGL in the Godot Game Engine"** **[peer-reviewed]**, publicado nos anais do IEEE GEM 2024 (DOI 10.1109/gem61861.2024.10585437; também disponível como tese de bacharelado no DiVA portal, Blekinge Institute of Technology). A metodologia deles usa exatamente o tipo de teste sintético que este TCC replica com o eixo de instancing: renderizar quantidades crescentes de geometria (de 10 a 50.000 quads/polígonos em lote) e medir o tempo de frame de CPU e GPU no Godot com backend WebGPU vs. WebGL. O achado central — WebGPU mantendo desempenho superior de frame time de CPU e GPU, e sustentando 60 FPS mesmo em cenas de até 640 mil nós, enquanto WebGL degrada antes — é qualitativamente consistente com a hipótese deste TCC de que o gargalo de overhead de CPU do WebGL se manifesta como queda de FPS proporcional a N (densidade de instancing), enquanto o WebGPU escala melhor até se tornar limitado pela GPU. Não foi possível obter o PDF completo (bloqueio de acesso ao servidor do DiVA durante esta pesquisa), então os valores numéricos exatos de FPS por faixa de N não puderam ser verificados diretamente nesta revisão — apenas a direção geral do resultado, relatada de forma consistente em múltiplos resumos de terceiros sobre o mesmo paper.

**Chickerur, Balannavar, Hongekar, Prerna & Jituri (2024), "WebGL vs. WebGPU: A Performance Analysis for Web 3.0"** **[peer-reviewed]**, Procedia Computer Science vol. 233, pp. 919–928 (DOI 10.1016/j.procs.2024.03.281) — **PDF completo obtido em 2026-08-26, substituindo a citação de segunda mão anterior.** A conclusão real do paper é mais modesta do que a citação de segunda mão sugeria: não há menção a "complex shader logic" nem a "range of devices" no texto; a frase real de conclusão é "this study has discovered that WebGPU outperformed WebGL, with noticeably higher frame rates for the same apps. This is probably because WebGPU has better hardware utilization and performance enhancements."

A metodologia interna, agora confirmada, é bem mais simples e menos comparável a este TCC do que o título sugere: dois microbenchmarks sintéticos — um cubo giratório e um scatter plot de partículas — implementados em WebGL e WebGPU com parâmetros idênticos (tamanho/textura/cor do cubo; tamanho/quantidade/velocidade das partículas), hospedados via IPFS e executados no Chrome Canary (única opção em 2023–24, já que WebGPU não era estável em Chrome release). O estresse não isola draw calls por objeto — ele roda **múltiplas instâncias paralelas da aplicação inteira** (15/20/40 abas/processos simultâneos, cada um com 50.000 partículas), e o FPS de cada instância foi lido do overlay de frame rate do DevTools do Chrome e **fotografado com uma câmera externa** (para não gastar recursos com gravação de tela), não capturado programaticamente. Hardware: Intel i5-10210U, Nvidia MX250 2GB, 8GB RAM 2400MHz — uma dGPU de entrada, sem nenhuma menção a forçar `powerPreference: "high-performance"` ou equivalente (o paper não discute o risco de fallback para iGPU). Resultados (Tabela 1 do paper): partículas a 15/20/40 instâncias — WebGPU 72.7/62.3/38.3 fps vs. WebGL 67.5/50.2/30 fps; cubo a 15 instâncias — WebGPU 56.4 vs. WebGL 46.2 fps.

**Avaliação para este TCC:** a direção do achado (WebGPU > WebGL) é consistente com a hipótese deste trabalho, mas a metodologia diverge em quase todos os eixos da Seção I.4 abaixo — cena sintética (não de produção), estresse por instâncias paralelas de app (não por draw calls isolados dentro de um contexto), leitura de FPS por foto de tela (não instrumentação programática), sem métrica de energia, e sem forçamento explícito de dGPU. Não deve ser citado como precedente metodológico deste TCC, apenas como mais um resultado peer-reviewed na mesma direção qualitativa.

**GL2GPU (Han et al., WWW/ACM Web Conference 2025)** **[peer-reviewed]** (DOI 10.1145/3696410.3714785) aborda o problema pelo ângulo de engenharia: como WebGL "hinders rendering performance on modern GPU hardware" comparado a WebGPU, os autores constroem uma camada de tradução dinâmica de chamadas WebGL para WebGPU em tempo de execução, emulando o modelo de estados do WebGL sobre a API mais moderna. O resultado relatado — até 45% de redução média no frame time entre plataformas, preservando consistência visual — é uma evidência indireta, mas forte, de que a maior parte do custo de desempenho do WebGL reside na própria semântica de validação de estado por chamada, e não apenas em diferenças de driver: ao reimplementar a *mesma* API WebGL sobre WebGPU, eles já capturam parte do ganho, sem que a aplicação cliente mude uma linha de código.

Por fim, **Sengupta, Wu, Varvello, Jana, Chen & Han, "From WebGL to WebGPU: A Reality Check of Browser-Based GPU Acceleration"** **[peer-reviewed]**, ACM Internet Measurement Conference (IMC) 2025 (DOI 10.1145/3730567.3764504), é uma fonte que exige leitura cuidadosa: apesar do título sugerir uma comparação geral, o escopo real do paper é **computação de propósito geral (GPGPU)** — 16 kernels do benchmark PolyBench e 2 do CHStone —, não renderização gráfica com draw calls e materiais como neste TCC. O achado de que "WebGL performs better than WebGPU for small inputs... due to lower initial setup overhead" enquanto "WebGPU outperforms WebGL for large inputs" é relevante como analogia (custo de setup fixo do WebGPU pode não compensar em cargas pequenas), mas **não deve ser citado como evidência direta sobre draw calls de renderização** — seria um uso indevido da fonte fora de seu domínio experimental. Isso é importante para o TCC: a "ruptura" documentada no Cenário D e no instancing N=5000 é um regime de carga alta, onde a literatura de GPGPU já aponta a mesma direção (WebGPU favorecido em cargas grandes), mas por um mecanismo diferente (paralelismo de compute, não draw calls).

### I.1.3 Consenso e ausência de consenso

Não existe, na literatura peer-reviewed levantada, um número de consenso para "overhead médio por draw call" em WebGL vs. WebGPU (ex: microssegundos de CPU por chamada) que pudesse ser citado como valor de referência absoluto — apenas comparações relativas de FPS/frame time em cargas específicas de cada estudo, com hardware e engines diferentes entre si (Godot vs. Three.js vs. testes sintéticos de shader). Blog posts técnicos como o comparativo em volumeshaderbm.org **[blog de terceiro, não verificado por revisão de pares]** chegam a citar limiares como "WebGL: ~500 draw calls/frame antes do gargalo de CPU" e "10.000 draw calls a ~30 FPS (WebGL) vs. ~50 FPS (WebGPU)", mas esses números não têm proveniência de hardware/metodologia auditável e **não devem ser citados no corpo do TCC como fato estabelecido** — servem, no máximo, como indicação de que a ordem de grandeza dos limiares de N usados neste TCC (500/2000/5000) está na faixa onde a diferença entre APIs já foi relatada informalmente como visível.

## I.2 Gerenciamento e Alocação de Memória de GPU (VRAM)

### I.2.1 Modelo de memória do WebGPU segundo a especificação

A especificação W3C **[spec oficial]** (https://www.w3.org/TR/webgpu/) e a documentação MDN sobre `GPUBuffer` **[doc. técnica]** descrevem um modelo de **transferência explícita de propriedade** (ownership transfer) entre CPU e GPU: `GPUBuffer` e `GPUTexture` são "os recursos físicos apoiados por memória de GPU"; o mapeamento de um buffer para acesso da CPU (`mapAsync()` → `getMappedRange()` → `unmap()`) é assíncrono e a especificação garante que, a qualquer momento, apenas um lado (CPU ou GPU) tem acesso ao recurso — "no race is possible", nas palavras do explainer. Isso contrasta com o modelo do WebGL, onde o navegador gerencia buffers de forma mais implícita via chamadas síncronas (`bufferData`, `texImage2D`) sem um contrato explícito de mapeamento/desmapeamento.

Do ponto de vista de **quem aloca e libera** a memória, ambos os modelos dependem, em última instância, do driver da GPU e do processo de GPU do navegador — o WebGPU não expõe alocação/liberação de VRAM "crua" como uma API nativa Vulkan/D3D12 faria; ele adiciona uma camada de contrato explícito sobre o mesmo processo de GPU do Chromium descrito na Seção I.1.1. Isso é relevante porque significa que a métrica de VRAM medida externamente por `nvidia-smi` (ver Seção I.3) reflete o comportamento do driver/processo de GPU, não uma contagem determinística exposta pela API — nenhuma das duas APIs garante que "X bytes pedidos = X bytes reservados na VRAM", por causa de alinhamento, mipmaps automáticos e políticas internas do driver.

### I.2.2 Custo de textura é dominado pelo formato, não pela API

Um achado tecnicamente sólido, embora de fonte de **doc. técnica/blog de especialista reconhecido** (Don McCurdy, mantenedor de ferramentas glTF/Three.js amplamente citado na comunidade, https://www.donmccurdy.com/2024/02/11/web-texture-formats/), é que o consumo de VRAM de uma textura decodificada é dominado pela fórmula `largura × altura × 4 bytes × 1.333` (fator de mipmaps), **independentemente de qual API de renderização** a consome — uma textura 4096×4096 com mipmaps consome ~90 MB de VRAM decodificada seja em WebGL seja em WebGPU, porque ambas eventualmente decodificam para o mesmo formato de textura na GPU quando a fonte é PNG/JPEG (como é o caso dos Cenários B, C e D deste TCC, que usam texturas PNG). O artigo não estabelece nenhuma distinção de gerenciamento de memória de textura entre WebGL e WebGPU — ambos "enfrentam os mesmos desafios de descompressão e upload".

**Implicação direta para este TCC:** se a progressão A→B→C→D mostrar VRAM diferente entre WebGL e WebGPU para a *mesma* textura PNG decodificada, essa diferença provavelmente não vem do formato de textura em si (que é idêntico nos dois casos), mas de **overhead de runtime** — estruturas auxiliares do driver, double-buffering de recursos, staging buffers do WebGPU para upload, ou política de retenção de mipmaps/comandos pendentes. Isso é uma hipótese razoável para explicar achados de VRAM mais alta no WebGPU (já observados e validados via spot-check por processo neste projeto — ver Parte III, achado 1, para a causa arquitetural investigada diretamente no código do Three.js), mas **não há uma fonte peer-reviewed encontrada nesta pesquisa que quantifique esse overhead de runtime especificamente para WebGPU vs. WebGL** — é uma lacuna real da literatura (ver Seção I.5).

### I.2.3 Ferramentas de terceiros para introspecção de memória

A ferramenta `webgl-memory` (Greggman, https://github.com/greggman/webgl-memory) **[doc. técnica/ferramenta de terceiro]** é citada como um rastreador de memória aproximado para WebGL, mas o próprio autor documenta que ela é "apenas um palpite", já que GPUs diferentes têm requisitos internos distintos (expansão de RGB para RGBA, requisitos de alinhamento). Isso reforça metodologicamente a escolha deste TCC de medir VRAM externamente via `nvidia-smi` por processo, em vez de instrumentação in-page — instrumentação in-page no WebGL é reconhecidamente uma estimativa, não uma medição fiel de VRAM real alocada no driver.

## I.3 Eficiência Energética / Green IT em Renderização Gráfica no Navegador

Esta é a dimensão com a lacuna de literatura mais evidente — a pesquisa não encontrou nenhum estudo peer-reviewed que meça diretamente potência de dGPU via `nvidia-smi` especificamente para comparar WebGL vs. WebGPU em renderização 3D. Os achados abaixo são os mais próximos disponíveis, por analogia metodológica ou por tratarem de uma das duas metades do problema (medição de energia de GPU, ou eficiência energética de navegadores em geral).

### I.3.1 Confiabilidade do `nvidia-smi` como instrumento de medição

**Sun, Geimer, Beckingsale, et al. (ou equivalente — título "Part-time Power Measurements: nvidia-smi's Lack of Attention")** **[preprint arXiv, 2312.02741]** (https://arxiv.org/abs/2312.02741) é o achado metodologicamente mais crítico para este TCC. O estudo desenvolveu microbenchmarks testados em mais de 70 GPUs NVIDIA de diferentes gerações e descobriu que, em GPUs A100/H100 (arquiteturas de datacenter), **apenas 25% do tempo de execução é efetivamente amostrado** pelo sensor de potência que o `nvidia-smi` reporta — nos outros 75% do tempo, a GPU pode estar consumindo potência drasticamente diferente sem que isso apareça na leitura. Comparando com medidores de potência externos, os autores conseguiram reduzir o erro médio de medição energética em 35% (chegando a 65% em casos específicos) aplicando correções.

**Ressalva importante para este TCC:** o paper caracteriza esse problema principalmente em GPUs de datacenter (A100/H100), não necessariamente na RTX 3050 Laptop usada neste experimento — GPUs de consumo/laptop têm implementação de sensor de potência diferente (e historicamente mais simples) das GPUs de servidor. Não é correto extrapolar diretamente o número "25% do tempo amostrado" para a RTX 3050 sem uma fonte que trate especificamente de GPUs da série de consumo/laptop. O que **pode** ser citado com segurança é o princípio geral: `nvidia-smi` tem uma cadência de amostragem e um mecanismo de sensor com limitações documentadas. A amostragem oficial deste projeto foi elevada de 1 Hz para 10 Hz em 2026-08-24 (`--loop-ms=100`) justamente motivada por essa literatura (ver referência ao segundo achado abaixo) — isso mitiga, mas não elimina, a limitação: é uma taxa ainda mais baixa que a cadência que idealmente capturaria todos os transientes de potência, e merece ser explicitamente reconhecida na seção de limitações do TCC, não uma falha exclusiva deste experimento (a mesma limitação afeta virtualmente todo benchmark que usa `nvidia-smi` para medir energia, incluindo grande parte da literatura de HPC).

Um segundo achado citado na mesma linha de pesquisa (via ACM SC 2024, "Accurate and Convenient Energy Measurements for GPUs", DOI 10.1109/SC41406.2024.00028) **[peer-reviewed]** reporta, em validação com medidor externo, correlação de 0.9986 (com um offset constante de energia de componentes periféricos) em algumas condições, mas **baixa correlação por época** (per-epoch) em outras — ou seja, o `nvidia-smi` pode ser razoavelmente confiável para **energia total acumulada** ao longo de um período longo (compatível com a métrica "Consumo Acumulado do Ensaio (Joules/Wh)" deste TCC, que integra 60 segundos inteiros), mas menos confiável para atribuir energia a eventos curtos e específicos (o que seria um problema maior para a métrica "Assinatura Energética por Quadro (Joules)" deste TCC, calculada por frame individual a partir de uma amostra de potência interpolada entre amostras). Esse mesmo estudo é a fonte citada no código do projeto (`scripts/automatizar_coleta.mjs`) para a decisão de amostrar a 10 Hz em vez de 1 Hz.

### I.3.2 Eficiência energética de renderização gráfica: sinais indiretos

Não foi localizado um estudo peer-reviewed medindo "frames por watt" ou "joules por frame" para APIs gráficas web. Os sinais mais próximos encontrados:

- Um artigo de terceiro (blog, não peer-reviewed) sobre eficiência energética de navegadores relata que "a GPU é um abismo de energia, podendo variar de 25 a 350 W" durante renderização, e que a potência de um shader depende de sua complexidade computacional e do tamanho do canvas — um princípio consistente com a decisão metodológica deste TCC de escalar carga por resolução de textura (A–D) e por contagem de geometria (instancing), já que ambos os eixos afetam diretamente o trabalho de shading/fragmentos e vértices por frame, respectivamente. **[blog de terceiro — usar apenas como intuição de engenharia, não como dado citável]**.
- **"Comparative Analysis of Energy Efficiency in Desktop Web Browsers: Towards Sustainable Software Applications"** **[peer-reviewed, ResearchGate/publicação indexada]** trata de eficiência energética comparando navegadores (Chrome/Firefox/Safari) como um todo, não APIs gráficas internas ao navegador — o acesso ao texto completo foi bloqueado (403) durante esta pesquisa, então não é possível confirmar se há alguma menção a GPU/WebGL/WebGPU no corpo do artigo; a citação aqui é apenas para registrar que a "eficiência energética de renderização web" como campo de estudo mais amplo existe e é ativo, mesmo que a interseção específica com WebGPU/WebGL pareça inexistente na literatura revisada por pares até o momento desta pesquisa.
- Por analogia metodológica de domínio adjacente (não renderização, mas inferência de ML em GPU), o preprint **"LLM Inference at the Edge..."** **[preprint arXiv, 2603.23640]** usa exatamente o conceito de "energy proportionality" (W por unidade de trabalho — no caso deles, tokens/segundo; no caso deste TCC, frames/segundo) para uma RTX 4050 Laptop, GPU da mesma geração/classe da RTX 3050 Laptop deste TCC. O valor relatado (0.259 W por tok/s a 131.7 tok/s / 34.1 W) não é diretamente aplicável a renderização gráfica, mas confirma que o conceito de "coeficiente de eficiência por watt" (equivalente ao "Frames/W" definido no CLAUDE.md deste TCC) já é uma métrica estabelecida em outras cargas de trabalho de GPU, o que dá precedente conceitual — ainda que não numérico — à métrica proposta neste TCC.

### I.3.3 Conclusão desta seção

**A dimensão Green IT deste TCC é, até onde esta pesquisa conseguiu verificar, pouco ou nada precedida na literatura peer-reviewed especificamente para comparação WebGL vs. WebGPU.** Isso é simultaneamente uma oportunidade de contribuição original (o TCC pode ser citável como um dos primeiros a cruzar essas duas dimensões) e um risco de defesa: não há benchmark externo publicado para validar se a ordem de grandeza dos Joules/frame ou Frames/W medidos é plausível, e a limitação conhecida do `nvidia-smi` (Seção I.3.1) precisa ser assumida explicitamente como limitação metodológica, não escondida.

## I.4 Metodologias de Estudos Comparativos de APIs Gráficas

Os estudos peer-reviewed revisados nas Seções I.1–I.2 revelam um padrão comum de como comparações WebGL vs. WebGPU são conduzidas na literatura, e onde a metodologia deste TCC diverge (para melhor ou pior):

| Aspecto metodológico | Padrão na literatura revisada | Metodologia deste TCC |
|---|---|---|
| **Variável de carga isolada** | Testes sintéticos escalando uma variável por vez (contagem de polígonos/quads no estudo Godot; tamanho de input nos kernels GPGPU do IMC 2025) | Dois eixos paralelos e isolados: textura (A–D) e draw calls/instancing (N=500/2000/5000) — consistente com a prática de isolar variáveis, e mais amplo que a maioria dos estudos revisados, que tipicamente isolam só uma dimensão |
| **Cena de teste** | Predominantemente cenas sintéticas/primitivas (quads, polígonos genéricos), não uma cena de produção com geometria e materiais reais | Amazon Lumberyard Bistro (cena de produção real, amplamente usada como benchmark de referência na indústria de renderização) — maior validade externa, mas também mais variáveis de confusão (materiais variados, iluminação, número de nós) do que um teste sintético controlado |
| **Hardware** | Cada estudo usa hardware distinto e não padronizado entre si (GPUs de datacenter no paper de nvidia-smi, hardware não especificado nos artigos bloqueados) | Hardware único e fixo documentado (RTX 3050 Laptop, i7-11800H) — forte para reprodutibilidade interna, mas os resultados não são diretamente generalizáveis para outras GPUs, uma limitação que a maioria dos estudos da área compartilha |
| **Métrica de energia** | Ausente na maioria dos estudos de renderização; presente apenas em domínios adjacentes (HPC, inferência ML) usando instrumentação de mais alto rigor (medidores externos, correção de amostragem) | `nvidia-smi` a 10 Hz sem medidor externo de validação — mais fraco que o padrão-ouro identificado na literatura de medição de energia de GPU (Seção I.3.1), mas alinhado ao que é praticamente viável em um TCC sem acesso a instrumentação de laboratório |
| **Forçamento de dGPU** | Não discutido explicitamente nos estudos revisados (presumem GPU dedicada disponível) | Regra 2 do CLAUDE.md exige `powerPreference: "high-performance"` e `await renderer.init()` — este é um cuidado metodológico *mais explícito* que o observado na literatura revisada, e vale a pena destacar como boa prática do TCC |
| **Draw calls como variável nomeada** | Presente no estudo Godot (via contagem de objetos), ausente nos demais como métrica reportada diretamente (eles reportam FPS/frame time agregados) | Draw calls é uma métrica de primeira classe medida diretamente (Seção 3.A do CLAUDE.md), não apenas inferida do FPS — mais granular que a maior parte da literatura revisada |

## I.5 Lacunas e Riscos

1. **Ausência quase total de precedente peer-reviewed para a dimensão Green IT em renderização web.** Nenhuma fonte encontrada mede Joules/frame ou Frames/Watt para WebGL vs. WebGPU. Isso fortalece o argumento de originalidade do TCC, mas significa que não há benchmark externo contra o qual validar a plausibilidade dos números absolutos — a defesa precisará se apoiar em raciocínio de primeiros princípios (ex: mais draw calls → mais ciclos de CPU/GPU ociosos entre submissões → menor eficiência energética por frame) em vez de comparação com trabalhos anteriores.

2. **Limitação conhecida e documentada do `nvidia-smi` como instrumento de energia (arXiv 2312.02741; ACM SC 2024).** Mesmo com a amostragem já elevada para 10 Hz, o princípio geral (potência varia mais rápido do que o sensor consegue capturar de forma contínua, especialmente sob draw calls curtos e picos de renderização) é bem estabelecido e vale reconhecer explicitamente. **Recomenda-se que a seção de limitações do TCC cite essa literatura explicitamente** em vez de apresentar os números de energia como precisos sem ressalva — isso é esperado de um trabalho que "visa ser publicável" (ver memória de rigor metodológico do projeto).

3. **VRAM mais alta no WebGPU (achado já observado e validado por spot-check neste projeto) não tem explicação mecanística confirmada em fonte peer-reviewed.** A literatura de gerenciamento de memória (W3C spec, explainer, Chromium technical report) descreve o *modelo* de propriedade explícita do WebGPU, mas nenhuma fonte encontrada quantifica overhead de runtime (staging buffers, estruturas do driver) comparado ao WebGL para a mesma textura decodificada. O TCC pode reportar o achado empírico com confiança (já validado por spot-check próprio e com causa arquitetural investigada diretamente no código-fonte do Three.js — ver Parte III, achado 1), mas deve evitar afirmar a *causa* exata sem qualificar como hipótese do autor onde a literatura externa não confirma.

4. **O paper "From WebGL to WebGPU: A Reality Check" (ACM IMC 2025) trata de GPGPU/compute, não de renderização com draw calls e materiais** — risco real de má-citação se usado descuidadamente como evidência direta sobre a hipótese central deste TCC (overhead de draw calls em cenas texturizadas). Deve ser citado apenas como analogia de "custo de setup fixo do WebGPU compensando em cargas grandes", nunca como medição direta do fenômeno estudado aqui.

5. **A maior parte da literatura de comparação de FPS usa cenas sintéticas (quads/polígonos genéricos), não uma cena de produção como o Bistro.** Isso é uma força do TCC (maior validade externa/realismo), mas também significa que não há um estudo comparável usando geometria e materiais de produção contra os quais calibrar a magnitude esperada de ganho de FPS — a comparação com a literatura só pode ser feita na *direção* do efeito (WebGPU melhor em carga alta), não na *magnitude*.

6. **Números de limiar de draw calls citados em blogs não-revisados** (ex.: "~500 draw calls/frame" como limite de gargalo do WebGL, "10k draw calls → 30 vs. 50 FPS") não devem ser citados no corpo do TCC como fato — foram descartados desta revisão como fonte primária pela mesma razão que a persona deste projeto exige: ausência de proveniência de hardware/metodologia auditável. Se o TCC quiser comparar magnitude, deve usar apenas os três artigos peer-reviewed citados na Seção I.1.2 e a tese do BTH, idealmente obtendo acesso completo aos PDFs (o acesso ficou bloqueado por paywall/anti-bot durante esta pesquisa para Procedia/ScienceDirect, ResearchGate e DiVA — vale tentar acesso institucional da UNESPAR ou equivalente legal de biblioteca para extrair os números exatos de FPS por N antes da defesa).

7. **Multithreading de submissão de comandos — um dos argumentos teóricos mais citados a favor do WebGPU — é declarado como "não implementado ainda" no próprio explainer oficial do W3C.** Isso significa que parte do ganho teórico de WebGPU sobre WebGL pode não estar realizado nos navegadores atuais (Chrome/Edge, presumivelmente os usados neste TCC) pelo mecanismo comumente citado (paralelismo de CPU), e sim por outros fatores (menos validação por chamada, pipelines pré-compilados). Vale verificar explicitamente, ao escrever a discussão teórica do TCC, se essa afirmação do explainer ainda está atualizada na versão do Chromium usada nos ensaios — citar a data de acesso do explainer e, se possível, o changelog do Chromium sobre WebGPU multithreading.

## Referências consultadas na Parte I (com URL e classificação)

- W3C, **WebGPU** (especificação oficial) — [spec oficial] — https://www.w3.org/TR/webgpu/
- GPU for the Web Community Group, **WebGPU Explainer** — [spec oficial] — https://gpuweb.github.io/gpuweb/explainer/
- MDN, **GPUBuffer** — [doc. técnica] — https://developer.mozilla.org/en-US/docs/Web/API/GPUBuffer
- Chromium Project, **WebGPU Technical Report** — [doc. técnica] — https://chromium.googlesource.com/chromium/src/+/main/docs/security/research/graphics/webgpu_technical_report.md
- Fransson, Hermansson & Hu (2024), *A Comparison of Performance on WebGPU and WebGL in the Godot Game Engine*, IEEE GEM 2024 — [peer-reviewed] — DOI 10.1109/gem61861.2024.10585437 — https://www.diva-portal.org/smash/get/diva2:1888104/FULLTEXT02.pdf
- Chickerur et al. (2024), *WebGL vs. WebGPU: A Performance Analysis for Web 3.0*, Procedia Computer Science 233:919–928 — [peer-reviewed] — DOI 10.1016/j.procs.2024.03.281
- Han et al. (2025), *GL2GPU: Accelerating WebGL Applications via Dynamic API Translation to WebGPU*, WWW/ACM Web Conference 2025 — [peer-reviewed] — DOI 10.1145/3696410.3714785
- Sengupta, Wu, Varvello, Jana, Chen & Han (2025), *From WebGL to WebGPU: A Reality Check of Browser-Based GPU Acceleration*, ACM IMC 2025 — [peer-reviewed] — DOI 10.1145/3730567.3764504
- **Part-time Power Measurements: nvidia-smi's Lack of Attention** — [preprint arXiv] — arXiv:2312.02741 — https://arxiv.org/abs/2312.02741
- **Accurate and Convenient Energy Measurements for GPUs** — [peer-reviewed] — ACM SC 2024 — DOI 10.1109/SC41406.2024.00028
- **LLM Inference at the Edge: Mobile, NPU, and GPU Performance Efficiency Trade-offs Under Sustained Load** — [preprint arXiv] — arXiv:2603.23640
- Don McCurdy, **Choosing texture formats for WebGL and WebGPU applications** — [doc. técnica, especialista reconhecido na comunidade glTF/Three.js] — https://www.donmccurdy.com/2024/02/11/web-texture-formats/
- Greggman, **webgl-memory** (ferramenta e documentação) — [doc. técnica/ferramenta de terceiro] — https://github.com/greggman/webgl-memory
- Khronos Group, **Draco 3D Compression Extension to glTF 2.0** (slides GDC 2018) — [doc. técnica oficial Khronos] — https://www.khronos.org/assets/uploads/developers/library/2018-gdc-webgl-and-gltf/glTF-Draco-GDC_Mar18.pdf
- Toji.dev, **WebGPU Best Practices** (Brandon Jones, engenheiro Chrome WebGPU) — [doc. técnica de especialista de fabricante] — https://toji.dev/webgpu-best-practices/
- **Comparative Analysis of Energy Efficiency in Desktop Web Browsers: Towards Sustainable Software Applications** — [peer-reviewed, acesso ao texto completo bloqueado nesta pesquisa] — ResearchGate 382421953

*Fontes de blog/terceiros não peer-reviewed (volumeshaderbm.org, sitepoint.com, etc.) foram consultadas apenas para triangulação de direção geral do efeito, nunca como base de números citáveis no TCC — ver ressalvas na Seção I.1.3 e no item 6 de "Lacunas e Riscos".*

---

# Parte II — Referência Técnica: Arquitetura WebGPU vs. Modelo de Estados do WebGL

Cobre a arquitetura da API WebGPU, contrasta com o modelo de máquina de estados implícita do WebGL, e mapeia cada conceito para trechos concretos de `src/main-raw-webgpu.js`, `src/main-raw-webgl.js` e `src/main.js` (referências no formato `arquivo:linha`). Toda afirmação técnica é ancorada em spec W3C, documentação oficial do Chrome/MDN, ou explicitamente marcada como raciocínio do autor quando não há fonte primária.

## II.1 Escopo e como usar esta parte

O projeto tem três implementações paralelas do mesmo cenário (Bistro Exterior / enxame de vespas):

- `src/main-raw-webgpu.js` — WebGPU nativo (sem Three.js para renderização; Three.js só decodifica GLB/Draco).
- `src/main-raw-webgl.js` — WebGL2 nativo, mesmo padrão.
- `src/main.js` — Three.js com `WebGPURenderer` ou `THREE.WebGLRenderer`, chaveado por `CONFIG_API`.

Cada seção abaixo explica um conceito da arquitetura WebGPU, contrasta com o equivalente (ou ausência de equivalente) em WebGL, e localiza no código onde ele aparece — ou não aparece, quando é uma lacuna de instrumentação relevante para interpretar os resultados do TCC.

## II.2 GPUAdapter, GPUDevice e GPUQueue: inicialização explícita vs. contexto implícito

### II.2.1 O que diz a spec

A especificação W3C WebGPU define uma cadeia de responsabilidade explícita e descartável:

- **`GPUAdapter`** — "identifica uma implementação de WebGPU no sistema"; é obtido via `navigator.gpu.requestAdapter()` e só pode ser consumido uma vez para criar um `GPUDevice` (seu estado transita de "valid" para "consumed"/"expired"). Carrega `features` e `limits` imutáveis do hardware físico identificado.
- **`GPUDevice`** — "instanciação lógica de um adapter", dona exclusiva de todos os objetos internos criados a partir dele (buffers, texturas, pipelines, bind groups). Se o device é perdido ou destruído, todos os objetos filhos tornam-se inutilizáveis.
- **`GPUQueue`** — fila associada a exatamente um device, que executa `GPUCommandBuffer`s submetidos via `queue.submit()`. Todo trabalho de GPU (draws, dispatches, cópias) só é efetivamente enfileirado para execução ao passar pela queue.

Fonte: [W3C WebGPU Specification](https://www.w3.org/TR/webgpu/) — definições de `GPUAdapter`, `GPUDevice`, `GPUQueue`.

### II.2.2 Contraste com WebGL

Em WebGL não existe essa separação em três objetos com ciclos de vida distintos. `canvas.getContext("webgl2", ...)` retorna diretamente um único objeto (`WebGLRenderingContext`/`WebGL2RenderingContext`) que já é simultaneamente "adaptador", "dispositivo" e "fila" — não há um passo de negociação de adaptador nem um objeto de fila separado; cada chamada de API (`gl.drawElements`, `gl.bufferData`) é potencialmente síncrona do ponto de vista da API JS, mesmo que a implementação por baixo (ANGLE/driver) enfileire de forma assíncrona.

### II.2.3 Mapeamento no código

| Conceito | WebGPU nativo | WebGL nativo | Three.js (`main.js`) |
|---|---|---|---|
| Requisição de adapter | `main-raw-webgpu.js:169` (`navigator.gpu.requestAdapter({ powerPreference: "high-performance" })`) | não existe — `main-raw-webgl.js:174` já obtém o contexto diretamente | `main.js:89` (`new WebGPURenderer({ ..., powerPreference: "high-performance" })`), resolvido internamente em `renderer.init()` (`main.js:101`) |
| Diagnóstico do adapter físico escolhido | `main-raw-webgpu.js:172-177` (`adapter.info ?? adapter.requestAdapterInfo()`) | `main-raw-webgl.js:178-185` (`WEBGL_debug_renderer_info` / `UNMASKED_RENDERER_WEBGL`) | não instrumentado — `main.js` não loga o adapter/GPU física escolhida |
| Criação do device | `main-raw-webgpu.js:179` (`adapter.requestDevice()`) | implícito na criação do contexto (`main-raw-webgl.js:174`) | interno ao `WebGPURenderer.init()` |
| Fila de submissão | `device.queue` usado em `main-raw-webgpu.js:377,396,588,639` | não existe conceito equivalente — chamadas diretas no contexto | interno; Three.js chama `queue.submit()` a cada `renderer.render()` |

**Observação sobre `adapter.info` (main-raw-webgpu.js:173):** o padrão `adapter.info ?? (adapter.requestAdapterInfo ? await adapter.requestAdapterInfo() : null)` é uma forma defensiva correta para cobrir a transição de API: `GPUAdapter.info` foi introduzido de forma síncrona no Chrome 127, e `requestAdapterInfo()` (assíncrono) foi removido do spec e descontinuado no Chrome 131. Fonte: [Chrome for Developers — What's New in WebGPU (Chrome 130)](https://developer.chrome.com/blog/new-in-webgpu-130); [Intent to Deprecate and Remove: GPUAdapter.requestAdapterInfo()](https://groups.google.com/a/chromium.org/g/blink-dev/c/HxOgGf4NzQ4).

### II.2.4 Relevância metodológica para o TCC

A Regra 2 do `CLAUDE.md` do projeto exige `powerPreference: "high-performance"` nos dois inicializadores exatamente porque o comportamento de seleção de GPU difere entre as duas pilhas: sem essa flag, WebGPU no Windows tende a cair para a iGPU Intel UHD por padrão. O código já verifica isso ativamente nos dois caminhos raw (`main-raw-webgpu.js:172-177`, `main-raw-webgl.js:178-185`), mas **`main.js` (a via Three.js) não faz esse log de diagnóstico** — só passa a flag adiante sem confirmar qual GPU física foi de fato selecionada pelo ANGLE/Dawn. Isso é uma lacuna de instrumentação: se um ensaio da via Three.js silenciosamente caiu para a iGPU, não haveria evidência disso nos logs coletados, diferente dos caminhos raw.

## II.3 Modelo de máquina de estados implícita (WebGL) vs. objetos imutáveis explícitos (WebGPU)

### II.3.1 O modelo WebGL

WebGL herda de OpenGL ES o modelo de "máquina de estados": existe um contexto global com um conjunto grande de variáveis de estado (programa ativo, texturas vinculadas a unidades, buffers vinculados a *targets*, flags de teste de profundidade/cull habilitadas ou não, etc.). Cada chamada de desenho (`drawElements`/`drawArrays`) usa *qualquer que seja* o estado atualmente configurado no contexto — não há validação estática de que o conjunto de estado é consistente antes do draw; erros de estado incorreto só aparecem em tempo de execução (ou silenciosamente produzem resultado errado). É comum described como "state machine com um botão especial para mandar imagens à tela": você prepara estado, prepara mais estado, e desenha. Fonte de caracterização geral do modelo: [webgl2fundamentals.org — WebGL State Diagram](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html) (nível de documentação de referência de terceiros, não W3C, mas amplamente citado como descrição precisa do modelo mental do WebGL).

### II.3.2 O modelo WebGPU

WebGPU substitui esse modelo por objetos imutáveis criados antecipadamente e validados no momento da criação, não no momento do draw:

- `GPURenderPipeline` — um objeto único que já "congela" shader módulos, layout de vértice, topologia de primitiva, estado de rasterização (`cullMode`), formato de profundidade/estêncil e formato dos alvos de cor. Uma vez criado, não pode ser mutado.
- `GPUBindGroup` — um conjunto imutável de bindings de recursos (buffers/texturas/samplers) que casa com um `GPUBindGroupLayout` específico.

O efeito prático é que "trocar de estado" em WebGPU significa trocar qual pipeline/bind group pré-compilado está ativo (`setPipeline`, `setBindGroup`), não mutar flags individuais dentro de um contexto global.

### II.3.3 Mapeamento direto no código — o mesmo problema (culling) resolvido nos dois modelos

O código do experimento tem um exemplo lado a lado quase perfeito: alternar cull-face para geometria de face dupla (ex.: folhagem) vs. face única.

**WebGL (`main-raw-webgl.js:546-561`)** — estado mutável, alternado dentro do laço de desenho:
```js
let cullEnabled = null;
for (const { vao, indexCount, glType, texKey, doubleSided } of gpuMeshes) {
  const wantCull = !doubleSided;
  if (wantCull !== cullEnabled) {
    if (wantCull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
    cullEnabled = wantCull;
  }
  ...
}
```
Isso é literalmente o padrão "state machine": `gl.enable`/`gl.disable(gl.CULL_FACE)` muta um estado global do contexto que persiste entre chamadas de desenho subsequentes até ser mudado de novo.

**WebGPU (`main-raw-webgpu.js:320-343`, uso em `607-637`)** — dois `GPURenderPipeline` imutáveis pré-criados (`pipelineCull` com `cullMode: "back"`, `pipelineNoCull` com `cullMode: "none"`, definidos em `createPipelines()`), e o laço de desenho apenas escolhe qual dos dois já-compilados está ativo:
```js
const wanted = doubleSided ? pipelineNoCull : pipelineCull;
if (wanted !== currentPipeline) {
  pass.setPipeline(wanted);
  currentPipeline = wanted;
}
```
O comentário em `main-raw-webgl.js:302` ("pra minimizar trocas de estado no loop de render") e o comentário simétrico em `main-raw-webgpu.js:270` mostram que ambas as implementações já ordenam as meshes por `doubleSided` (`uploadMeshes`, `main-raw-webgl.js:301-341` / `main-raw-webgpu.js:269-301`) precisamente para minimizar o número de transições de estado/pipeline por frame — otimização que faz sentido nos dois modelos, mas que é *obrigatória* em WebGPU no sentido de que trocar de pipeline é uma operação logicamente mais pesada (troca de todo o estado fixo de uma vez) do que apenas alternar uma flag booleana em WebGL.

### II.3.4 Relevância metodológica

Essa diferença é candidata a explicar parte de qualquer diferença de overhead de CPU por frame observada entre as duas APIs no cenário de instancing (N=500/2000/5000): cada cópia da vespa em WebGPU passa por `setBindGroup`/`setPipeline`/`setVertexBuffer`/`setIndexBuffer`/`drawIndexed` (`main-raw-webgpu.js:610-622`) contra `gl.uniform3f`/`gl.bindTexture`/`gl.bindVertexArray`/`gl.drawElements` (`main-raw-webgl.js:549-561`) — a contagem de "draw calls" reportada é a mesma nas duas (`drawCallsPorQuadro` / linha 546 em ambos os arquivos), mas o custo de CPU por chamada de encoding não é necessariamente idêntico, e isso não é medido separadamente pelo instrumental descrito nesta seção (ver II.8 — a decomposição CPU/GPU do projeto, implementada em 2026-08-24, foi justamente a resposta a essa lacuna).

## II.4 Command Encoders, Command Buffers e submissão à Queue

### II.4.1 O que diz a spec

`GPUCommandEncoder` grava comandos (passes de render/compute, cópias) e produz um `GPUCommandBuffer` "selado" ao chamar `.finish()`. O command buffer é então submetido via `device.queue.submit([...])`. O modelo de "timeline" da spec distingue explicitamente: **content timeline** (onde o JS grava comandos), **device timeline** e **queue timeline** (onde a GPU efetivamente executa) — a gravação de comandos é uma operação independente de quando eles rodam na GPU. Fonte: [W3C WebGPU Specification](https://www.w3.org/TR/webgpu/), seção de modelo de execução/timelines.

Isso não tem equivalente em WebGL: cada chamada como `gl.drawElements` é, do ponto de vista da API, "imediata" — não há uma etapa separada de "gravar comandos em um buffer" e depois "submeter o buffer"; a submissão para a GPU acontece implicitamente a cada chamada (ainda que o driver por baixo faça batching).

### II.4.2 Mapeamento no código

`main-raw-webgpu.js:590-639`, dentro de `frame(ts)`, a cada quadro:
```js
const enc  = device.createCommandEncoder();     // 590
const pass = enc.beginRenderPass({ ... });        // 591-604
pass.setBindGroup(0, cameraBindGroup);            // 606
... setPipeline / setBindGroup / setVertexBuffer / setIndexBuffer / drawIndexed ...
pass.end();                                       // 638
device.queue.submit([enc.finish()]);              // 639
```
Um único command encoder e um único command buffer por frame, contendo um único render pass. Não há uso de múltiplos encoders paralelos, nem submissão em lote de mais de um `GPUCommandBuffer` — `queue.submit()` sempre recebe um array de um elemento (`main-raw-webgpu.js:639`).

Em contraste, `main-raw-webgl.js:533-573` não tem estrutura de encoder/buffer: cada `gl.drawElements` (linha 559 no laço de instancing, 571 no laço normal) é uma chamada direta e imediata sobre o contexto.

### II.4.3 Lacuna: gravação de comandos fora da thread principal

A spec permite que a gravação de comandos (content timeline) ocorra em uma Web Worker via `OffscreenCanvas`, permitindo paralelizar a preparação de comandos de desenho em relação à thread principal. **O código atual não usa isso em nenhuma das três implementações** — toda a gravação de comandos ocorre dentro do callback `requestAnimationFrame` na thread principal (`main-raw-webgpu.js:537-642`; equivalente em `main.js` via `renderer.render()` chamado em `animate()`, `main.js:270-307`). Isso é relevante para o TCC porque uma das vantagens arquiteturais comumente atribuídas ao WebGPU é permitir multithreading real na submissão de comandos — o experimento, como está, não exercita essa capacidade, então qualquer diferença de FPS/frame time observada **não pode ser atribuída a paralelismo de encoding**, e sim a outros fatores (overhead de validação por chamada, pipeline vs. state machine, etc.). Isto é interpretação do autor deste documento, não uma medição.

## II.5 Render Passes e Compute Passes

### II.5.1 O que diz a spec

Um `GPURenderPassEncoder` (via `commandEncoder.beginRenderPass()`) delimita explicitamente o conjunto de anexos de cor/profundidade-estêncil usados, com `loadOp`/`storeOp` por anexo controlando se o conteúdo é limpo, preservado ou descartado ao final do passe — decisão que o driver pode usar para otimizar (ex.: TBDR em mobile). Um `GPUComputePassEncoder` (via `beginComputePass()`) delimita uma sequência de `dispatchWorkgroups()` sobre pipelines de computação, sem nenhum anexo de cor/profundidade. Fonte: [W3C WebGPU Specification](https://www.w3.org/TR/webgpu/).

WebGL não tem conceito equivalente de "passe" delimitado por objeto: o que se aproxima é o framebuffer vinculado no momento do draw (`gl.bindFramebuffer`) mais o estado de clear (`gl.clear`), mas isso é, de novo, estado mutável do contexto, não um objeto de passe com escopo explícito. WebGL2/ES3 também não expõe compute shaders (isso só existe em OpenGL ES 3.1+ desktop-like, fora do escopo do WebGL2).

### II.5.2 Mapeamento no código

Render pass único por frame em `main-raw-webgpu.js:591-604`:
```js
const pass = enc.beginRenderPass({
  colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: {...}, loadOp: "clear", storeOp: "store" }],
  depthStencilAttachment: { view: depth.createView(), depthClearValue: 1.0, depthLoadOp: "clear", depthStoreOp: "discard" },
});
```
Note `depthStoreOp: "discard"` (linha 602) — o buffer de profundidade é descartado ao final do passe porque não é lido depois; isso é uma decisão explícita que só existe porque o modelo de passe obriga a declarar o destino de cada anexo.

**Compute pass: não existe em nenhuma das três implementações.** Não há nenhum `beginComputePass()`, `dispatchWorkgroups()` ou pipeline de computação no projeto — todo o trabalho de GPU é gráfico (vertex+fragment). Isso é coerente com o escopo do TCC (renderização, não GPGPU), mas é uma lacuna relevante a documentar: um dos diferenciais arquiteturais mais citados do WebGPU sobre WebGL é justamente o suporte a compute shaders, e essa dimensão simplesmente não é exercitada nem comparada no experimento.

Em `main.js`, o `WebGPURenderer` do Three.js encapsula a criação de render pass internamente a cada chamada de `renderer.render(scene, camera)` (`main.js:287`) — não há acesso direto a `beginRenderPass()` no código do projeto; isso é abstraído pelo `WebGPUBackend` interno do Three.js. Fonte (nível de documentação de terceiros/comunidade sobre a arquitetura interna do Three.js, não W3C): [Three.js Manual — WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html).

## II.6 Bind Group Layouts e Pipeline Layouts

### II.6.1 O que diz a spec

`GPUBindGroupLayout` declara, de forma estática e validada na criação, quais tipos de recurso (buffer uniform/storage, texture, sampler) ocupam quais índices de binding e em quais estágios de shader (`visibility`) são visíveis. `GPUPipelineLayout` agrupa múltiplos bind group layouts em uma sequência ordenada (`@group(N)` no WGSL corresponde ao índice N no array `bindGroupLayouts`). Um `GPUBindGroup` real (a instância com os recursos de fato) só pode ser vinculado a um pipeline se seu layout for compatível com o layout esperado naquele slot. Fonte: [W3C WebGPU Specification](https://www.w3.org/TR/webgpu/).

Isso não tem equivalente estrutural em WebGL: recursos são associados a shaders por **nome** via `gl.getUniformLocation`/`gl.getAttribLocation` (ou `bindAttribLocation` para atributos, como em `main-raw-webgl.js:207-209`) e vinculados no momento do uso via unidades de textura globais (`gl.activeTexture` + `gl.bindTexture`) ou "uniform setters" (`gl.uniformMatrix4fv`, `gl.uniform3f`, `gl.uniform1i`). Não existe validação antecipada de compatibilidade de layout — um mismatch só se manifesta como comportamento incorreto ou erro em tempo de execução.

### II.6.2 Mapeamento no código

`main-raw-webgpu.js:304-343`, função `createPipelines()`, três bind group layouts distintos:
- `uniformBGL` (linha 306-308): grupo 0, um único uniform buffer (câmera/`viewProj`), visível só no estágio de vértice.
- `textureBGL` (linha 309-314): grupo 1, um sampler + uma texture, ambos visíveis só no fragment.
- `offsetBGL` (linha 315-317): grupo 2, um uniform buffer de offset (usado só no modo instancing; zerado via `zeroOffsetBindGroup`, linha 487, nos Cenários A-D).
- `layout = device.createPipelineLayout({ bindGroupLayouts: [uniformBGL, textureBGL, offsetBGL] })` (linha 318) — a ordem aqui casa exatamente com `@group(0)`, `@group(1)`, `@group(2)` declarados no WGSL (linhas 133, 134-135, 138).

Uso por frame: `pass.setBindGroup(0, cameraBindGroup)` (linha 606, fora do laço — a câmera muda uma vez por frame), `pass.setBindGroup(1, texKey ? texBindGroups.get(texKey) : placeholderBindGroup)` e `pass.setBindGroup(2, ...)` dentro do laço por mesh (linhas 611, 618, 625, 632).

Equivalente funcional em WebGL (`main-raw-webgl.js:444-446,540-543,550,569`): `uViewProjLoc`/`uTexLoc`/`uOffsetLoc` obtidos uma vez por *location* de nome, e setados por chamada individual (`gl.uniformMatrix4fv`, `gl.uniform1i`, `gl.uniform3f`) a cada frame/mesh — não há objeto "bind group" agrupando textura+sampler; `gl.bindTexture(gl.TEXTURE_2D, ...)` (linha 557/569) associa a textura à unidade ativa (`gl.activeTexture(gl.TEXTURE0)`, linha 542, setada uma vez fora do laço) implicitamente.

Em `main.js`, o Three.js `WebGPURenderer`/TSL constrói bind group layouts automaticamente a partir do grafo de nodes do material, mantendo (segundo documentação de terceiros sobre a arquitetura interna, não W3C) grupos separados por escopo de atualização — "FRAME", "RENDER", "OBJECT" — para minimizar re-uploads de bind groups entre objetos que compartilham o mesmo material. Fonte (nível comunidade, não oficial): discussão em [Three.js WebGPURenderer PR #28719](https://github.com/mrdoob/three.js/pull/28719) e [Three.js Manual — WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html). Nenhum desses detalhes é visível ou controlável a partir do código de `main.js` deste projeto — é comportamento interno do renderer. **Ver Parte III, achado 1, para o custo real em VRAM desse cache por-objeto, investigado diretamente no código-fonte do Three.js instalado.**

## II.7 Shader Modules em WGSL vs. GLSL ES 3.00

### II.7.1 O que diz a spec

`GPUShaderModule` (`device.createShaderModule({ code })`) recebe uma string de código WGSL, que é validada estaticamente na criação do módulo (erros de tipo, de binding, de layout de struct são pegos antes de qualquer draw). WGSL exige anotações explícitas de layout (`@group`, `@binding`, `@location`, `@builtin`) que amarram o shader diretamente aos bind group layouts declarados no host. Fonte: [W3C WebGPU Specification](https://www.w3.org/TR/webgpu/) (shader modules) e especificação irmã WGSL.

### II.7.2 Mapeamento no código

WGSL único (vertex + fragment no mesmo módulo) em `main-raw-webgpu.js:131-164`:
```wgsl
struct Uni { viewProj : mat4x4<f32> }
@group(0) @binding(0) var<uniform> u : Uni;
@group(1) @binding(0) var texSampler : sampler;
@group(1) @binding(1) var tex : texture_2d<f32>;
struct Offset { valor : vec3<f32> }
@group(2) @binding(0) var<uniform> off : Offset;
```
Note a correspondência 1:1 com os três `GPUBindGroupLayout`s da seção II.6.2 — isso é uma amarração *compilada*: se o layout do host e as anotações do WGSL divergissem, `createRenderPipeline` falharia na criação, não em tempo de desenho.

GLSL ES 3.00 equivalente, dois módulos separados de shader (vertex/fragment), em `main-raw-webgl.js:134-170`, usando `uniform`/`in`/`out` sem nenhuma anotação de grupo/binding — o casamento entre uniform e valor é feito por nome via `getUniformLocation` (`createProgram`, linhas 190-215) em tempo de link do programa, um passo diferente e sem a mesma validação estática de compatibilidade estrutural que o WebGPU aplica na criação do pipeline.

Em `main.js`, nenhum WGSL/GLSL é escrito à mão: o Three.js `WebGPURenderer` gera WGSL automaticamente a partir do grafo de nodes de material (TSL) via um `WGSLNodeBuilder` interno — os materiais usados no projeto (`THREE.MeshStandardMaterial`, linha `main.js:155`, e os materiais originais do GLB) são compilados para WGSL sem que o código do projeto veja o texto do shader gerado. Fonte (nível comunidade/blog técnico, não W3C): [Field Guide to TSL and WebGPU — Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/).

## II.8 Timestamp Queries: GPU-side vs. `performance.now()` CPU-side

> **Nota de atualização (2026-08-24):** as três implementações do projeto passaram a implementar timestamp queries GPU-side após esta seção ter sido escrita — ver `CHANGES-LOG.md`, entrada "Decomposição CPU/GPU via timestamp queries nativas". A lacuna descrita abaixo (§II.8.2-II.8.3) **foi fechada**; o texto é mantido como registro do raciocínio que motivou a implementação, e porque a ressalva de contaminação por vsync nos Cenários A-C (§II.8.3) continua válida mesmo com a instrumentação implementada.

### II.8.1 O que diz a spec

`GPUQuerySet` com `type: "timestamp"` permite que a própria GPU grave seu relógio interno em pontos específicos da timeline de execução: via `timestampWrites` em `GPURenderPassDescriptor`/`GPUComputePassDescriptor` (campos `querySet`, `beginningOfPassWriteIndex`, `endOfPassWriteIndex`), ou via `GPUCommandEncoder.writeTimestamp()` fora de passes (isso exige a feature `"timestamp-query"`; escrever timestamps *dentro* de um passe ativo, no meio da gravação, exige a feature adicional `"timestamp-query-inside-passes"`). A diferença entre dois timestamps dá o tempo de execução real na GPU, em nanossegundos, para aquele trecho de trabalho — sem depender de quando a CPU percebe que o trabalho terminou. Por razões de mitigação de timing-attack, os valores são quantizados a uma resolução de 100 microssegundos por padrão (a quantização é desabilitada com a flag "WebGPU Developer Features" do Chrome). Fontes: [MDN — GPUCommandEncoder.writeTimestamp()](https://developer.mozilla.org/docs/Web/API/GPUCommandEncoder/writeTimestamp), [webgpufundamentals.org — WebGPU Timing Performance](https://webgpufundamentals.org/webgpu/lessons/webgpu-timing.html), [Toji.dev — Profiling WebGPU: Timestamp Queries](https://toji.dev/webgpu-profiling/timestamp-queries.html).

Uma limitação documentada relevante: timestamp queries só medem o início/fim de um *passe* inteiro — não há como medir subtrechos dentro de um passe sem a feature adicional, nem operações fora de passes (cópias, criação de recursos). Fonte: [Toji.dev — Profiling WebGPU](https://toji.dev/webgpu-profiling/timestamp-queries.html).

WebGL2 tem um mecanismo GPU-side análogo, porém mais limitado: a extensão `EXT_disjoint_timer_query_webgl2`, que também usa um objeto de query (`gl.beginQuery`/`gl.endQuery` com o target `TIME_ELAPSED_EXT`, ou `gl.queryCounter` com `TIMESTAMP_EXT`) para obter tempo de GPU em nanossegundos, com a ressalva de que o resultado pode ser marcado "disjoint" (inválido) se houve mudança de clock/estado da GPU durante a medição.

### II.8.2 O que o código media antes da implementação — CPU-side, via `requestAnimationFrame`

**No momento em que esta seção foi escrita, nenhuma das três implementações usava timestamp queries GPU-side ou `EXT_disjoint_timer_query_webgl2`.** O frame time reportado em todos os três caminhos era medido inteiramente no lado da CPU, usando o timestamp de alta resolução (`DOMHighResTimeStamp`) fornecido pelo callback de `requestAnimationFrame` (`main-raw-webgpu.js:554-558`, `main-raw-webgl.js:498-508`, `main.js:272-299` via `THREE.Clock.getDelta()`).

### II.8.3 Por que isso importava para a comparação WebGPU vs. WebGL no TCC

Um timestamp de `requestAnimationFrame` marca quando o navegador entrega o callback à thread principal para o próximo frame — isso reflete o tempo de **CPU até a submissão do trabalho** (encoding + submit + o que quer que o navegador precise esperar antes de liberar o próximo rAF), não necessariamente o tempo que a GPU efetivamente gastou executando o passe de render anterior. As duas APIs têm modelos de sincronização CPU-GPU diferentes (por exemplo, o quão agressivamente cada uma faz *pipelining*/*buffering* de frames antes de bloquear a CPU), então:

- Se uma das duas pilhas (WebGPU ou WebGL/ANGLE) tende a devolver o controle à CPU mais cedo em relação ao trabalho de GPU real (mais enfileiramento assíncrono), o frame time medido via `rAF` pode **subestimar** o custo de GPU daquela API em relação à outra, mesmo que o trabalho de GPU real seja equivalente ou pior.
- Timestamp queries GPU-side, uma vez implementadas, decompõem o frame time em "tempo de CPU até submit" vs. "tempo de execução real na GPU", permitindo isolar a variável de interesse (custo do trabalho de GPU) do ruído de scheduling/sincronização de cada API.
- **Ressalva que continua válida após a implementação:** nos Cenários A/B/C, onde o FPS satura perto do teto de atualização do monitor (~144Hz), a decomposição CPU/GPU fica contaminada por tempo de espera de vsync, não custo real de submissão — mais confiável no Cenário D e no eixo de instancing, onde o Frame Time ultrapassa claramente o teto do monitor (ver `CLAUDE.md` §3.A).

## II.9 Modelo explícito de gerenciamento de memória: buffers, texturas e staging

### II.9.1 O que diz a spec

WebGPU exige que o desenvolvedor declare antecipadamente, via *usage flags* bitwise (`GPUBufferUsage.VERTEX`, `INDEX`, `UNIFORM`, `STORAGE`, `COPY_SRC`, `COPY_DST`, `MAP_READ`, `MAP_WRITE`), para que cada buffer/textura pode ser usado — o driver pode alocar o recurso em memória com características diferentes dependendo dessa combinação de flags, e usos não declarados são erro de validação, não comportamento silenciosamente permitido. Duas formas de popular um `GPUBuffer` com dados da CPU:

- **`mappedAtCreation: true`** — mapeia o buffer para acesso da CPU imediatamente na criação, antes de qualquer uso em GPU; o `ArrayBuffer` retornado por `getMappedRange()` é escrito diretamente e depois `unmap()`ado. Eficiente para upload único de dados estáticos.
- **`queue.writeBuffer()` / `queue.writeTexture()` / `queue.copyExternalImageToTexture()`** — operações de fila que enfileiram uma cópia CPU→GPU sem exigir que o desenvolvedor gerencie um buffer de staging manualmente; a spec deixa a cargo da implementação decidir os detalhes de um staging buffer interno.
- Um padrão de staging manual (não usado neste projeto) envolveria criar um buffer com `usage: MAP_WRITE | COPY_SRC`, escrever nele via mapeamento, e depois `copyBufferToBuffer`/`copyBufferToTexture` para um buffer/textura de uso final `COPY_DST`, dando controle explícito sobre quando a cópia acontece na timeline da GPU.

Fonte: [W3C WebGPU Specification](https://www.w3.org/TR/webgpu/) (GPUBuffer, mapAsync, queue operations).

WebGL não expõe esse nível de controle: `gl.bufferData(target, data, usage)` recebe um *hint* de uso (`STATIC_DRAW`, `DYNAMIC_DRAW`, etc.) que é apenas uma sugestão de otimização ao driver, não uma declaração validada de operações permitidas; não há conceito de "mapear" um buffer de forma explícita na API core do WebGL2 (existe `getBufferSubData` para leitura, mas o caminho comum de escrita é sempre `bufferData`/`bufferSubData`, que já embutem a cópia CPU→GPU sem exposição de um staging buffer).

### II.9.2 Mapeamento no código

**Buffers de vértice/índice, upload único via `mappedAtCreation`** — `main-raw-webgpu.js:281-297` (`uploadMeshes`):
```js
const vb = device.createBuffer({
  size: interleaved.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  mappedAtCreation: true,
});
new Float32Array(vb.getMappedRange()).set(interleaved);
vb.unmap();
```
Note o `usage` combinando `VERTEX | COPY_DST` mesmo usando `mappedAtCreation` (não estritamente necessário só para o upload inicial, mas permite reuso futuro via `writeBuffer` se necessário) — declaração explícita de capacidade, ausente no equivalente WebGL (`main-raw-webgl.js:317-319`, `gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW)`).

Alinhamento de 4 bytes exigido para index buffers (`main-raw-webgpu.js:290`, `Math.ceil(indices.byteLength / 4) * 4`) — um requisito explícito do WebGPU sem equivalente necessário em WebGL (`main-raw-webgl.js:328-329` não faz esse arredondamento).

**Uniform buffer atualizado por frame via `queue.writeBuffer`** (não staging manual) — `main-raw-webgpu.js:500-502` (criação, sem `mappedAtCreation`, só `UNIFORM | COPY_DST`) e `588` (`device.queue.writeBuffer(ubo, 0, viewProj)`, executado a cada frame dentro de `frame(ts)`). Isso é a via "rápida" de update per-frame que a própria spec disponibiliza — não há staging buffer explícito neste código; o navegador decide como implementar a cópia internamente.

**Textura via `copyExternalImageToTexture`** (staging implícito) — `main-raw-webgpu.js:372-377`:
```js
const texture = device.createTexture({ size: [...], format: "rgba8unorm",
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, [bitmap.width, bitmap.height]);
```
Equivalente WebGL — `main-raw-webgl.js:343-353` (`gl.texImage2D` + `gl.generateMipmap`). **Nota (2026-08-24):** o texto original desta seção apontava que o caminho WebGPU-RAW não gerava mipmaps como uma assimetria não corrigida; essa lacuna foi fechada na varredura de código de 2026-08-24 (geração manual de mipmap adicionada — ver `CHANGES-LOG.md`). Ver também Parte III, achado 5, para o registro histórico da análise original desse problema.

### II.9.3 Lacuna: sem staging buffer explícito nem controle fino de quando a cópia ocorre

Como nenhuma das implementações usa um buffer de staging manual (`MAP_WRITE|COPY_SRC` → `copyBufferToBuffer`/`copyBufferToTexture`), todo o controle de timing de upload é delegado ao navegador via `writeBuffer`/`writeTexture`/`copyExternalImageToTexture`. Isso é adequado para o padrão de uso do projeto (upload único de geometria/textura na carga inicial, update pequeno de uniform por frame), mas significa que o experimento não testa — nem poderia comparar — o cenário onde controle explícito de staging importa (streaming de texturas grandes durante o frame, dados dinâmicos de geometria). Não é uma recomendação de mudança, apenas delimitação do que o código exercita.

## II.10 Outras lacunas de instrumentação identificadas

Estes são conceitos de WebGPU relevantes para interpretar corretamente os resultados do TCC que, no momento em que esta seção foi escrita, não estavam presentes em nenhum dos três arquivos-fonte. Algumas dessas lacunas foram fechadas em correções posteriores (ver notas); o registro histórico é mantido porque documenta o raciocínio da decisão.

1. **Warm-up explícito de pipelines** — `device.createRenderPipeline()` (síncrono, `main-raw-webgpu.js:320`) pode internamente disparar compilação de shader/estado que só é finalizada de forma lazy no primeiro uso real do pipeline em um draw, dependendo do driver. A alternativa `createRenderPipelineAsync()` (não usada aqui) permite aguardar explicitamente a compilação terminar antes do primeiro frame medido. Como o benchmark começa a coletar métricas só após pressionar Espaço (`main-raw-webgpu.js:523-531`, após a cena já estar carregada e alguns frames já terem sido desenhados no estado "parado", linhas 574-583), é provável que o warm-up de pipeline já tenha ocorrido de fato antes da coleta começar — mas isso não é *garantido* nem medido explicitamente; não há barreira explícita "espere o pipeline estar pronto" antes de iniciar o cronômetro de 60s.
2. **Timestamp queries GPU-side** — implementadas em 2026-08-24, ver §II.8.
3. **Occlusion culling** — nem `GPUQuerySet` do tipo `"occlusion"` (WebGPU) nem `gl.beginQuery(gl.ANY_SAMPLES_PASSED, ...)` (WebGL2) são usados. Toda a geometria de cada mesh carregada é submetida a cada frame independentemente de visibilidade da câmera. Isso é consistente entre as duas APIs (nenhuma faz culling), então não introduz viés *entre* WebGL e WebGPU, mas significa que os números de draw calls/FPS medidos representam o pior caso de geometria total, não o caso otimizado de uma aplicação de produção.
4. **Draws indiretos (`drawIndexedIndirect`)** — não usado; todas as chamadas são `drawIndexed` diretas com contagens conhecidas em tempo de CPU (`main-raw-webgpu.js:621,635`).
5. **Render bundles (`GPURenderBundleEncoder`)** — mecanismo do WebGPU para pré-gravar uma sequência de comandos de passe reutilizável entre frames (útil quando a mesma sequência de draws se repete, como no cenário de instancing com N cópias idênticas da vespa) — não usado em `main-raw-webgpu.js`; cada frame regrava a sequência completa de `setBindGroup`/`setPipeline`/`draw` do zero (linhas 606-637). Isso é uma otimização de CPU-side encoding que poderia reduzir overhead especificamente no cenário de instancing de alta densidade (N=5000), mas não está implementada.
6. **Multithreading de encoding via Web Worker/`OffscreenCanvas`** — detalhado na §II.4.3.
7. **Compute passes** — detalhado na §II.5.2; nenhuma comparação de GPGPU é feita.
8. **`EXT_disjoint_timer_query_webgl2`** no lado WebGL — implementado junto com o item 2 na correção de 2026-08-24.
9. **Mipmaps ausentes no caminho WebGPU raw** — fechado em 2026-08-24 (ver §II.9.2).

## Referências consultadas na Parte II

- [W3C WebGPU Specification](https://www.w3.org/TR/webgpu/) — definições normativas de GPUAdapter, GPUDevice, GPUQueue, GPUCommandEncoder, GPURenderPassEncoder, GPUComputePassEncoder, GPUBindGroupLayout, GPUPipelineLayout, GPUShaderModule, GPUBuffer, timelines de execução.
- [MDN — GPUCommandEncoder.writeTimestamp()](https://developer.mozilla.org/docs/Web/API/GPUCommandEncoder/writeTimestamp) — mecanismo e features exigidas para timestamp queries.
- [webgpufundamentals.org — WebGPU Timing Performance](https://webgpufundamentals.org/webgpu/lessons/webgpu-timing.html) — uso prático de timestamp queries.
- [Toji.dev — Profiling WebGPU: Timestamp Queries](https://toji.dev/webgpu-profiling/timestamp-queries.html) — limitações (granularidade de passe, quantização de 100µs).
- [Chrome for Developers — What's New in WebGPU (Chrome 130)](https://developer.chrome.com/blog/new-in-webgpu-130) — `GPUAdapter.info` síncrono.
- [Intent to Deprecate and Remove: GPUAdapter.requestAdapterInfo()](https://groups.google.com/a/chromium.org/g/blink-dev/c/HxOgGf4NzQ4) — cronograma de depreciação (introduzido Chrome 127, removido Chrome 131).
- [webgl2fundamentals.org — WebGL State Diagram](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html) — caracterização de referência (não W3C) do modelo de estados do WebGL.
- [Three.js Manual — WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html) — arquitetura de alto nível do backend WebGPU do Three.js (fonte de documentação de projeto, não W3C).
- [Three.js WebGPURenderer PR #28719 — Render Bundle + Shared Bind Group](https://github.com/mrdoob/three.js/pull/28719) — detalhes internos de cache de bind groups (nível comunidade/GitHub, não documentação oficial estável).
- [Field Guide to TSL and WebGPU — Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/) — geração de WGSL a partir do sistema de nodes/TSL do Three.js (blog técnico, não fonte normativa).

Arquivos de código-fonte lidos (não alterados) na produção da Parte II: `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`, `src/main.js`.

---

# Parte III — Revisão Crítica do Código de Renderização: WebGL vs WebGPU

**Escopo:** leitura de `src/main.js`, `src/main-raw-webgpu.js`, `src/main-raw-webgl.js`, `scripts/automatizar_coleta.mjs` e `scripts/analisar_energia.mjs`, mais inspeção do código-fonte instalado de `three@0.183.2` (`node_modules/three/src/renderers/**`) para verificar afirmações sobre o `WebGPURenderer`. Nenhum arquivo-fonte do experimento foi alterado — este documento é só relatório de achados, ranqueados por severidade. **Nota:** esta revisão foi feita contra `three@0.183.2`; o projeto atualizou para `0.185.1` em 2026-08-24 (ver `CHANGES-LOG.md`) — os achados relativos à arquitetura de `RenderObject`/bind groups do Three.js (achado 1) podem ter mudado de comportamento entre versões e merecem reverificação.

**Nota sobre VRAM:** o achado real e validado do projeto é que o **WebGPU aloca MAIS VRAM que o WebGL** no eixo de instancing (2,2x a 10,3x mais, crescendo com N=500/2000/5000, enquanto o WebGL fica praticamente plano em ~350-370MB). A validação de 2026-08-23 já confirmou que isso não é artefato de `nvidia-smi` medir a GPU inteira. O achado 1 abaixo investiga a causa **no código** para esse crescimento assimétrico.

## III.1 Severidade 1 — Problemas que podem invalidar a comparação

### Achado 1. Causa arquitetural provável do crescimento de VRAM do WebGPU com N (instancing)

**Onde:** `src/main.js:126-145` (bloco `modoInstancing`) + arquitetura interna de `node_modules/three/src/renderers/common/RenderObjects.js`, `RenderObject.js`, `Bindings.js` e `webgpu/utils/WebGPUBindingUtils.js`.

O comentário em `main.js:127` diz: *"clone() reaproveita a mesma geometry/material — cada cópia gera draw calls reais, sem duplicar VRAM"*. Isso é **verdadeiro apenas no nível de JavaScript**: `Object3D.clone()`/`Mesh.copy()` de fato só copia as *referências* de `geometry` e `material`, não os objetos. O problema é que essa premissa não se traduz igualmente para os dois back-ends de renderização:

- **`WebGLRenderer` clássico** (usado no caminho WebGL deste projeto): o `modelViewMatrix` é declarado como `uniform mat4` simples no GLSL gerado (`node_modules/three/src/renderers/webgl/WebGLProgram.js:597`) e é enviado por `gl.uniformMatrix4fv` a cada draw call, sem nenhum buffer de GPU dedicado por objeto. N cópias que compartilham geometry/material reaproveitam os mesmos `WebGLBuffer`s de vértice/índice — daí a curva de VRAM praticamente plana observada.

- **`WebGPURenderer`** (arquitetura nova de nodes, usada no caminho WebGPU): o cache de `RenderObject` é chaveado pelo **objeto (Mesh) em si**, não pela geometria/material — `RenderObjects.js:96-99`: `_chainKeys[0] = object; _chainKeys[1] = material; ...`. Ou seja, cada cópia clonada (mesmo compartilhando geometry/material) recebe seu **próprio `RenderObject`**. `RenderObject.getBindings()` cria esse conjunto de bindings de forma preguiçosa e específica por objeto (`RenderObject.js:399-403`), e o comentário em `Bindings.js:88` é explícito: *"each object defines an array of bindings (ubos, textures, samplers etc.)"*. Esses *uniform buffers* por objeto (matriz de modelo, normal, etc.) são efetivamente criados via `device.createBuffer(...)` em `webgpu/utils/WebGPUBindingUtils.js:313-317` — **um `GPUBuffer` novo por RenderObject**, isto é, por cópia clonada, mesmo com geometria/material compartilhados.

**Impacto concreto:** para N=500/2000/5000 cópias da vespa, o caminho WebGPU (via Three.js) aloca centenas a milhares de `GPUBuffer`s pequenos adicionais que o caminho WebGL simplesmente não precisa. Isso é compatível em direção e em forma (crescimento ~linear com N) com o achado já validado (2,2x–10,3x mais VRAM no WebGPU, crescendo com N enquanto o WebGL fica plano). Um fator conhecido que pode **amplificar a magnitude** desse efeito é que APIs nativas por trás do Dawn (backend WebGPU do Chrome — D3D12 no Windows) costumam arredondar alocações de buffer para granularidades de página bem maiores que o tamanho lógico solicitado; não há como confirmar esse arredondamento específico neste hardware sem acesso a `chrome://gpu`/profiling do Dawn, então trata-se de hipótese razoável, não fato verificado.

**Ressalva importante:** isso é uma característica da **implementação atual do `WebGPURenderer` do Three.js 0.183.2**, não uma limitação fundamental da API WebGPU. Um renderizador WebGPU nativo bem escrito poderia evitar esse custo usando um único *storage buffer* com todas as N transformações e indexando por `@builtin(instance_index)`, ou *dynamic offsets* num único buffer maior.

**Achado correlato a verificar:** o próprio `src/main-raw-webgpu.js` usa um padrão semelhante — um `GPUBuffer` de 16 bytes por posição do grid, criado em `criarBindGroupOffset` (`main-raw-webgpu.js:345-357`) e instanciado uma vez por cópia em `offsetBindGroups = gridPositions.map(...)` (`main-raw-webgpu.js:488-490`). Embora o tamanho lógico por buffer seja minúsculo (16 bytes), se a granularidade de alocação do driver dominar sobre o tamanho lógico (ver parágrafo acima), o eixo **RAW** de instancing pode exibir um crescimento de VRAM análogo ao do Three.js, em magnitude ainda não comparada aqui. Recomenda-se checar os relatórios `_energia.txt` do `webgpu-raw` no eixo `nNNN` para confirmar se o mesmo padrão aparece — se sim, reforça que a causa raiz é "um buffer de GPU por instância" independente de framework; se não aparecer no RAW, é evidência de que o custo extra é específico da camada de abstração do Three.js (RenderObject por objeto), o que seria ainda mais preciso para citar na monografia.

### Achado 2. MSAA presente no WebGL-RAW mas ausente no WebGPU-RAW

**Onde:** `src/main-raw-webgl.js:174` vs. `src/main-raw-webgpu.js:304-343` e `589-604`.

`main-raw-webgl.js:174` cria o contexto com `canvas.getContext("webgl2", { antialias: true, powerPreference: "high-performance" })` — o WebGL2 aplica multisampling automaticamente no framebuffer padrão quando `antialias: true` é pedido, sem nenhum código adicional.

`main-raw-webgpu.js` **não implementa MSAA em nenhum lugar**: o pipeline (`createPipelines`, linhas 320-343) não declara um campo `multisample`, e o render pass (linhas 591-604) escreve direto em `context.getCurrentTexture().createView()` — sem textura multisampled nem `resolveTarget`. Isso não é um bug de configuração esquecida: **a API WebGPU não oferece nenhuma opção de antialiasing em `GPUCanvasContext.configure()`** — MSAA exige criar manualmente uma textura multisampled, adicionar `multisample: {count: N}` ao pipeline e configurar `resolveTarget` no color attachment do render pass (confirmado em múltiplas fontes: [WebGPU Multisampling — webgpufundamentals.org](https://webgpufundamentals.org/webgpu/lessons/webgpu-multisampling.html), [WebGPU Unleashed — MSAA](https://shi-yan.github.io/webgpuunleashed/Basics/multi_sample_anti_aliasing.html)). Como esse código não existe em `main-raw-webgpu.js`, o resultado é renderização single-sample.

**Impacto:** o WebGL-RAW faz estritamente mais trabalho de GPU por quadro (amostragem 4x nas bordas de triângulos) do que o WebGPU-RAW só por causa dessa lacuna de implementação — não por uma diferença de eficiência das APIs. Isso pode inflar artificialmente o Frame Time / consumo de potência do WebGL-RAW e/ou inflar artificialmente o FPS e a eficiência (Frames/Watt) do WebGPU-RAW nos Cenários A-D e no eixo de instancing, na direção oposta à que normalmente se assume ("WebGPU é mais eficiente"). Corrigir exigiria ou (a) implementar MSAA manual no WebGPU-RAW, ou (b) desativar antialiasing também no WebGL-RAW (`antialias: false`) para igualar a carga de trabalho — decisão que cabe ao autor do TCC.

### Achado 3. Dependências de rede externas não controladas no eixo oficial Three.js (main.js)

**Onde:** `src/main.js:104` (RGBE/HDR) e `src/main.js:118-119` (Draco decoder).

- `rgbeLoader.load("https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr", ...)` — busca um HDR de iluminação de ambiente de um CDN de terceiros (`threejs.org`), sem cópia local no projeto (`public/**/*.hdr` não existe) e sem callback de erro (`rgbeLoader.load(url, onLoad)` — falta o 3º argumento `onError`). Se a rede falhar ou atrasar, a cena simplesmente fica sem `scene.environment` / `scene.background`, sem nenhum aviso no console nem impacto no fluxo de `window.__assetsReady`.
- `dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/")` — busca o decodificador Draco (WASM) do CDN do Google, **mesmo já existindo uma cópia local em `public/draco/`** (`draco_decoder.wasm`, `draco_decoder.js`, `draco_wasm_wrapper.js`) que os dois caminhos RAW já usam (`main-raw-webgl.js:221` e `main-raw-webgpu.js:189`: `draco.setDecoderPath("/draco/")`).

**Por que isso é bloqueante para o rigor metodológico:** `scripts/automatizar_coleta.mjs` abre um **novo contexto de navegador isolado por ensaio** (linha 274, documentado em `COMO-TESTAR-CENARIOS.md` como equivalente a "aba anônima nova", justamente para manter o TTFF frio). Isso significa que o cache HTTP do decoder Draco e do HDR **não pode ser reaproveitado entre execuções** — todo ensaio oficial de `webgl`/`webgpu` (Three.js, 8 das 16 combinações A-D, mais o eixo de instancing) paga uma requisição de rede real a servidores de terceiros antes ou durante a medição de TTFF/frame time. Isso:
1. Introduz variância de latência de rede incontrolável na métrica de TTFF, que o `CLAUDE.md` define como parte do rigor do ensaio.
2. Torna o ensaio **não reprodutível offline** e vulnerável a instabilidade/limite de taxa dos CDNs em lotes longos (`npm run coletar` roda dezenas de ensaios em sequência).
3. Cria uma assimetria entre o eixo Three.js (rede) e o eixo RAW (disco local) que poderia por si só explicar diferenças de TTFF entre os dois eixos que nada têm a ver com WebGL vs. WebGPU.
4. Como não há tratamento de erro no `rgbeLoader.load`, uma falha de rede é silenciosa — o relatório final não indica se o ambiente/iluminação carregou ou não, então dois ensaios "idênticos" podem ter sido renderizados com iluminação/anisotropia de reflexo diferentes sem deixar rastro no `.txt` exportado.

A correção óbvia (auto-hospedar o HDR em `public/` e trocar `setDecoderPath` de `main.js` para `/draco/`, igual às versões RAW) não foi aplicada nesta revisão, conforme a regra de não editar os arquivos-fonte do experimento.

### Achado 4. `featureLevel: 'compatibility'` do `WebGPUBackend` do Three.js pode desativar o MSAA solicitado, silenciosamente

**Onde:** `src/main.js:89` (`new WebGPURenderer({ antialias: true, ... })`) vs. `node_modules/three/src/renderers/webgpu/WebGPUBackend.js:176-226`.

Internamente, ao inicializar, o `WebGPUBackend` do Three.js pede o adaptador com:

```js
const adapterOptions = {
  powerPreference: parameters.powerPreference,
  featureLevel: 'compatibility'
};
const adapter = await navigator.gpu.requestAdapter( adapterOptions );
```

`featureLevel: 'compatibility'` é o **WebGPU Compatibility Mode**, um subconjunto restrito da API pensado para rodar sobre APIs mais antigas como OpenGL ES 3.1 ou Direct3D 11 ([WebGPU Compatibility Mode — webgpufundamentals.org](https://webgpufundamentals.org/webgpu/lessons/webgpu-compatibility-mode.html)). Logo depois, o Three.js verifica se o dispositivo resultante suporta a feature `'core-features-and-limits'` (`WebGPUBackend.js:220`: `this.compatibilityMode = !device.features.has('core-features-and-limits')`), e **se não suportar, força `renderer._samples = 0`** (linha 224) — o que **sobrescreve silenciosamente** a opção `antialias: true` passada em `main.js:89`, sem lançar erro nem log.

Na prática, o Three.js tenta o "modo híbrido" recomendado pela própria documentação de compatibility mode: pedir o adaptador em nível `compatibility`, mas requisitar de volta todas as features suportadas (incluindo `core-features-and-limits`) para recuperar o comportamento "core" completo quando o hardware permite (`WebGPUBackend.js:193-212`, laço sobre `Object.values(GPUFeatureName)`). Em uma GPU dedicada moderna como a RTX 3050 com um Chrome atualizado, o esperado é que `core-features-and-limits` esteja disponível e `compatibilityMode` acabe `false` — mas isso não foi confirmado experimentalmente nesta revisão (sem acesso ao navegador do usuário nem a `chrome://gpu`). É uma hipótese verificável, não um fato confirmado.

**Recomendação de verificação (não uma correção de código):** antes de confiar nos dados oficiais do eixo WebGPU/Three.js, abrir o console do navegador durante um ensaio manual e inspecionar `renderer.backend.compatibilityMode` — se vier `true`, o WebGPU está rodando sem MSAA enquanto o WebGL (`antialias: true` sempre respeitado pelo `WebGLRenderer` clássico) está com MSAA ligado, o que replicaria o mesmo tipo de viés do achado 2 (mas no eixo Three.js em vez do RAW).

## III.2 Severidade 2 — Risco moderado de viés

### Achado 5. Ausência de mipmaps no WebGPU-RAW, presentes no WebGL-RAW

> **Atualização (2026-08-24):** este achado foi corrigido na varredura de código de 2026-08-24 — geração manual de mipmap adicionada em `main-raw-webgpu.js` (ver `CHANGES-LOG.md` e Parte II, §II.9.2). Texto original mantido como registro histórico da análise.

**Onde:** `src/main-raw-webgpu.js:368-388` (`createTextureBindGroups`) e `:492-495` (sampler) vs. `src/main-raw-webgl.js:343-348` (`createGLTexture`).

`main-raw-webgl.js:347-348` chama `gl.generateMipmap(gl.TEXTURE_2D)` e usa `gl.LINEAR_MIPMAP_LINEAR` — uma pirâmide de mip completa e filtragem trilinear. `main-raw-webgpu.js` criava a textura sem especificar `mipLevelCount` (linhas 372-376, que por padrão é `1`) e o sampler declarava `mipmapFilter: "linear"` (linha 493), que é um no-op quando só existe 1 nível de mip. **A API WebGPU não tem um equivalente nativo de `generateMipmap`** — gerar mips exige implementar manualmente passes de renderização por nível ou usar uma utilitária externa como a do [webgpu-samples](https://deepwiki.com/webgpu/webgpu-samples/6.3-texture-processing-and-mipmap-generation) ou [webgpu-utils](https://greggman.github.io/webgpu-utils/docs/functions/generateMipmap.html) ([confirmado também em Toji.dev](https://toji.dev/webgpu-best-practices/img-textures.html) e na própria [discussão do grupo de trabalho do WebGPU](https://github.com/gpuweb/gpuweb/issues/386)). Isso não era um erro de configuração isolado — era trabalho extra que simplesmente não tinha sido implementado no lado WebGPU.

**Impacto (histórico, antes da correção):** afetava os Cenários B/C/D (com textura) e o eixo de instancing (`vespa.glb` também tem textura). Sem mip chain, o WebGPU-RAW sofria mais *aliasing* em superfícies distantes/anguladas e podia ter pior localidade de cache de textura ao amostrar sempre o nível base em resolução total — o que poderia tanto aumentar quanto mascarar diferenças de largura de banda entre os dois back-ends, dependendo da distância da câmera ao longo do trajeto, e favorecia artificialmente o WebGPU-RAW por renderizar menos trabalho de amostragem de textura que o WebGL-RAW.

### Achado 6. Nenhum registro persistente, por execução, confirmando qual GPU física foi usada no eixo Three.js

**Onde:** `src/main.js` (nenhuma linha equivalente) vs. `src/main-raw-webgl.js:177-185` e `src/main-raw-webgpu.js:172-177`.

Os dois modos RAW imprimem no console qual GPU física foi selecionada (`WEBGL_debug_renderer_info` / `adapter.info`), e o `COMO-TESTAR-CENARIOS.md` (seção 1) instrui o usuário a "confirmar ali antes de coletar dados oficiais" — reconhecendo explicitamente que `powerPreference: "high-performance"` é **ignorado pelo Chrome/Edge no Windows para WebGPU** ([crbug.com/369219127](https://crbug.com/369219127), já citado no próprio projeto). `main.js`, que dirige os 8 combos oficiais Three.js (A-D × WebGL/WebGPU) e o eixo de instancing, **não faz nenhuma verificação ou log equivalente**. Além disso, mesmo quando esse log existe (nos RAWs), `automatizar_coleta.mjs` só captura `console.error` via `page.on("console", ...)` (linha 281-283), não `console.log` — então nem mesmo o log dos RAWs fica persistido em disco por execução.

**Impacto:** a Regra 2 do `CLAUDE.md` ("invalidando o rigor do ensaio" se a iGPU for usada por engano) depende inteiramente de uma configuração do Windows feita uma vez e presumida estável durante todo o lote — sem qualquer verificação automatizada por execução, uma regressão silenciosa (Windows Update, reinstalação de driver, mudança de caminho do executável do Chrome) poderia mover uma fração ou a totalidade do lote para a iGPU Intel sem deixar nenhum rastro auditável nos `resultados/`.

### Achado 7. Aquecimento (warm-up) único para o lote inteiro, não por combinação/API

**Onde:** `scripts/automatizar_coleta.mjs:401-418` (na versão vigente na época desta revisão).

Apenas a primeira combinação pós-embaralhamento (`combinacoes[0]`) recebe um ensaio de aquecimento descartado; o comentário no código deixa claro que o objetivo é térmico ("tira a GPU do estado frio"). Isso é razoável para o estado térmico da GPU (que é compartilhado entre APIs), mas caches de *shader pipeline* do Dawn (WebGPU) e do ANGLE (WebGL) são independentes por back-end — o aquecimento só compila/aquece o cache de shader do modo sorteado, não dos outros três. Como a primeira ocorrência de cada combinação (modo × cenário) sempre cai na "rodada 1" do laço de repetições, toda "rodada 1" de todo combo (exceto o sorteado para aquecimento) sofre compilação de shader a frio, um custo que "rodada 2/3" do mesmo combo não paga. O efeito é aleatório em relação a qual API se beneficia (não sistematicamente a favor de uma), e já é parcialmente mitigado pela prática documentada de tirar a média entre repetições — por isso é severidade moderada, não bloqueante.

## III.3 Severidade 3 — Melhoria menor / idiomática, sem impacto científico direto

### Achado 8. Ausência de tratamento de `device.lost`, `uncapturederror` e `webglcontextlost`

Nenhum dos três arquivos-fonte (`main.js`, `main-raw-webgpu.js`, `main-raw-webgl.js`) registra `device.lost.then(...)`, `device.addEventListener("uncapturederror", ...)` (WebGPU) ou `canvas.addEventListener("webglcontextlost", ...)` (WebGL). A omissão é simétrica entre as APIs (não introduz viés direcional), mas significa que uma perda de contexto/dispositivo em qualquer ensaio (mais provável sob a pressão de VRAM do Cenário D ou de N=5000 no instancing, justamente os testes de "ruptura" que o projeto quer capturar) pode deixar a página renderizando quadros corrompidos ou travados sem nenhum erro registrado no console, contaminando silenciosamente um relatório que ainda assim seria exportado como se fosse válido.

### Achado 9. `depthStoreOp: "discard"` no WebGPU-RAW sem equivalente configurado no WebGL-RAW

**Onde:** `src/main-raw-webgpu.js:598-603`.

`depthStencilAttachment.depthStoreOp: "discard"` evita escrever de volta o depth buffer ao final do render pass — uma boa prática idiomática em WebGPU (o depth buffer não é mais necessário após o frame). O WebGL-RAW não tem um comando exatamente equivalente configurado (por exemplo, `gl.invalidateFramebuffer`) para dar essa mesma dica ao driver. Na prática, esse ganho de banda de memória importa sobretudo em GPUs *tile-based* (comuns em mobile); a RTX 3050 é uma GPU desktop de renderização imediata, então o impacto real aqui tende a ser pequeno ou desprezível — incluído por completude, não por preocupação de viés relevante.

### Achado 10. Ressalva sobre a nota de "fidelidade visual" dos modos RAW (`COMO-TESTAR-CENARIOS.md` §7)

O documento já registra, como limitação conhecida, que os modos RAW amostram apenas a textura de cor base (sem normal map/roughness/AO) e afirma que isso "não afeta as métricas de desempenho". Isso é otimista: amostrar 1 textura por fragmento em vez de várias (como um `MeshStandardMaterial` PBR completo faria no eixo Three.js) é estritamente menos trabalho de GPU por fragmento. Isso não introduz viés **dentro** do eixo RAW (WebGL-RAW e WebGPU-RAW têm exatamente a mesma simplificação), mas enfraquece um pouco a comparação **entre** o eixo RAW e o eixo Three.js — "RAW é mais rápido" reflete parcialmente um shader mais simples, não só menos overhead de framework. Não é uma ação de código, apenas uma nuance a considerar ao redigir a metodologia.

## III.4 Itens verificados e considerados corretos (sem achado)

Registrado aqui para deixar claro o que foi checado e não gerou preocupação, para não dar a impressão de que só se procurou problemas:

- **Regra 2 (powerPreference / await init) está implementada corretamente nos três arquivos:** `main.js:89-91` e `:101`, `main-raw-webgpu.js:169` e `:179`, `main-raw-webgl.js:174`. O código cumpre a letra da regra; a limitação conhecida é a do Chromium/Windows já documentada pelo próprio projeto (ver achado 6 acima sobre falta de verificação automatizada).
- **A métrica de Draw Calls é equivalente entre os dois motores.** `main.js:298` usa `renderer.info.render.drawCalls` (WebGPU) vs. `renderer.info.render.calls` (WebGL). Conferindo o código-fonte do Three.js (`node_modules/three/src/renderers/common/Info.js:108,139` e `node_modules/three/src/renderers/webgl/WebGLInfo.js:20,54`), os dois contadores são **resetados a cada frame** e incrementados uma vez por draw call real — são semanticamente equivalentes, não um viés. O comentário em `main.js:289-296` sobre ler `drawCalls` *depois* de `renderer.render()` (por causa do laço de animação interno do WebGPURenderer) também está correto e já documentado no `CHANGES-LOG.md`.
- **Nenhum `.dispose()` explícito em nenhum dos três arquivos** — simétrico entre as APIs, e como `automatizar_coleta.mjs` fecha o `BrowserContext` inteiro ao final de cada ensaio (`context.close()`, linha 319), os recursos de GPU do processo são liberados de qualquer forma a cada execução. Não compromete a validação de VRAM já feita.
