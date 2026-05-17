# AGENTS.md - Contexto e Instruções para o Claude (TCC WebGPU)

## Objetivo do Projeto
O usuário (Victor) está desenvolvendo um Trabalho de Conclusão de Curso (TCC) em Ciência da Computação. O foco é um **estudo comparativo de desempenho entre WebGL e WebGPU** na renderização de ambientes arquitetônicos 3D de larga escala na web. O objetivo não é criar um visualizador bonito, mas sim uma **bancada de testes rigorosa** para extrair métricas de estresse de hardware.

## Stack Tecnológica Obrigatória
1. **JavaScript Vanilla** (Proibido usar React, Vue, Angular, Svelte ou React Three Fiber). O foco é evitar gargalos de frameworks na CPU.
2. **Vite** como empacotador.
3. **Three.js** como motor gráfico principal.
4. **Stats.js** (ou APIs nativas do navegador) para instrumentação de métricas.
5. Formatos de modelo: **GLTF/GLB** com compressão geométrica **Draco**.

## Restrição Crítica 1: Congelamento de Versões
- O projeto exige estabilidade científica para não invalidar os gráficos e testes ao longo dos meses.
- **NUNCA** sugira atualizar a versão do Three.js ou do Vite.
- O código gerado deve ser sempre compatível com a versão fixa `0.162.0` do Three.js. 
- Se alguma API do Three.js mudou em versões recentes (ex: TSL - Three Shading Language ou instanciamento do WebGPURenderer), forneça a sintaxe exata compatível com a versão `0.162.0`.

## Restrição Crítica 2: Rigor Experimental (Isolamento de Variáveis)
- O código gerado para medição de desempenho deve ser livre de interferência humana.
- **NÃO** sugira `OrbitControls` ou controles de mouse/teclado para testes de benchmark. A câmera deve sempre seguir um "trilho" automatizado via código (ex: animação de *spline* ou matemática de rotação fixa no `requestAnimationFrame`) para garantir que os testes do WebGL e WebGPU renderizem exatamente os mesmos *frames*.
- Sempre que criar rotinas de carregamento de recursos de rede, adicione instruções ou lógicas para lidar com o cache do navegador, pois o teste medirá o tempo de decodificação do algoritmo Draco (Time to First Frame).

## Coleta de Métricas (Atenção Máxima)
Sempre que o usuário pedir para medir desempenho, o código deve extrair dados numéricos exatos, preferencialmente usando as seguintes fontes:
1. **Gargalo de CPU (Draw Calls):** Extrair via `renderer.info.render.calls`.
2. **Fluidez Visual:** Priorizar a medição de *Frame Time* (em milissegundos) usando `performance.now()` ao invés de apenas médias de FPS.
3. **Consumo de Memória:** Extrair VRAM (geometrias e texturas alocadas) via `renderer.info.memory`.

## Estilo de Código e Respostas
- O código deve ser modular, assíncrono (usando `async/await` onde couber, especialmente para o carregamento do modelo e decodificadores) e focado em performance.
- Respostas devem ser diretas, com o código completo do módulo solicitado. Não forneça fragmentos incompletos com `// ... resto do código aqui`, a menos que o arquivo seja excessivamente longo.
- Mantenha o idioma em Português (Brasil) para explicações. Comentários no código podem ser em português para facilitar a leitura da banca avaliadora.
- Se o usuário pedir para gerar texto teórico (para a monografia), lembre-se que o formato final do documento segue o padrão de artigo da SBC (Sociedade Brasileira de Computação) ou evento equivalente, com foco em resultados empíricos, evitando linguagem opinativa ou coloquial.

## Regra de Ouro da Arquitetura WebGPU no Three.js
- O usuário está testando a transição de paradigma. Quando gerar código específico para o teste WebGPU, garanta a inicialização correta assíncrona do motor (`await renderer.init()`) e o uso da sintaxe de nós (`three/nodes`), caso o teste exija materiais que aproveitem o *Compute Shader* da placa de vídeo. 
- Quando gerar código para o teste WebGL, use a sintaxe clássica. O repositório precisará de uma chave (ou botões no HTML) para destruir um contexto e inicializar o outro.

---
**Checklist de Validação antes de enviar a resposta:**
- [ ] O código usa Vanilla JS (sem React)?
- [ ] A solução não quebra na versão fixada do Three.js?
- [ ] O método de câmera para o benchmark dispensa intervenção manual?
- [ ] As medições de performance estão focadas em métricas quantitativas (milissegundos e chamadas)?

---

# AGENTS.md - CONTEXTO DO PROJETO E DIRETRIZES DE IA

