# 🏛️ WebGL vs WebGPU: Benchmark de Renderização Arquitetônica de Larga Escala

Este repositório contém a bancada de testes experimentais desenvolvida para o Trabalho de Conclusão de Curso (TCC) em Ciência da Computação. O projeto visa medir e comparar o desempenho gráfico e computacional entre as APIs WebGL e WebGPU na renderização de modelos 3D complexos na web.

**Pesquisador:** Victor Querino Martins  
**Instituição:** UNESPAR - Universidade Estadual do Paraná (Campus Apucarana)  

---

## 🎯 Objetivo e Justificativa (O Porquê)

Aplicações web que lidam com visualização arquitetônica, engenharia e maquetes virtuais (BIM) frequentemente esbarram em um limite de hardware. O ecossistema padrão baseado em **WebGL** sofre de um severo gargalo na CPU (*Central Processing Unit*) ao processar milhares de *Draw Calls* simultâneas. O navegador gasta mais tempo validando os estados de renderização do que efetivamente desenhando os pixels, causando quedas drásticas de fluidez (FPS) em modelos densos.

O surgimento da API **WebGPU** promete revolucionar esse cenário ao permitir um controle de baixo nível sobre a placa de vídeo, pré-validação de *pipelines* e a separação da carga de trabalho (Compute Shaders), desafogando a *thread* principal do JavaScript. 

Este projeto constrói um ambiente estéril e rigoroso para testar, na prática, se a transição de paradigma para WebGPU justifica a refatoração de motores de renderização, focando no carregamento e visualização de um modelo arquitetônico de referência de milhões de polígonos.

---

## 🔬 Metodologia e Isolamento de Variáveis

Para garantir o rigor científico e a reprodutibilidade do benchmark, o ambiente foi projetado com as seguintes restrições:

- **Stack Purista:** O projeto utiliza **Vanilla JavaScript** com o empacotador **Vite**. O uso de frameworks reativos (React, Vue, etc.) foi descartado para evitar ruídos de processamento no *Event Loop* durante a coleta de dados.
- **Congelamento de Dependências:** O motor gráfico **Three.js** está estritamente fixado na versão `0.162.0` no `package.json`, garantindo que atualizações futuras da biblioteca não invalidem os dados comparativos.
- **Automação de Câmera:** Nenhuma interação humana (como mouse ou teclado) é utilizada nos testes de estresse. A câmera percorre um trilho (*spline*) automatizado e imutável para assegurar que ambas as APIs renderizem o exato mesmo frustum visual a cada frame.
- **Modelo de Controle ("Paciente Zero"):** Os testes utilizam um único modelo de domínio, compactado via **Draco Compression**, para avaliar não apenas a renderização bruta, mas também o tempo de decodificação no navegador.

---

## 📊 Métricas Coletadas

As ferramentas de instrumentação do projeto extraem dados quantitativos baseados nos seguintes indicadores:

1. **Draw Calls (Sobrecarga de CPU):** - Medição do número exato de requisições de desenho enviadas à GPU por quadro. Métrica principal para identificar o ponto de falha do WebGL.
2. **Frame Time (Fluidez Visual):** - Tempo de processamento de cada quadro medido em milissegundos (ms) via `performance.now()`. Essa métrica é priorizada em relação à média geral de FPS para capturar engasgos de processamento (*stutters*).
3. **Consumo de Memória (VRAM / RAM):** - Monitoramento dinâmico da alocação de texturas e geometrias na memória de vídeo, além do *Heap Size* consumido pelo JavaScript, a fim de avaliar a eficiência do gerenciamento manual de memória do WebGPU.
4. **Time to First Frame (TTFF):** - O tempo exato decorrido desde o início da requisição de rede do arquivo `.gltf/.glb` até o momento em que a geometria decodificada (pelo algoritmo Draco) tem seu primeiro pixel impresso no *canvas*.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado na máquina.
- Um navegador compatível nativamente com WebGPU (ex: Chrome v113+).

### Instalação

1. Clone o repositório:
   ```bash
   git clone [https://github.com/seu-usuario/webgpu-vs-webgl-bench.git](https://github.com/seu-usuario/webgpu-vs-webgl-bench.git)
