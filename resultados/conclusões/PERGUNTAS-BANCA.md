# Possíveis Perguntas da Banca — Respostas Preparadas

> Perguntas técnicas antecipadas sobre decisões metodológicas do projeto, com a resposta já elaborada. Adapte o tom antes de usar como apoio na apresentação.

---

## 1. `scene.clone()` em vez de `THREE.InstancedMesh` no eixo de instancing não invalida a arquitetura do WebGPU, que "compacta tudo numa única requisição"?

**Resposta resumida:** Não invalida — `scene.clone()` preserva N *draw calls* reais por quadro, que é exatamente a variável que este eixo quer medir; `InstancedMesh` colapsaria isso para 1 chamada em ambas as APIs e apagaria o próprio efeito que se quer observar.

**Não invalida — é o desenho correto para a variável que esse eixo mede.** A pergunta mistura dois conceitos distintos do WebGPU:

- **O que existe de fato:** um frame inteiro é gravado num único `GPUCommandEncoder`/`GPUCommandBuffer` e submetido de uma vez via `device.queue.submit([enc.finish()])` (`main-raw-webgpu.js`, ver `docs/pesquisa/pesquisa-webgpu-webgl.md` linha 252, Parte II §II.4.2). Isso é uma submissão única *à fila da GPU* — dentro desse único command buffer podem existir N chamadas `draw()`, uma por objeto, todas gravadas e despachadas juntas. No WebGL clássico não existe essa separação gravação/submissão: cada `gl.drawElements` é uma chamada imediata sobre o contexto, revalidada pelo driver a cada vez (mesmo doc, linha 254).
- **O que NÃO existe:** nenhum dos dois back-ends do Three.js (`WebGLRenderer` nem `WebGPURenderer`) funde automaticamente N `Mesh` independentes num único draw call só por compartilharem geometria/material. Isso só acontece com uma API explícita de *batching* — `THREE.InstancedMesh` ou `THREE.BatchedMesh`. Cada `scene.clone()` (`main.js:194`) continua sendo um `Object3D`/`Mesh` distinto, com sua própria `matrixWorld`, e o Three.js emite um `draw()` por objeto na *render list*, independente do back-end.

**O que o WebGPU de fato promete reduzir** não é o número de draw calls emitidos — é o **custo de CPU por draw call**: pipelines e bind groups são compilados/validados uma vez e só trocados (`setPipeline`/`setBindGroup`), enquanto o WebGL revalida estado global a cada `gl.draw*`. É essa hipótese que Sengupta et al. (2025) testam e que a decomposição CPU/GPU do projeto (Overhead de CPU = Frame Time − Tempo de GPU) foi desenhada para isolar.

**Consequência para o desenho experimental:** se `THREE.InstancedMesh` tivesse sido usado, as N cópias colapsariam para 1 draw call em **ambas** as APIs (instancing via `drawArraysInstanced`/equivalente é suportado igualmente por WebGL2 e WebGPU) — isso apagaria exatamente a variável que o eixo de instancing quer expor (overhead de submissão de draw calls crescendo com N), porque as duas APIs passariam a fazer a mesma coisa (1 chamada) independente de N. `scene.clone()` sem `InstancedMesh` é o que preserva N draw calls reais por frame e deixa a diferença de overhead entre WebGL e WebGPU aparecer — a própria definição de Draw Calls no `CLAUDE.md` §3 ("variável principal para expor o gargalo de overhead do WebGL"). Essa decisão já está documentada em código (`main.js:186`) e no `CLAUDE.md` §4 ("várias cópias, sem `THREE.InstancedMesh`").

**Se quisesse testar a outra pergunta** (quanto WebGL e WebGPU ganham de *throughput* bruto quando ambos usam instancing de verdade), seria um eixo experimental adicional, complementar — não um substituto do atual, e fora do escopo declarado.

---

## 2. O texto diz que o gargalo de Draw Calls do WebGL é na CPU — mas o experimento não está testando a GPU?

