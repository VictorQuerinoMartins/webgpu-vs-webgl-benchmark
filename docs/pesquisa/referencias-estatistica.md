# Referências para a metodologia estatística (N=9/combo, mesma máquina, ensaios sequenciais)

Levantadas em 2026-10-19. Legenda de verificação:
- **[V]** = autor, ano, veículo, volume/páginas e DOI confirmados em busca web e/ou Crossref.
- **[V-parcial]** = existência e dados bibliográficos confirmados, mas algum campo (DOI) ou o conteúdo específico não foi checado no texto completo.
- Frases "Uso sugerido" são redação minha; afirmações sobre o conteúdo vêm dos resumos/páginas consultados, salvo marcação "(raciocínio meu)".

---

## 1. Teste t de Welch como padrão

**DELACRE, M.; LAKENS, D.; LEYS, C.** Why psychologists should by default use Welch's t-test instead of Student's t-test. *International Review of Social Psychology*, v. 30, n. 1, p. 92-101, 2017. DOI: 10.5334/irsp.82. **[V]** (acesso aberto, CC BY 4.0). Nota: existe um erratum de 2022 (DOI 10.5334/irsp.661) cujo conteúdo não li; conferir antes de citar números específicos do artigo.
- Conteúdo (segundo resumos consultados): Welch controla melhor o erro tipo I quando as variâncias diferem e perde pouca potência quando são iguais; testar igualdade de variâncias antes e escolher o teste não resolve o problema.
- Uso sugerido: "Adotou-se o teste t de Welch como padrão, por não pressupor homogeneidade de variâncias e perder pouca potência quando ela vale (DELACRE; LAKENS; LEYS, 2017), dispensando teste prévio de igualdade de variâncias."

**RUXTON, G. D.** The unequal variance t-test is an underused alternative to Student's t-test and the Mann-Whitney U test. *Behavioral Ecology*, v. 17, n. 4, p. 688-690, 2006. DOI: 10.1093/beheco/ark016. **[V]** (resumo/metadados; texto completo não lido).
- Conteúdo: o t de Student tem desempenho ruim (erro tipo I e II) com variâncias desiguais; recomenda o teste de variâncias desiguais como padrão, inclusive em vez de Mann-Whitney.
- Uso sugerido: "A recomendação de usar o teste de variâncias desiguais como padrão, mesmo com amostras pequenas, é anterior e convergente (RUXTON, 2006)."

**WELCH, B. L.** The generalization of "Student's" problem when several different population variances are involved. *Biometrika*, v. 34, n. 1-2, p. 28-35, 1947. DOI: 10.1093/biomet/34.1-2.28 (JSTOR 2332510). **[V-parcial]** (bibliografia e DOI conferidos em resultados de busca; DOI não checado no Crossref).
- Uso sugerido: "O teste t de Welch (WELCH, 1947) aproxima a distribuição da estatística por uma t com graus de liberdade ajustados (Welch-Satterthwaite)."

**Sobre N pequeno (N=9 por grupo):** nenhuma das fontes acima, nos resumos que li, fixa um N mínimo. Delacre et al. e Ruxton defendem Welch inclusive com amostras pequenas, mas a robustez a não normalidade com N=9 não está estabelecida por essas fontes: tratar como limitação e apoiar com o item 4 (Mann-Whitney) e com checagem visual/Shapiro-Wilk dos dados (raciocínio meu, sem fonte verificada aqui).

---

## 2. Tamanho de efeito (Cohen's d) junto do p-valor

**COHEN, J.** *Statistical power analysis for the behavioral sciences*. 2. ed. Hillsdale: Lawrence Erlbaum Associates, 1988. (Reimpressão Routledge, DOI 10.4324/9780203771587.) **[V-parcial]** (existência e edição confirmadas; o DOI aparece em lista de referências de terceiros, não na página da editora). Livro, sem acesso ao texto; as faixas convencionais d≈0,2 / 0,5 / 0,8 (pequeno/médio/grande) são do meu conhecimento, não verificadas nesta sessão. Cohen as apresenta como convenções de último recurso, não limiares universais.
- Uso sugerido: "O tamanho de efeito foi expresso pelo d de Cohen (COHEN, 1988); as faixas convencionais são referência de último recurso e, em benchmarks, a relevância prática deve ser julgada na unidade original (ms, W, J/frame)."

