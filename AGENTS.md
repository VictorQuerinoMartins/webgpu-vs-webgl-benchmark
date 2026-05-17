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