# AGENTS.md - Contexto e Instruções para o Claude (TCC WebGPU)

## Pré projeto abaixo

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% How to use writeLaTeX: 
%
% You edit the source code here on the left, and the preview on the right shows you the result within a few seconds.
%
% Bookmark this page and share the URL with your co-authors. They can edit at the same time!
%
% You can upload figures, bibliographies, custom classes and styles using the files menu.
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\documentclass[12pt]{article}

\usepackage{sbc-template}
\usepackage[num]{abntex2cite}

\usepackage{graphicx,url}
\usepackage[table]{xcolor}

\renewcommand{\figurename}{Figura}
\renewcommand{\tablename}{Tabela}

\usepackage[brazil]{babel}   
\usepackage[utf8]{inputenc}  

\usepackage[hidelinks]{hyperref}

\makeatletter
\renewcommand{\@seccntformat}[1]{\csname the#1\endcsname\ }
\makeatother

\makeatletter
\renewcommand{\@biblabel}[1]{#1\ }  

\makeatother\sloppy

\title{Benchmark de Renderização Arquitetônica de Larga Escala na Web: Um Estudo Comparativo entre WebGL e WebGPU}

\author{Victor Querino Martins\inst{1}, João Paulo Biazotto\inst{1}}


\address{Ciência da Computação \\ Universidade Estadual do Paraná (UNESPAR)\\ Apucarana -- Paraná}

\begin{document} 

\maketitle

\section{Introdução}

A renderização de modelos tridimensionais (3D) de larga escala em aplicações web tornou-se uma demanda crescente, impulsionada pela expansão de sistemas de visualização arquitetônica, engenharia e maquetes virtuais interativas \cite{usta2024}. No entanto, o ecossistema padrão, historicamente suportado pela API WebGL, frequentemente esbarra em limitações de arquitetura de \textit{hardware} \cite{researchgate2024}. Em cenas complexas com milhares de instâncias ou malhas de alta densidade poligonal, o WebGL sofre de um severo gargalo na CPU (\textit{Central Processing Unit}) ao processar requisições de desenho simultâneas, conhecidas como \textit{Draw Calls}. O navegador despende mais tempo validando os estados de renderização do que efetivamente instruindo a renderização dos pixels, resultando em quedas drásticas de desempenho e comprometendo a fluidez visual da aplicação.

Nesse contexto, o surgimento e a recente adoção da API WebGPU prometem uma mudança de paradigma. Ao fornecer um controle de mais baixo nível sobre a GPU (\textit{Graphics Processing Unit}) e introduzir conceitos como \textit{Pipelines} pré-compilados e \textit{Compute Shaders}, o WebGPU visa mitigar a sobrecarga na \textit{thread} principal do JavaScript.

Diante desse cenário, justifica-se a relevância de investigar o real impacto dessa transição tecnológica. Este trabalho se propõe a analisar o problema do gargalo computacional em ambientes arquitetônicos de larga escala, buscando validar empiricamente se a migração para a API WebGPU justifica os custos de refatoração de motores gráficos. A estruturação rigorosa de uma bancada de testes para coleta de métricas exatas é de suma importância para a comunidade de desenvolvedores e pesquisadores da área de Computação Gráfica na web.

A Seção~\ref{sec:fundamentacao} apresenta a base teórica. A Seção~\ref{sec:objetivos} estabelece as metas. A Seção~\ref{sec:metodologia} descreve a abordagem experimental, seguida pela Seção~\ref{sec:cronograma} com o calendário e pela Seção~\ref{sec:resultados} com as contribuições esperadas.


\section{Fundamentação Teórico-Metodológica e Estado da Arte}
\label{sec:fundamentacao}

A pesquisa fundamenta-se na arquitetura de tráfego de dados gráficos no ambiente \textit{web}. A API WebGL, por operar como uma máquina de estados baseada no OpenGL, força a CPU a validar texturas e permissões a cada objeto desenhado, o que eleva o processamento a picos de estresse e derruba a taxa de quadros (FPS) em cenas densas \cite{galante2026, ics2023}.

Em contrapartida, o WebGPU empacota e valida o estado gráfico uma única vez no início da aplicação. Durante a renderização, a CPU emite comandos de forma paralelizada e instantânea. Adicionalmente, o formato glTF aliado à compressão matemática Draco tornou-se o padrão da indústria para tráfego em rede, pois compacta a geometria do modelo, transferindo a carga de descompressão para o processador do cliente. 

O estado da arte exige avaliações práticas dessas tecnologias. A construção de experimentos não sintéticos utilizando motores gráficos consolidados, como o Three.js, é fundamental para compreender os limiares métricos de cada arquitetura, corroborando com estudos recentes que já demonstram a superioridade do WebGPU em simulações complexas \cite{sung2025}.

\subsection{Tecnologias de Renderização Web}
Para a operacionalização de ambientes 3D em navegadores, o ecossistema atual depende de APIs gráficas e bibliotecas de abstração. É essencial detalhar as três ferramentas centrais que compõem o escopo deste estudo:

\begin{itemize}
    \item \textbf{API WebGL:} É a API gráfica padrão e nativa da web há mais de uma década. Baseada no OpenGL ES, ela atua como uma máquina de estados que permite ao JavaScript se comunicar com a placa de vídeo. Como exige validação rigorosa da CPU antes de cada comando de desenho, torna-se o principal foco de gargalo em maquetes muito fragmentadas.
    
    \item \textbf{API WebGPU:} Representa a nova geração de interfaces gráficas para a web, homologada pela W3C. Diferente do WebGL, ela expõe as capacidades do \textit{hardware} moderno (como Vulkan e Metal) de forma mais próxima ao "metal" (baixo nível). Sua arquitetura de \textit{pipelines} pré-compilados permite computação paralela avançada e a transferência de cargas de trabalho complexas da CPU diretamente para a GPU via \textit{Compute Shaders}.
    
    \item \textbf{Three.js:} É uma biblioteca JavaScript \textit{open-source} de alto nível que atua como uma camada de abstração. Em vez de escrever códigos matemáticos complexos e \textit{shaders} puros diretamente nas APIs nativas, o Three.js fornece estruturas prontas (Cenas, Câmeras, Materiais). Sua relevância neste trabalho se dá por ser o motor 3D mais popular da web, que atualmente passa por um processo de transição para oferecer suporte nativo tanto ao WebGL quanto ao WebGPU.
\end{itemize}


\section{Objetivos}
\label{sec:objetivos}

O objetivo principal deste trabalho é avaliar comparativamente o desempenho computacional, gráfico e o consumo de recursos de memória entre as APIs WebGL e WebGPU na renderização de modelos arquitetônicos 3D de larga escala.

Para alcançar este objetivo geral, definem-se os seguintes objetivos específicos:
\begin{itemize}
    \item Construir uma bancada de testes utilizando JavaScript puro, isolando interferências de processamento causadas por \textit{frameworks} reativos.
    \item Desenvolver \textit{scripts} para coleta autônoma de métricas (FPS, \textit{Frame Time}, \textit{Draw Calls} e VRAM).
    \item Integrar a descompressão poligonal Draco para avaliar o tempo de inicialização (TTFF - \textit{Time to First Frame}).
\end{itemize}


\section{Procedimentos metodológicos}
\label{sec:metodologia}

A pesquisa adotará uma abordagem quantitativa e experimental, com o objetivo de comparar empiricamente o desempenho das APIs gráficas. Para alcançar os objetivos propostos, o estudo será estruturado nas seguintes etapas metodológicas:


    \subsection{Configuração do Ambiente e Ferramentas:} A fase inicial consistirá na montagem da bancada de testes utilizando a linguagem JavaScript nativa (\textit{Vanilla JS}) e o empacotador Vite, isolando o ambiente de renderização de interferências causadas pelo ciclo de vida de \textit{frameworks} reativos. A biblioteca gráfica Three.js será fixada rigorosamente em sua versão \texttt{0.183.2} para evitar que atualizações supervenientes distorçam o \textit{benchmark}.

    \subsection{Seleção e Preparação do Modelo Arquitetônico:} Para garantir rigor empírico, será utilizado um modelo arquitetônico 3D de referência comumente adotado em testes de estresse gráfico (como uma maquete urbana ou o modelo \textit{Sponza Atrium} detalhado e exportado em \texttt{.glb}). Este cenário controlará os seguintes aspectos cruciais de estresse:
    \begin{itemize}
        \item \textbf{Densidade Poligonal:} O modelo deverá conter milhões de triângulos para testar a capacidade de processamento geométrico.
        \item \textbf{Volume de Instâncias:} Possuirá milhares de malhas e materiais individuais (como portas, janelas e mobílias separadas) para forçar um alto número de requisições à CPU.
        \item \textbf{Texturização (Resolução):} Uso de materiais PBR (\textit{Physically Based Rendering}) com texturas em alta resolução, exercitando a largura de banda e o consumo limite de memória gráfica.
    \end{itemize}

    \subsection{Automação de Câmera e Isolamento de Variáveis:} Para assegurar uma comparação justa, a intervenção humana (mouse/teclado) será desabilitada. A navegação pela maquete será automatizada através de uma trajetória predefinida (\textit{spline}) orientada pelo tempo. Isso garante que o motor gráfico realize o descarte de objetos invisíveis (\textit{Frustum Culling}) e renderize a exata mesma carga visual em todos os ciclos de testes, independentemente da API utilizada.

    \subsection{Coleta de Métricas de Desempenho:} Scripts de instrumentação serão acoplados ao laço de renderização para extrair dados a cada quadro. Serão analisadas as seguintes métricas fundamentais:
    \begin{itemize}
        \item \textbf{Quadros por Segundo (FPS):} Indicador macro da fluidez visual geral da aplicação.
        \item \textbf{Frame Time (ms):} O tempo exato, em milissegundos, gasto para calcular e desenhar um único quadro. Utilizado para identificar engasgos (\textit{stutters}) que a média de FPS pode mascarar.
        \item \textbf{Draw Calls:} Contagem de quantas vezes a CPU precisou instruir a GPU a desenhar uma geometria em um mesmo quadro. É a métrica principal para isolar o gargalo do WebGL.
        \item \textbf{Consumo de VRAM:} Quantidade de memória de vídeo alocada dinamicamente para armazenar as texturas e os vértices do modelo.
        \item \textbf{Time to First Frame (TTFF):} O tempo decorrido desde o início da requisição de rede do arquivo compactado (algoritmo Draco) até a renderização do primeiro pixel na tela, mensurando o custo de decodificação no cliente.
    \end{itemize}

\subsection{Análise Comparativa e Validação:} Os dados brutos coletados por meio da interface \texttt{performance.now()} e dos inspetores de estado do Three.js serão exportados e tabulados. A análise cruzará os dados das duas rotas de renderização (WebGL vs WebGPU), permitindo identificar de forma quantitativa os limiares métricos onde a sobrecarga estrutural ocorre em cada tecnologia.



\section{Cronograma de Execução}
\label{sec:cronograma}
As atividades planejadas ocorrerão entre abril e novembro do presente ano letivo.

\noindent Atividades:
\begin{enumerate}
 \item Aprofundamento teórico e revisão bibliográfica;
 \item Configuração do ambiente Vite e definição do modelo 3D de controle;
 \item Implementação da rota WebGL e compressão Draco;
 \item Implementação do WebGPU e automação de câmera;
 \item Execução dos testes automatizados e coleta de dados;
 \item Análise dos resultados comparativos e redação final.
\end{enumerate}

\begin{table}[ht]
\centering
\caption{Cronograma de Execução}
\label{tab:cronograma}
\begin{tabular}{|c|c|c|c|c|c|c|c|c|}  \hline
   & abr & mai & jun & jul & ago & set & out & nov  \\ \hline
Ativ. 1 &\cellcolor{blue!25}&\cellcolor{blue!25}& & & & & &   \\ \hline
Ativ. 2 & &\cellcolor{blue!25}&\cellcolor{blue!25}& & & & &   \\ \hline
Ativ. 3 & & &\cellcolor{blue!25}&\cellcolor{blue!25}& & & &   \\ \hline
Ativ. 4 & & & & &\cellcolor{blue!25}&\cellcolor{blue!25}& &  \\ \hline
Ativ. 5 & & & & & & &\cellcolor{blue!25}&  \\ \hline
Ativ. 6 & & & & &\cellcolor{blue!25}&\cellcolor{blue!25}&\cellcolor{blue!25}&\cellcolor{blue!25} \\ \hline
\end{tabular}
\end{table}

\vspace{1cm}

\section{Contribuições e/ou Resultados esperados}
\label{sec:resultados}
Espera-se que este estudo forneça uma prova empírica documentada e reproduzível sobre as supostas vantagens arquiteturais do WebGPU sobre o WebGL. Como contribuição técnica para a comunidade de engenharia de \textit{software} e profissionais de computação gráfica na web, os resultados identificarão exatamente os limiares métricos onde o gargalo da máquina de estados do WebGL inviabiliza projetos de larga escala.

O repositório de testes validará, na prática, a capacidade da nova API de manter a fluidez de \textit{Frame Time} mesmo sob condições extremas de requisições de desenho (\textit{Draw Calls}), entregando documentação técnica e um roteiro claro que auxilie no processo decisório para a migração e modernização de plataformas de visualização 3D.

\vspace{5cm}

\section {Espaço para assinaturas}


\vspace{1cm}
\hfill Apucarana, \textit{09 de abril de 2026}.


\vspace{1cm}
\noindent
------------------------------------------ \hfill ------------------------------------------

\hspace{0.5cm} Victor Querino Martins \hfill  João Paulo Biazotto \hspace{0.5cm}

\clearpage
\bibliographystyle{abntex2-num}
\bibliography{minha-bibliografia}

\end{document}

## minha bibliografia

@article{usta2024,
  author = {Usta, Z.},
  title = {WEBGPU: A NEW GRAPHIC API FOR 3D WEBGIS APPLICATIONS},
  journal = {The International Archives of the Photogrammetry, Remote Sensing and Spatial Information Sciences},
  volume = {XLVIII-4/W9-2024},
  pages = {377--382},
  year = {2024},
  doi = {10.5194/isprs-archives-XLVIII-4-W9-2024-377-2024}
}

@article{sung2025,
  author = {Sung, Nak-Jun and Ma, Jun and Kim, TaeHeon and Choi, Yoo-joo and Choi, Min-Hyung and Hong, Min},
  title = {Real-Time Cloth Simulation Using WebGPU: Evaluating Limits of High-Resolution},
  journal = {arXiv preprint arXiv:2507.11794},
  year = {2025},
  url = {https://doi.org/10.48550/arXiv.2507.11794}
}

@misc{galante2026,
  author = {Galante, Gonzalo},
  title = {WebGL vs WebGPU: The Performance Gap},
  year = {2026},
  url = {https://gjgalante.medium.com/webgl-vs-webgpu-the-performance-gap-fbd121fb221a},
  note = {Acessado em: 06 abr. 2026}
}

@misc{ics2023,
  author = {{ICS Media}},
  title = {WebGPU: New graphics and compute possibilities beyond WebGL},
  year = {2026},
  url = {https://ics.media/en/entry/230426/},
  note = {Acessado em: 06 abr. 2026}
}

@article{researchgate2024,
  author = {Sarker, Md},
  title = {WebGL vs WebGPU: A Performance Analysis for Web 3.0},
  journal = {ResearchGate},
  year = {2024},
  url = {https://www.researchgate.net/publication/379686570_WebGL_vs_WebGPU_A_Performance_Analysis_for_Web_30},
  note = {Acessado em: 06 abr. 2026}
}

@misc{amazon2017,
  title = {Amazon Lumberyard Bistro, Open Research Content Archive (ORCA)},
  author = {{Amazon Lumberyard}},
  year = {2017},
  month = {July},
  url = {http://developer.nvidia.com/orca/amazon-lumberyard-bistro},
  note = {Acessado em: 06 abr. 2026}
}

@article{feitosa2017,
  author = {Feitosa, Daniel and Alders, Rutger and Ampatzoglou, Apostolos and Avgeriou, Paris and Nakagawa, Elisa Yumi},
  title = {Investigating the effect of design patterns on energy consumption},
  journal = {Journal of Software: Evolution and Process},
  volume = {29},
  number = {2},
  pages = {e1851},
  year = {2017},
  doi = {10.1002/smr.1851}
}

@misc{w3cwebgpu2026,
  author = {{W3C WebGPU Working Group}},
  title = {WebGPU Specification},
  year = {2026},
  howpublished = {\url{https://www.w3.org/TR/webgpu/}},
  note = {Acessado em: 15 maio 2026}
}

@misc{khronoswebgl2017,
  author = {{Khronos WebGL Working Group}},
  title = {WebGL 2.0 Specification},
  year = {2017},
  howpublished = {\url{https://registry.khronos.org/webgl/specs/latest/2.0/}},
  note = {Acessado em: 15 maio 2026}
}

@misc{threejs2026,
  author = {Ricardo Cabello and {Three.js Authors}},
  title = {Three.js: JavaScript 3D Library},
  year = {2026},
  howpublished = {\url{https://threejs.org/}},
  note = {Acessado em: 15 maio 2026}
}

@book{moeller2018,
  author = {Tomas Akenine-M\"{o}ller and Eric Haines and Naty Hoffman},
  title = {Real-Time Rendering},
  edition = {4th},
  publisher = {A K Peters/CRC Press},
  year = {2018},
  address = {Boca Raton}
}

@article{bimsarker2023,
  author = {Sarker, Md. Rashedul Islam and J{\'{e}}r{\^{o}}me, Franck and Malik, Abdul},
  title = {Performance Optimization Challenges in Rendering Large-Scale BIM and Architectural Models on Web Graphics APIs},
  journal = {Journal of Real-Time Image Processing},
  volume = {20},
  number = {3},
  pages = {45--56},
  year = {2023},
  doi = {10.1007/s11554-023-01302-9}
}


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
- O código gerado deve ser sempre compatível com a versão fixa `0.183.2` do Three.js (conforme `package.json`). 
- Se alguma API do Three.js mudou em versões recentes (ex: TSL - Three Shading Language ou instanciamento do WebGPURenderer), forneça a sintaxe exata compatível com a versão `0.183.2`.

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