**LAKENS, D.** Calculating and reporting effect sizes to facilitate cumulative science: a practical primer for t-tests and ANOVAs. *Frontiers in Psychology*, v. 4, art. 863, 2013. DOI: 10.3389/fpsyg.2013.00863. PMC3840331. **[V]**
- Conteúdo: como calcular e reportar d (e eta²) para uso em análise de potência e meta-análise.
- Uso sugerido: "Reporta-se d junto do p-valor para permitir comparação entre estudos e planejamento de potência (LAKENS, 2013)." Atenção (raciocínio meu): com variâncias desiguais, d com desvio-padrão combinado (Cohen) difere do d de Glass/ d_s com desvio de Welch; declarar qual fórmula o script usa.

**SULLIVAN, G. M.; FEINN, R.** Using effect size - or why the P value is not enough. *Journal of Graduate Medical Education*, v. 4, n. 3, p. 279-282, 2012. DOI: 10.4300/JGME-D-12-00156.1. **[V]**
- Conteúdo: significância estatística indica se o resultado provavelmente não é acaso; tamanho de efeito indica a magnitude; ambos devem ser reportados.
- Caso "efeito pequeno porém significativo" (raciocínio meu, coerente com a tese do artigo): com amostras grandes um efeito trivial atinge p<0,05; aqui o risco inverso também existe, pois com N=9 efeitos moderados podem não atingir significância. Reportar d + IC evita ambos os erros de leitura.
- Uso sugerido: "Como o p-valor não informa a magnitude da diferença (SULLIVAN; FEINN, 2012), cada comparação reporta também d e a diferença na unidade original, de modo que uma diferença significativa porém pequena seja identificável como tal."

---

## 3. IC95% da diferença de médias

**GARDNER, M. J.; ALTMAN, D. G.** Confidence intervals rather than P values: estimation rather than hypothesis testing. *British Medical Journal (Clin Res Ed)*, v. 292, n. 6522, p. 746-750, 1986. DOI: 10.1136/bmj.292.6522.746. PMC1339793. **[V]**
- Conteúdo: defende estimação com IC em vez de só p-valores; inclui IC para diferença entre médias.
- Uso sugerido: "Reporta-se o IC95% da diferença de médias, que informa magnitude e precisão da estimativa além da significância (GARDNER; ALTMAN, 1986)."

---

## 4. Mann-Whitney U como robustez não paramétrica

**MANN, H. B.; WHITNEY, D. R.** On a test of whether one of two random variables is stochastically larger than the other. *Annals of Mathematical Statistics*, v. 18, n. 1, p. 50-60, 1947. DOI: 10.1214/aoms/1177730491. **[V]**
- Observação (do resumo): teste baseado em postos, consistente contra alternativas em que uma distribuição fica acima da outra em todos os pontos.
- Uso sugerido: "Como verificação de robustez à não normalidade, aplicou-se o teste U de Mann-Whitney (MANN; WHITNEY, 1947); concordância com o t de Welch reforça a conclusão." Cautela (raciocínio meu): Mann-Whitney testa dominância estocástica, não igualdade de médias, e com variâncias muito diferentes não é equivalente ao Welch; Ruxton (2006) argumenta justamente que Welch deve ser preferido, então Mann-Whitney entra como checagem, não como teste primário. Com N=9 vs 9 o p mínimo exato bilateral é 2/C(18,9)=2/48620 (conta minha), então não há limitação de resolução relevante.

---

## 5. Rigor estatístico e replicação em benchmarks; pseudo-replicação