> **Instrução para a IA Assistant:** Leia este arquivo com atenção antes de sugerir ou implementar qualquer alteração no código. Você deve respeitar rigorosamente a arquitetura, a pilha tecnológica e as restrições metodológicas estabelecidas abaixo para evitar quebras de escopo e regressões de código.

---

## 1. ESCOPO DO PROJETO e CONTEXTO DO TCC
* **Autor:** Victor Querino Martins (Bacharelado em Ciência da Computação - UNESPAR Apucarana).
* **Objetivo Geral:** Estudo Comparativo de Desempenho Gráfico e Eficiência Energética entre as APIs WebGL e WebGPU no ecossistema Web, utilizando modelos arquitetônicos de alta complexidade.
* **Hardware de Teste Fixo:** Computador equipado com GPU dedicada NVIDIA GeForce RTX 3050 Laptop GPU (4GB VRAM limit).
* **Foco de Otimização:** Computação Verde (Green IT). Avaliar a taxa de quadros e o tempo de frame, confrontando-os posteriormente com logs externos de consumo de energia instantânea em Watts extraídos via `nvidia-smi`.

---

## 2. PILHA TECNOLÓGICA (TECH STACK)
* **Core Engine:** Three.js (Módulos ES6 nativos via JavaScript puro).
* **Build Tool / Servidor Local:** Vite (Porta padrão: `5173`).
* **Formatos 3D:** Arquivos `.glb` otimizados e comprimidos via Google Draco Compression.
* **Componentes de Telemetria:** `stats.js` (Feedback visual de FPS) e uma lógica interna em JavaScript para cálculo de médias matemáticas e exportação de dados.
* **Ambiente Espacial:** Iluminação baseada em imagem via `RGBELoader` (HDR `venice_sunset_1k.hdr`).

---

## 3. MATRIZ DE CENÁRIOS EXPERIMENTAIS (ESTRUTURA DE ATIVOS)
O modelo tridimensional de teste é o **Amazon Lumberyard Bistro**. Ele foi fracionado estritamente em 3 arquivos dentro da pasta `public/`, que servem como a matriz do benchmark:

1. **Cenário A (Baseline / Geometria Pura):** `CenarioBistroA.glb` (~15 MB). Estrutura poligonal limpa, sem mapas de textura aplicados.
2. **Cenário B (Média Carga / 0.5K):** `CenarioBistroB.glb` (~115 MB). Materiais vinculados a imagens PNG compactadas em lote via ImageMagick para a resolução exata de 512x512 pixels (Power of Two).
3. **Cenário C (Alta Carga / 1K):** `CenarioBistroC.glb` (~328 MB). Materiais vinculados a imagens PNG em resolução estável de 1024x1024 pixels.

*❌ NOTA DE RESTRIÇÃO DE ESCOPO:* Mapas em resolução 2K (2048x2048px) causaram falhas catastróficas por falta de memória (*Out Of Memory* / Crash de VRAM) na RTX 3050 durante os ensaios preliminares e foram desconsiderados do escopo contínuo. **Não sugira texturas acima de 1K.**

---

## 4. DIRETRIZES E REGRAS DE IMPLEMENTAÇÃO CRÍTICAS (GUARDRAILS)

### Rule 1: Arquitetura Monolítica Inteligente de Renderer
Não crie arquivos de código separados para WebGL e WebGPU. O sistema deve utilizar **um único arquivo de entrada (`src/main.js`)** que chaveia o motor de renderização dinamicamente em tempo de execução ao ler os parâmetros de busca da URL (*Query Strings*):
* `http://localhost:5173/?api=webgl` -> Instancia o `THREE.WebGLRenderer` convencional.
* `http://localhost:5173/?api=webgpu` -> Instancia o `WebGPURenderer` moderno.

### Rule 2: Imutabilidade do Trilho de Câmera (*Flight Path*)
A trajetória de automação da câmera foi calibrada milimetricamente para evitar colisões com as paredes da calçada e os objetos decorativos internos (mancebo da porta principal) observados em gravações de teste. **Nunca altere as coordenadas do array `CatmullRomCurve3`**, a menos que explicitamente solicitado pelo usuário.

### Rule 3: Formatação Estrita do Relatório de Saída
A função `exportarMetricasCSV` calcula em tempo real o FPS médio, o FPS mínimo (ponto de engasgo), o FPS máximo, o Frame Time médio e o máximo. Ela dispara o download automático de um arquivo `.txt` estruturado com o sumário exato requisitado para colagem direta no texto da monografia. Mantenha essa estrutura textual intacta.