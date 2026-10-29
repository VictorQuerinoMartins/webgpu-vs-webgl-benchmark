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

## 7. Métodos de `scripts/analise_estatistica.mjs` (verificação de 2026-10-29)

Legenda: **[V]** = metadados confirmados em Crossref (aberto); **[V-sec]** = confirmado só em fonte secundária (documentação de software, listas de referência, resumos); **[NV]** = não consegui verificar nesta sessão (Crossref devolveu 429 em parte das consultas; PDFs de Wiley/ACM bloqueados ou ilegíveis). Afirmações de conteúdo sem fonte aberta estão marcadas "(memória)" ou "(raciocínio meu)".

### 7.1 Brunner-Munzel e versão por permutação

**BRUNNER, E.; MUNZEL, U.** The nonparametric Behrens-Fisher problem: asymptotic theory and a small-sample approximation. *Biometrical Journal*, v. 42, n. 1, p. 17-25, 2000. DOI: 10.1002/(SICI)1521-4036(200001)42:1<17::AID-BIMJ17>3.0.CO;2-U. **[V]** (Crossref). Texto do artigo não aberto.
- Confirmado em documentação do statsmodels (`rank_compare_2indep`, https://www.statsmodels.org/stable/generated/statsmodels.stats.nonparametric.rank_compare_2indep.html) **[V-sec]**: o estimando é p = P(X>Y) + 0,5·P(X=Y), nulo p=0,5 (igualdade estocástica, sem exigir variâncias iguais); empates recebem meio peso via postos médios, "válido para variáveis discretas"; p-valor e IC usam t com graus de liberdade tipo Welch-Satterthwaite; Brunner e Munzel recomendam a aproximação t para tamanhos ≤50 e, abaixo de 10, o teste permutado (Neubert e Brunner).
- A fórmula exata da estatística e do df **não aparece na página consultada**. A implementação do script (linhas 163-189: W = n1·n2·(R̄2−R̄1)/N / √(n1·S1² + n2·S2²), S_i² = Σ(R_ik − R_ik^(i) − R̄_i + (n_i+1)/2)²/(n_i−1)) coincide com a forma que conheço do artigo (memória), mas **não a conferi contra o texto**; conferir antes de escrever a fórmula na monografia. O df de Satterthwaite não é usado pelo script (que usa permutação exata), então não precisa ser citado.
- Uso sugerido: "A comparação principal usa o teste de Brunner-Munzel, que testa igualdade estocástica P(X<Y)+½P(X=Y)=½ sem supor variâncias iguais e com tratamento de empates por postos médios (BRUNNER; MUNZEL, 2000)."

**NEUBERT, K.; BRUNNER, E.** A studentized permutation test for the non-parametric Behrens-Fisher problem. *Computational Statistics & Data Analysis*, v. 51, n. 10, p. 5192-5204, 2007. DOI: 10.1016/j.csda.2006.05.024. **[V]** (Crossref). Texto não aberto.
- Do que consegui confirmar (statsmodels) o artigo é citado como a alternativa permutada para amostras pequenas. Propriedades de tamanho do teste (exatidão sob F1=F2, validade assintótica sob a hipótese mais fraca p=½): memória, não verificado aqui.
- Uso sugerido: "Como n=9 por grupo é pequeno, o p-valor vem da distribuição de permutação exata da estatística studentizada (NEUBERT; BRUNNER, 2007), e não da aproximação t."

### 7.2 Efeito relativo, A12, Cliff

**VARGHA, A.; DELANEY, H. D.** A critique and improvement of the CL common language effect size statistics of McGraw and Wong. *Journal of Educational and Behavioral Statistics*, v. 25, n. 2, p. 101-132, 2000. DOI: 10.3102/10769986025002101. **[V]** (Crossref).
- Limiares 0,56/0,64/0,71 (|A−0,5| = 0,06/0,14/0,21): **atribuição à fonte original não verificada** (um resultado de busca diz que o pacote R `effsize` usa esses cortes; a página do manual que abri não os mostra). Verificação por conta própria (raciocínio meu, aritmética): sob duas normais com variâncias iguais, A = Φ(d/√2) dá 0,556 / 0,638 / 0,714 para d = 0,2 / 0,5 / 0,8, ou seja, os cortes são os equivalentes dos limiares de Cohen **somente sob normalidade e variâncias iguais**; aplicados a dados não normais são convenção, não propriedade.
- Uso sugerido: "O efeito relativo A (VARGHA; DELANEY, 2000) é a probabilidade de uma medida da API B superar a de A, com empates contados pela metade; os rótulos pequeno/médio/grande seguem |A−0,5| = 0,06/0,14/0,21, equivalentes aos de Cohen apenas sob normalidade."

**CLIFF, N.** Dominance statistics: ordinal analyses to answer ordinal questions. *Psychological Bulletin*, v. 114, n. 3, p. 494-509, 1993. DOI: 10.1037/0033-2909.114.3.494 (DOI de memória; Crossref devolveu 429). **[V-sec]** (volume e páginas conferidos em listas de referência de terceiros; o artigo não foi aberto).
- δ = P(X>Y) − P(X<Y). Relação δ = 2A − 1: segue por álgebra (A = P(Y>X)+½P(=) ⇒ A = (1+δ)/2 com δ orientado de Y sobre X) e coincide com o que documentações de terceiros dizem (δ de Cliff = correlação bisserial de postos). Cuidado com o sinal/orientação.
- Cortes usuais de |δ| (0,147/0,33/0,474) são de Romano et al. (2006), relatório de congresso, não de Cliff **[V-sec]** (manual do pacote `effsize`). Em termos de A, 0,147/0,33/0,474 equivalem a |A−0,5| = 0,0735/0,165/0,237, **diferentes** dos cortes de Vargha-Delaney: as duas escalas de rótulos não coincidem; usar uma só e dizer qual.
- Uso sugerido: "O δ de Cliff (CLIFF, 1993) é equivalente a 2A−1 e é reportado junto de A por facilitar a leitura em escala de −1 a 1."

**ARCURI, A.; BRIAND, L.** A Hitchhiker's guide to statistical tests for assessing randomized algorithms in software engineering. *Software Testing, Verification and Reliability*, v. 24, n. 3, p. 219-250, 2014. DOI: 10.1002/stvr.1486. **[V]** (Crossref). Texto completo **não aberto** (Wiley 403; PDF da versão ICSE 2011 ilegível).
- Sobre sua pergunta "eles de fato recomendam A12?": **[V-sec] apenas indiretamente.** Fontes secundárias descrevem o guia como recomendando teste não paramétrico (Mann-Whitney) com A12 como tamanho de efeito, e as palavras-chave do artigo incluem correção de Bonferroni; o artigo trata de algoritmos randomizados (comparar execuções repetidas de dois algoritmos), análogo, mas não idêntico, a benchmarks de renderização. Não consegui citar frase do texto. Notar também: o guia recomenda **Mann-Whitney**, não Brunner-Munzel (memória/secundário).
- Uso sugerido: "Seguindo a prática em engenharia de software empírica para comparar técnicas com execuções repetidas, reporta-se o tamanho de efeito Â12 junto do teste não paramétrico (ARCURI; BRIAND, 2014)." Conferir no texto antes de usar.

**KITCHENHAM, B. et al.** Robust statistical methods for empirical software engineering. *Empirical Software Engineering*, v. 22, n. 2, p. 579-630, 2017. DOI: 10.1007/s10664-016-9437-5. **[V]** (Crossref). Texto não aberto (versão em acesso aberto: https://keele-repository.worktribe.com/output/408771).
- Pelo resumo (secundário): recomendam o δ de Cliff para dados ordinais ou quando as distribuições diferem entre grupos, e um método robusto baseado em postos tipo ANOVA. **Não encontrei confirmação de que recomendem A12 nem Brunner-Munzel** nesse artigo; não atribuir isso a eles sem ler o texto.
- Uso sugerido: "Métodos robustos baseados em postos e o δ de Cliff são recomendados quando as distribuições diferem entre grupos (KITCHENHAM et al., 2017)."

### 7.3 Correção de Holm

**HOLM, S.** A simple sequentially rejective multiple test procedure. *Scandinavian Journal of Statistics*, v. 6, n. 2, p. 65-70, 1979. JSTOR 4615733 (sem DOI). **[V-sec]** (bibliografia confirmada por várias fontes; artigo não aberto).
- Confirmado em fontes secundárias: controla a taxa de erro por família (FWER) em sentido forte, **sem exigir independência** entre os testes; nunca é menos poderoso que Bonferroni e, segundo Holm (citado em página de terceiros), estritamente mais poderoso exceto em casos triviais. Evite "uniformemente mais poderoso" sem esse qualificador.
- Procedimento: ordenar p crescente; comparar p(i) com α/(m−i+1); parar na primeira falha. O script (linhas 204-209) implementa p ajustado = máximo acumulado de min(1,(m−k)·p), que é a forma padrão (verificada por autoteste do próprio script).
- Uso sugerido: "Os p-valores foram ajustados pelo método de Holm (HOLM, 1979), que controla a taxa de erro por família sem supor independência e é pelo menos tão poderoso quanto Bonferroni."

### 7.4 Bootstrap

**EFRON, B.; TIBSHIRANI, R. J.** *An introduction to the bootstrap*. New York: Chapman & Hall, 1993. **[NV]** (livro; não consultado).
**HESTERBERG, T. C.** What teachers should know about the bootstrap: resampling in the undergraduate statistics curriculum. *The American Statistician*, v. 69, n. 4, p. 371-386, 2015. DOI: 10.1080/00031305.2015.1089789 (DOI de memória, Crossref 429). **[V-sec]** (arXiv 1411.5279; PMC4784504).
- Confirmado no resumo: a combinação bootstrap não paramétrico + intervalo percentil é menos precisa que o t em amostras pequenas; "o intervalo percentil comum subcobre muito em amostras pequenas; há alternativas melhores". O resumo que li **não nomeia** as alternativas.
**CARPENTER, J.; BITHELL, J.** Bootstrap confidence intervals: when, which, what? A practical guide for medical statisticians. *Statistics in Medicine*, v. 19, n. 9, p. 1141-1164, 2000. DOI: 10.1002/(SICI)1097-0258(20000515)19:9<1141::AID-SIM479>3.0.CO;2-F. **[V-sec]** (metadados por busca; conteúdo sobre amostras pequenas não conferido).
- **Qual é mais apropriada para n=9 por grupo (raciocínio meu, sem fonte aberta):** nenhuma é confiável em n=9. BCa depende de correção de viés e aceleração estimadas por jackknife, instáveis com 9 observações, muitos empates ou saturação; o bootstrap-t (estudentizado, com erro-padrão de Welch) tem melhor precisão teórica de segunda ordem, mas sofre com amostras pequenas e outliers. Entre as duas, eu escolheria o **bootstrap-t** como IC secundário e reportaria que o percentil é subestimado; alternativa mais simples e defensável: manter o **IC de Welch** (item 3), que já corrige por df. O percentil atual (script, linha 195) deve ser tratado como descritivo. Conferir em Carpenter e Bithell (2000) e Hesterberg (2015) antes de afirmar na monografia.
- Uso sugerido: "O IC bootstrap percentil tende a ser estreito demais em amostras pequenas (HESTERBERG, 2015) e é apresentado apenas como descritivo; o IC de Welch é o intervalo de referência."

### 7.5 Blocos casualizados e teste de inversão de sinais

**FISHER, R. A.** *The design of experiments*. Edinburgh: Oliver & Boyd, 1935. **[NV]**.
**MONTGOMERY, D. C.** *Design and analysis of experiments*. Hoboken: Wiley (várias edições). **[NV]** (edição não verificada).
**GOOD, P.** *Permutation, parametric and bootstrap tests of hypotheses*. 3. ed. New York: Springer, 2005. **[NV]** (título/edição de memória).
- Minha busca não achou fontes abertas para o teste de inversão de sinais em blocos; só confirmei conceitualmente (resultados de busca) que testes de permutação para blocos completos são livres de distribuição quando os tratamentos são aleatorizados dentro do bloco e que ignorar o bloqueio é conservador se há correlação intrabloco positiva (resumo de artigo de 1988 em *Controlled Clinical Trials*, não identificado). **Verificar nos livros** antes de citar páginas.
- Uso sugerido: "Como cada rodada executa todas as combinações em ordem aleatória, a diferença WebGPU−WebGL dentro da rodada elimina variação comum à rodada, e a significância é obtida por inversão de sinais das diferenças pareadas (FISHER, 1935; GOOD, 2005)."

---

## 8. Avaliação crítica do conjunto (raciocínio meu; não é fato de fonte)

Veredito curto: o conjunto é razoável e melhor que Welch isolado para n=9, mas há suposições que a monografia precisa explicitar.

1. **Estimandos diferentes na mesma tabela.** Welch/IC/bootstrap falam de diferença de médias; BM/A12/Cliff falam de dominância estocástica; o pareado fala de média das diferenças. Podem divergir (outlier, assimetria). Declare antes um estimando principal e trate os demais como sensibilidade.
2. **A12 satura.** Em separação completa A=1 (e p_BM mínimo = 2/C(18,9) = 4,1e-5 para 9 vs 9, verificado no autoteste do script), seja a diferença de 1% ou de 300%. Reporte sempre também a diferença percentual e a razão das médias; nesses casos o tamanho está no IC/razão, não em A.
3. **Não-significância não é equivalência.** Em A/B/C, onde o FPS satura no teto de 144 Hz (ver CLAUDE.md), "p alto" não prova que as APIs são iguais. Para afirmar equivalência é preciso margem definida e teste de equivalência (TOST) ou ao menos IC contido numa margem. Sem isso, diga "sem evidência de diferença".
4. **Exatidão do teste de permutação.** É exato sob F1=F2 (mesma distribuição). Sob variâncias desiguais e formas diferentes a validade vem da studentização, que Neubert e Brunner mostram funcionar bem; com n=9 e empates pesados, o tamanho real do teste é uma suposição (memória, não verificada). Considere uma simulação curta com seus próprios dados (reamostrar com variância desigual e teto) para checar a taxa de erro tipo I, já que o código é seu.
5. **Dependência e pseudo-replicação.** O BM trata os 18 valores como trocáveis; mas as réplicas vêm de 3 ensaios (lotes) com possíveis efeitos de lote (driver, temperatura ambiente, horário). A análise pareada por rodada (`ensaioN_runK`) controla isso, o que é um ponto forte. Porém, dentro da rodada a ordem é aleatória, então WebGL e WebGPU de uma mesma rodada ficam separados por vários minutos e outras cargas; o bloco só controla deriva lenta. E a justificativa de Fisher para a inversão de sinais vem de aleatorizar o *tratamento* dentro do par; aqui o que se aleatoriza é a *ordem*, então o teste é, na prática, baseado em simetria das diferenças sob H0 (suposição mais fraca do que "validade garantida pela aleatorização"). Não afirmar mais que isso.
6. **Sinal-flip sobre a média** é sensível a outliers (um frame spike numa rodada); com n≤9 pares o p mínimo é 2/512 = 0,0039. Considere reportar também a contagem de pares em que a API B vence (`pares_webgpu_maior`, já presente) como teste do sinal (exato, sem suposição de simetria) e/ou sinal-flip sobre postos (Wilcoxon).
7. **Multiplicidade.** Holm é válido sob dependência arbitrária, mas a família tem de ser declarada (todos os cenários×métricas×pares? só as métricas primárias?). Muitas métricas são redundantes (FPS vs frame time são quase recíprocas); testá-las todas aumenta m e reduz poder sem informação nova. Defina poucas métricas primárias. Holm controla FWER; para exploração em muitas métricas, controle de FDR seria menos conservador (raciocínio meu; sem citação verificada aqui).
8. **Metas de poder.** Com 9 vs 9 e correção por Holm sobre dezenas/centenas de testes, efeitos pequenos/moderados serão invisíveis. Eu não calculei a diferença mínima detectável; não tenho número confiável.
9. **Rótulos de magnitude.** Os cortes de A (0,56/0,64/0,71) vêm da equivalência normal com Cohen e os do δ (0,147/0,33/0,474) de outra fonte; não são equivalentes entre si (ver 7.2). Escolha uma escala.
10. **Limite do script.** `brunnerMunzel` aborta com N>22 (assert); se algum grupo passar de 11 observações o script falha, o que é seguro mas deve ser lembrado ao acrescentar ensaios.

---

## Observação final
- Não encontrei, nesta busca, fonte que fixe o mínimo de N para o t de Welch; não afirmar um número.
- Itens com DOI de livro (Cohen) ou erratum (Delacre) merecem conferência manual antes da versão final.