**GEORGES, A.; BUYTAERT, D.; EECKHOUT, L.** Statistically rigorous Java performance evaluation. In: ACM SIGPLAN CONFERENCE ON OBJECT-ORIENTED PROGRAMMING SYSTEMS, LANGUAGES AND APPLICATIONS (OOPSLA), 22., 2007, Montreal. *Proceedings...* New York: ACM, 2007. p. 57-76. DOI: 10.1145/1297027.1297033. **[V]** (DOI confirmado via Crossref; texto completo disponível em dri.es/files/oopsla07-georges.pdf, não lido integralmente).
- Conteúdo: metodologias comuns de medição de desempenho Java podem enganar por falta de rigor estatístico; a variabilidade vem de JIT, GC, escalonamento; propõe análise estatística (intervalos de confiança) para comparar configurações. (Detalhe de que o método usa IC e testes t: do meu conhecimento do artigo, não reverificado.)
- Uso sugerido: "A necessidade de múltiplas execuções e de intervalos de confiança, em vez de uma única medição, para comparar configurações de desempenho é discutida por Georges, Buytaert e Eeckhout (2007)." Ressalva: o artigo trata de Java/JIT; aplicar por analogia a WebGL/WebGPU (raciocínio meu).

**KALIBERA, T.; JONES, R. E.** Rigorous benchmarking in reasonable time. In: ACM SIGPLAN INTERNATIONAL SYMPOSIUM ON MEMORY MANAGEMENT (ISMM), 2013, Seattle. *Proceedings...* New York: ACM, 2013. p. 63-74. DOI: 10.1145/2464157.2464160. **[V]** (resumo e DOI via repositório da Univ. de Kent, kar.kent.ac.uk/33611; texto não lido).
- Conteúdo: modelo matemático do custo de experimentação que identifica quantas repetições são necessárias em cada nível (ex.: execuções, iterações) para atingir dada precisão.
- Uso sugerido: "Repetições devem ser planejadas por nível de variação (execução, iteração), e N=9 execuções independentes é uma escolha de custo-precisão discutível à luz de Kalibera e Jones (2013)."

**HURLBERT, S. H.** Pseudoreplication and the design of ecological field experiments. *Ecological Monographs*, v. 54, n. 2, p. 187-211, 1984. DOI: 10.2307/1942661. **[V]**
- Conteúdo: pseudo-replicação = inferência estatística com tratamentos não replicados ou réplicas não independentes; recomenda intercalar tratamentos (interspersion) para proteger contra eventos casuais e gradientes pré-existentes.
- Aplicação a este TCC (raciocínio meu, não fato de fonte): execuções sequenciais na mesma máquina podem compartilhar estado térmico/boost do dGPU, cache de disco/shaders e deriva do SO, então as 9 execuções por combinação não são plenamente independentes (pseudo-replicação no sentido de réplicas não independentes). **Mitigação já implementada (verificada em `scripts/automatizar_coleta.mjs`, linhas 305-313 e 427-454):** a ordem é randomizada em blocos, ou seja, cada rodada contém todas as combinações modo×cenário embaralhadas por Fisher-Yates (`Math.random`), default `randomizar: true` (desligável com `--sem-randomizar`), e a ordem sorteada é gravada em `resultados/power_logs/ordem_execucao_<timestamp>.json`. Isso corresponde ao "interspersion" recomendado por Hurlbert (1984) e converte a deriva térmica em ruído, não em viés sistemático contra as combinações do fim do lote. Complementos: sentinela térmica opcional (`--sentinela-termica`) e intervalo de resfriamento entre blocos. Limitação residual: a randomização é por rodada (um bloco completo randomizado), não um sorteio global; e `Math.random` não é semeado, então a ordem só é reproduzível pelo arquivo gravado. Dependência entre réplicas via estado da máquina (drivers, SO, temperatura ambiente entre lotes) permanece, e inferência vale para esta máquina.
- Uso sugerido (Limitações): "A ordem dos ensaios foi randomizada em blocos, de modo que cada rodada contém todas as combinações em ordem aleatória, para que a deriva térmica não se confunda sistematicamente com a API ou o cenário (HURLBERT, 1984). Ainda assim, as execuções ocorreram em uma única máquina e não são plenamente independentes; os p-valores valem para este hardware e não se estendem a outras máquinas ou drivers."

---

## 6. Complemento: metodologia de benchmark em computação gráfica / GPU (busca de 2026-10-19)

