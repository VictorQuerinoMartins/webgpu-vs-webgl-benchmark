# CLAUDE.md - DIRETRIZES DE IA E CONTEXTO OPERACIONAL DO TCC

> 🚨 **REGRA DE OURO DE IDIOMA:** Você deve interagir, responder, gerar documentações, códigos e comentários estritamente em **Português do Brasil (pt-BR)**.
>
> 🚨 **INSTRUÇÃO OBRIGATÓRIA PARA A IA:** Este repositório hospeda um ambiente de testes científicos controlado para um Trabalho de Conclusão de Curso (TCC) em Ciência da Computação. Antes de gerar, alterar ou refatorar qualquer trecho de código, leia este documento para garantir a consistência metodológica e evitar regressões de desempenho ou desvios de métricas.

---

## 1. CONTEXTO DO PROJETO E METODOLOGIA DO TCC
* **Autor:** Victor Querino Martins
* **Instituição:** Universidade Estadual do Paraná (UNESPAR) - Campus de Apucarana.
* **Título do Projeto:** Benchmark de Renderização na Web: Um Estudo Comparativo entre WebGL e WebGPU.
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

---

## 3. MATRIZ DE MÉTRICAS COMPARATIVAS (ESCOPO DO EXPERIMENTO)

A avaliação quantitativa entre as duas APIs é governada estritamente pelas seguintes variáveis capturadas quadro a quadro ou via monitoramento externo de hardware:

### A. Dimensão de Renderização Computacional
* **Quadros por Segundo (FPS Instantâneo):** Calculado de forma discreta frame a frame por meio da relação inversa do tempo de transição gráfico ($1/\Delta t$).
* **Tempo de Quadro (Frame Time - ms):** Tempo exato gasto para processar, atualizar matrizes e desenhar um único frame (métrica primária contra *stuttering*).
* **Chamadas de Renderização (Draw Calls):** Contagem de instruções enviadas da CPU para a GPU por frame. Variável principal para expor o gargalo de overhead do WebGL.
* **Alocação de Memória de Vídeo (VRAM - MB):** Volume de memória volátil da dGPU alocado dinamicamente para geometria, malhas e texturas.
* **Tempo para o Primeiro Quadro (Time to First Frame - TTFF):** Delta de tempo desde o início da requisição de rede do arquivo compactado via algoritmo Google Draco até a renderização do primeiro pixel na tela.

### B. Dimensão de Computação Verde (Green IT)
* **Potência Instantânea da dGPU (Power Draw - W):** Consumo energético bruto exigido pela RTX 3050 sob estresse, amostrado a 1 Hz via utilitário `nvidia-smi`.
* **Assinatura Energética por Quadro (Joules):** Custo de hardware real por frame individual, calculado por: $E_f = P_{\text{inst}} \times (\Delta t_{\text{frame}} / 1000)$.
* **Coeficiente de Eficiência Quadro-por-Watt (Frames/W):** Razão matemática que define a produtividade ecológica dividindo o FPS instantâneo pelos Watts consumidos.
* **Consumo Acumulado do Ensaio (Joules / Wh):** A integral sob a curva de potência consumida durante os 60 segundos exatos do trajeto da câmera.

---

## 4. ARQUITETURA DE ARQUIVOS E CENÁRIOS (MATRIZ DE ESTRESSE)
O modelo tridimensional utilizado é o **Amazon Lumberyard Bistro**. Para os ensaios, ele foi dividido estritamente em três arquivos `.glb` dentro da pasta `public/`:

* **Cenário A (Baseline):** `CenarioBistroA.glb` (~15 MB) - Geometria pura desprovida de materiais complexos e mapas de textura.
* **Cenário B (Média Carga):** `CenarioBistroB.glb` (~115 MB) - Materiais com mapas de textura PNG em resolução de 512x512 pixels (0.5K).
* **Cenário C (Alta Carga):** `CenarioBistroC.glb` (~328 MB) - Materiais com mapas de textura PNG em resolução fixa de 1024x1024 pixels (1K).

---

## 5. REGRAS E DIRETRIZES PARA GERAÇÃO DE CÓDIGO (GUARDRAILS)

* **🚨 Regra 1 (Chaveamento Monolítico):** Toda a aplicação reside em um único ponto de entrada (`src/main.js`). O chaveamento de motor e cenário é feito exclusivamente alterando as constantes `CONFIG_API` e `CONFIG_CENARIO` no topo do arquivo. Nunca fragmente o projeto.
* **🚨 Regra 2 (Forçamento de Hardware Dedicado):** Ambos os inicializadores de renderização devem possuir a flag `powerPreference: "high-performance"`. O WebGPU exige a inicialização assíncrona por meio de `await renderer.init()`. Sem isso, o ecossistema WebGPU é empurrado por padrão para a iGPU Intel UHD, invalidando o rigor do ensaio.
* **🚨 Regra 3 (Imutabilidade do Trilho da Câmera):** O array `THREE.CatmullRomCurve3` possui 12 pontos calibrados milimetricamente para guiar a câmera de forma suave sem colidir com paredes ou com o mancebo decorativo interno. Nunca altere essas coordenadas.
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