**Resposta resumida:** FPS/Frame Time medem o pipeline inteiro (CPU+GPU), não só a GPU; por isso o projeto também mede o Tempo de GPU separadamente (via *timestamp queries*) e calcula o Overhead de CPU por subtração — essa decomposição é o que isola o gargalo de CPU descrito na teoria.

**As duas coisas são medidas, mas Frame Time/FPS não é uma métrica "só de GPU" — é o pipeline inteiro.** A confusão mistura o que cada métrica do trabalho realmente mede:

- **FPS e Frame Time (métrica primária) medem o tempo de parede do quadro inteiro** — CPU montando/validando comandos **mais** GPU executando-os, o que for mais lento domina o resultado. Não isolam CPU de GPU sozinhos.
- **O gargalo que a Fundamentação Teórica descreve é especificamente do lado da CPU:** no WebGL, antes de cada `gl.drawElements`/`gl.drawArrays`, o *driver* consulta a máquina de estados (qual *shader* está ativo, qual *buffer* vinculado, qual textura carregada) e revalida tudo a cada chamada (Akenine-Möller, Haines e Hoffman, 2018; Sarker, Jérôme e Malik, 2023 — já citados na Fundamentação). Esse trabalho de validação acontece **antes** do comando chegar na GPU — com milhares de Draw Calls, a CPU pode ficar tão ocupada validando estado que a GPU fica ociosa esperando o próximo comando, e esse atraso aparece no FPS igual, mesmo sendo um gargalo de CPU.
- **É exatamente por isso que o projeto tem a decomposição CPU/GPU** (CLAUDE.md §3.A, "adicionado 2026-08-24"): *timestamp queries* nativas (`timestamp-query` do WebGPU/`WebGPURenderer` via `trackTimestamp`; `EXT_disjoint_timer_query_webgl2` do WebGL2) medem o **tempo real de execução na GPU**, isolado do tempo de parede do quadro. `Overhead de CPU = Frame Time − Tempo de GPU` é o que sobra — a parte da CPU (submissão + validação de estado). Frame Time sozinho não separa os dois; essa métrica (Tabela 3 — Decomposição CPU/GPU, `gerar_tabela_txt.mjs`) separa.

**Por que o eixo de instancing é o teste mais limpo desse gargalo especificamente:** a Vespa é geometricamente simples — cada cópia dá pouco trabalho de renderização pra GPU. Nesse eixo, quase todo o Frame Time que sobra depois de descontar o Tempo de GPU **é** o custo de CPU por Draw Call que a teoria descreve, o que isola o gargalo de forma mais pura do que a progressão de textura (Cenários A--D), onde o custo dominante é outro (banda de memória/amostragem de textura, já do lado da GPU) — é essa diferença de gargalo entre os dois eixos que explica por que o WebGPU ganha em instancing mas não necessariamente em carga de textura.

**E a dimensão de Green IT (potência/VRAM/temperatura) é, essa sim, uma medição só de GPU:** vem do `nvidia-smi`, processo externo ao navegador que lê exclusivamente o hardware da dGPU dedicada (CLAUDE.md §3.B) — não tem componente de CPU nenhum. Ou seja: FPS/Frame Time = pipeline inteiro (CPU+GPU); Tempo de GPU/Overhead de CPU = decomposição do pipeline; Potência/VRAM/Temperatura = só a GPU dedicada. As três coisas coexistem no mesmo experimento porque respondem perguntas diferentes.

---

# Parte 2 — Perguntas Básicas/Gerais (banca sem especialista em Computação Gráfica)

> A banca só tem o orientador como especialista na área. As perguntas abaixo são do tipo que qualquer professor de Ciência da Computação faria em qualquer defesa — pouco jargão gráfico, foco em relevância, rigor geral e "o que isso significa na prática". Respostas mais curtas e diretas de propósito; a profundidade técnica fica pra quando o orientador (ou alguém) pedir mais detalhe.

---

## 3. Em termos simples, o que são WebGL e WebGPU, e por que comparar as duas importa?