Resultado geral: **não encontrei nenhum paper de SIGGRAPH/HPG/I3D/Web3D que estabeleça metodologia estatística de benchmark de renderização (warm-up, percentis, randomização de ordem) nem um estudo WebGL vs WebGPU peer-reviewed com tratamento estatístico formal (IC, testes).** O que há de sólido é metodologia geral de benchmark (computação/sistemas) e material de praticantes. Abaixo, cada ponto com o que existe e o grau de confiança.

### (a) Metodologia de benchmark, repetições, relato estatístico

**HOEFLER, T.; BELLI, R.** Scientific benchmarking of parallel computing systems: twelve ways to tell the masses when reporting performance results. In: INTERNATIONAL CONFERENCE FOR HIGH PERFORMANCE COMPUTING, NETWORKING, STORAGE AND ANALYSIS (SC), 2015, Austin. *Proceedings...* New York: ACM, 2015. p. 1-12. DOI: 10.1145/2807591.2807644. **[V]** (metadados via Crossref; texto não lido nesta sessão).
- Do meu conhecimento prévio, não reverificado: propõe regras para relatar desempenho (variabilidade, intervalos de confiança, não usar só média, cuidado com não normalidade). Conferir no texto antes de citar regra específica.
- Uso sugerido: "Seguindo recomendações de relato científico de desempenho (HOEFLER; BELLI, 2015), reportam-se medidas de dispersão e intervalos de confiança, não apenas médias."

**NVIDIA (autor não identificado). Analysing stutter - mining more percentiles.** NVIDIA Developer, c. 2012 (data inferida, a página não a informa). URL: https://developer.nvidia.com/content/analysing-stutter-%E2%80%93-mining-more-percentiles-0. **[V-parcial: página lida; autoria e data não confirmadas; blog de fabricante, peso epistêmico baixo]**
- Conteúdo lido: percentis de frame time quantificam stutter objetivamente; atribui a abordagem ao artigo "Inside the Second" (The Tech Report, 2011); percentis extremos são ruidosos com poucos dados; subtrair a média funciona melhor que dividir.
- Uso sugerido: "Frame time e seus percentis, e não o FPS médio, são adotados como medida de estabilidade (NVIDIA, [s.d.]), pois hitches raros ficam ocultos na média." Com N≈8.600 frames por ensaio a 144 Hz × 60 s (raciocínio meu) percentis altos são estimáveis, mas P99,9 tem poucas observações.
- Não achei fonte peer-reviewed de computação gráfica sobre percentis de frame time; o "Inside the Second" (Tech Report) e o FCAT/PCPer são jornalismo técnico, não verificados aqui.

**BROWSER/WebGPU best practices (Brandon Jones, toji.dev; autoria não explícita na página).** *WebGPU/WebGL performance comparison best practices*. Atualizado em 4 jun 2024. URL: https://toji.dev/webgpu-best-practices/webgl-performance-comparison. **[V-parcial: página lida; autoria não explícita (atribuição ao autor do site é minha suposição); material de praticante]**
- Conteúdo lido: pedir `powerPreference: 'high-performance'` nas duas APIs e registrar o dispositivo usado em ambas (`adapter.info` / `WEBGL_debug_renderer_info`); igualar antialiasing, formato de cor, depth/stencil, alpha, `preserveDrawingBuffer` e resolução do canvas; usar o mesmo conteúdo, instâncias e câmera.
- A página não trata de vsync, warm-up, frame time ou temporização (lido, ausente).
- Uso sugerido: "A paridade de contexto entre as APIs (GPU de alto desempenho, mesmos parâmetros de canvas e conteúdo) segue boas práticas de comparação WebGL/WebGPU (TOJI, 2024)." Útil para a seção de ameaças à validade; conferir se o projeto loga o adaptador nas duas APIs.

### (b) Randomização de ordem, deriva térmica, viés de medição

**MYTKOWICZ, T.; DIWAN, A.; HAUSWIRTH, M.; SWEENEY, P. F.** Producing wrong data without doing anything obviously wrong! In: ASPLOS, 14., 2009, Washington. *Proceedings...* New York: ACM, 2009. p. 265-276. DOI: 10.1145/1508244.1508275. **[V]** (metadados e resumo via página do grupo USI/sape; texto não lido).
- Conteúdo (resumo): detalhes inofensivos do setup experimental causam "measurement bias" capaz de inverter conclusões; dos 133 artigos de ASPLOS/PACT/PLDI/CGO pesquisados, nenhum tratava adequadamente o viés; propõem **randomização do setup** para evitá-lo.
- Uso sugerido: "A randomização da ordem dos ensaios em blocos mitiga o viés de medição por detalhes de setup (MYTKOWICZ et al., 2009), tornando variações térmicas e de estado ruído, e não viés sistemático." Ressalva: o artigo é de CPU/compiladores; aplicação por analogia (raciocínio meu).

**Apoio adicional já citado:** HURLBERT (1984) (interspersion), seção 5.

**Não verificado / descartado:** uma busca retornou um preprint arXiv 2605.29752 (GEMM em GPU Intel) que supostamente relataria deriva por ordem de execução e propõe sweeps randomizados. Ao abrir a página, o resumo não menciona randomização de ordem; **não confirmei, não usar**. Outros preprints de arXiv sobre aquecimento e resfriamento antes de cada medição (ex.: 2502.20075, 2604.09048) apareceram apenas em snippets de busca; **não verificados**, não recomendo citar sem leitura.
- **Não achei** fonte sólida específica de gráficos/renderização sobre contrabalanceamento de ordem para throttling. A justificativa fica em Hurlbert + Mytkowicz + Kalibera/Jones.

### (c) Comparações WebGL vs WebGPU

**USTA, Z.** WebGPU: a new graphic API for 3D WebGIS applications. *The International Archives of the Photogrammetry, Remote Sensing and Spatial Information Sciences*, v. XLVIII-4/W9-2024, p. 377-382, 2024. DOI: 10.5194/isprs-archives-XLVIII-4-W9-2024-377-2024. **[V]** (página do periódico lida).
- Conteúdo: comparação lado a lado e experimento de quanta dados cada API renderiza a ≥60 fps; conclui WebGPU "substancialmente mais rápido". O resumo/página não menciona repetições nem estatística.
- Uso sugerido: "Estudos anteriores indicam vantagem do WebGPU em cenários de dados geoespaciais (USTA, 2024), mas sem tratamento estatístico explícito, lacuna que este trabalho busca cobrir com repetições, IC e tamanho de efeito." Ressalva: a última parte é minha leitura do que a página mostra.

**FRANSSON et al.** *A Comparison of Performance on WebGPU and WebGL in the Godot Game Engine*. IEEE, 2024. Registro: https://ieeexplore.ieee.org/document/10585437/. **[NÃO VERIFICADO: a página não carregou; autoria "Fransson et al." só aparece em citação secundária (arXiv 2507.11794); venue exato, DOI e prenomes não confirmados]**
- O que o snippet de busca indica: mede frame time de CPU e GPU em Godot; WebGPU melhor na média. Não sei se há IC/testes; **não conferir como "com tratamento estatístico" até ler o artigo.** Citar apenas após verificação manual.

**Material descartado ou sem verificação:** o artigo "WebGL vs. WebGPU: A Performance Analysis for Web 3.0" (ResearchGate, 2024; texto não acessível), "Chickerur et al." (a busca não retornou o paper), um preprint OpenReview sobre frameworks WebGPU mais lentos que WebGL (a página não abriu) e threads de fóruns three.js/Babylon.js (anedóticos, úteis só como contexto, não como fonte). **Nenhum desses deve ser citado como evidência sem leitura.** Os fóruns, contudo, são consistentes com sua hipótese de que o WebGPURenderer do Three.js pode ser mais lento que WebGL em muitos draw calls (anedótico, hardware específico).

**Conclusão sobre (c):** a lacuna é real, até onde minha busca alcança: não encontrei artigo WebGL vs WebGPU peer-reviewed com IC, tamanho de efeito e randomização. Isso é afirmação sobre o que a busca retornou, não prova de inexistência.

---

## Observação final
- Não encontrei, nesta busca, fonte que fixe o mínimo de N para o t de Welch; não afirmar um número.
- Itens com DOI de livro (Cohen) ou erratum (Delacre) merecem conferência manual antes da versão final.