**Resposta resumida:** São as duas formas que o navegador tem de acessar a GPU; WebGPU é a sucessora mais nova, feita pra resolver a sobrecarga de CPU que o WebGL sofre em cenas com muitos objetos. A comparação importa porque migrar custa caro, e este trabalho mede se — e quando — esse custo se paga.

São as duas formas que um navegador tem hoje de acessar a GPU pra desenhar gráficos 3D. WebGL existe desde 2011 e é o padrão atual — praticamente todo navegador suporta. WebGPU é a sucessora, mais nova (chegou ao Chrome estável em 2023), desenhada do zero pra corrigir uma limitação estrutural do WebGL: o jeito como ela manda comandos de desenho pra GPU sobrecarrega demais a CPU quando a cena tem muitos objetos. A comparação importa porque toda empresa que hoje usa WebGL pra visualização 3D na web (CAD, e-commerce, digital twins, maquetes arquitetônicas) vai ter que decidir, nos próximos anos, se e quando migra pra WebGPU — e essa decisão custa caro (reescrever o motor gráfico). Este trabalho mede, com dados, se esse custo se paga, e em quais situações.

## 4. Por que fazer isso no navegador (web), e não numa engine nativa como Unity, Unreal ou Godot?

**Resposta resumida:** Porque WebGL/WebGPU são APIs específicas do navegador — o objetivo é comparar essas duas, não motores de jogo nativos, que usam outras APIs por baixo (DirectX/Vulkan/Metal) e resolvem um problema diferente.

Porque WebGL e WebGPU são especificamente as APIs gráficas *da web* — o objetivo não é comparar motores de jogo, é comparar duas formas de acessar a GPU dentro do navegador. Unity/Unreal rodam nativamente no sistema operacional e usam outras APIs por baixo (DirectX, Vulkan, Metal); não é o mesmo problema. A relevância prática também é diferente: quando uma aplicação precisa rodar direto no navegador, sem instalação — o caso de visualização arquitetônica pra cliente, portais de e-commerce, ferramentas de CAD embarcadas — WebGL/WebGPU são as únicas opções, não Unity ou Unreal.

## 5. Como vocês garantem que a medição é confiável, e não é "rodar uma vez e anotar o número"?

**Resposta resumida:** 9 repetições por combinação, ordem sorteada de novo a cada rodada, e coleta 100% automatizada por *script* — sem intervenção humana durante os ensaios.

Três coisas, nessa ordem: (1) cada combinação de API e cenário é repetida 9 vezes, não uma; (2) a ordem de execução dentro de cada repetição é sorteada de novo a cada rodada (randomização em blocos), pra que um viés de aquecimento progressivo da GPU ao longo da coleta não penalize sistematicamente sempre a mesma combinação; (3) a coleta inteira é automatizada por *script* (Playwright controlando um Chrome real) — sem intervenção manual de mouse/teclado durante os 60 segundos de cada ensaio, porque interação humana contamina o FPS medido. Qualquer pessoa reproduz o experimento inteiro com dois comandos (`npm run dev` + `npm run coletar`).

## 6. Por que medir consumo de energia faz parte de um TCC de Ciência da Computação? Isso não seria tema de Engenharia Elétrica?

**Resposta resumida:** Sim, é Ciência da Computação — Computação Verde (*Green IT*) é uma linha de pesquisa estabelecida na área; a pergunta é sobre desempenho de *software* (qual API é mais eficiente), não sobre eletrônica.

Computação Verde (*Green IT*) é uma linha de pesquisa estabelecida dentro da própria Ciência da Computação — a pergunta não é "quanta energia a GPU gasta fisicamente" (isso sim seria Engenharia), é "será que a API graficamente mais rápida é também a mais eficiente energeticamente", uma pergunta de desempenho de *software*, não de hardware. Faz parte do mesmo raciocínio que motiva medir complexidade de algoritmos: dado um mesmo hardware fixo, o *software* (nesse caso, a API gráfica escolhida) muda o consumo de energia — e isso é decisão de engenharia de software, não de eletrônica.

## 7. Por que usar apenas um notebook, uma GPU? Os resultados generalizam pra outro hardware?

**Resposta resumida:** Os números absolutos não generalizam — o padrão relativo observado (WebGPU ganha em muitos objetos, perde em textura) sim. Hardware fixo é escolha deliberada por reprodutibilidade, e essa limitação já está documentada no trabalho.

Não generalizam automaticamente — e isso já está documentado como limitação do trabalho. A escolha de hardware fixo é deliberada: é o que garante reprodutibilidade (qualquer variação de GPU/driver introduziria uma variável incontrolada a mais). O que o trabalho generaliza é o *padrão relativo* observado — WebGPU ganha em cenas com muitos objetos e perde em cenas com muita textura, mediado por Three.js — não os números absolutos de FPS/Watts, que são específicos dessa RTX 3050. Replicar em outras combinações de GPU/*driver*/navegador é justamente uma das sugestões de trabalhos futuros.

## 8. Por que usar o modelo Bistro, e não uma maquete arquitetônica real, de vocês?

**Resposta resumida:** O Bistro é um ativo público de referência da comunidade de computação gráfica — garante comparabilidade com outros estudos e reprodutibilidade por terceiros, o que uma maquete própria não garantiria.

O Bistro é um ativo público da NVIDIA (repositório ORCA, liberado pra pesquisa), amplamente usado pela comunidade de computação gráfica como cena de referência pra testes de desempenho — isso garante que os resultados sejam comparáveis com outros trabalhos que usam o mesmo modelo, e que qualquer pessoa consiga reproduzir o experimento sem depender de um ativo proprietário nosso. Uma maquete própria introduziria uma variável a mais (não dá pra saber se um resultado é do modelo ou da API) e não seria replicável por terceiros.

## 9. Quais as contribuições novas desse trabalho em relação à literatura já existente?

**Resposta resumida:** Isolar, com dados, quanto do desempenho do WebGPU vem da especificação da API e quanto vem da maturidade da implementação do Three.js — algo que a literatura levanta como hipótese, mas não mede diretamente.

A decomposição RAW-*versus*-Three.js é o achado mais relevante: a literatura recente (Sengupta et al., 2025) já questiona se o ganho teórico do WebGPU se converte em ganho prático quando mediado por um *framework* de mercado, mas sem isolar numericamente quanto do desempenho observado vem da API e quanto vem da maturidade da implementação do *framework*. Este trabalho isola essa variável rodando os quatro modos (WebGL/WebGPU, com e sem Three.js) lado a lado, e mostra que boa parte do desempenho ruim do WebGPU sob carga de textura é do `WebGPURenderer` do Three.js, não da especificação WebGPU em si.

## 10. Quais as limitações desse trabalho?

**Resposta resumida:** Hardware/navegador únicos e fixos, escopo limitado ao Three.js como camada de abstração, causa do crescimento de VRAM no *instancing* ainda não rastreada no código-fonte, e uma ressalva pontual de *throttling* térmico em sessões de coleta longas.

Resumidamente: (1) hardware e navegador únicos e fixos (RTX 3050 mobile, Google Chrome) — trade-off deliberado por reprodutibilidade, não generaliza pra outras GPUs/*drivers*; (2) o experimento cobre exclusivamente Three.js como camada de abstração, não dá pra isolar quanto da maturidade observada é específica dessa biblioteca; (3) o crescimento desproporcional de VRAM do WebGPU no eixo de *instancing* foi observado de forma consistente mas sua causa não foi rastreada até o código-fonte do `WebGPURenderer` — é um indício forte, não uma explicação mecanística fechada; (4) uma verificação pontual (não estatística, n=1) mostrou que sessões de coleta longas (~100min) sofrem *throttling* térmico sustentado que a randomização em blocos mitiga só parcialmente — documentado como ressalva metodológica.
