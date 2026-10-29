# Teste t na análise de dados: da aula ao TCC

Base de estudo: *Estatística e Probabilidade, Aula 13 (Teste t de Student)*. A aula usa o t clássico (variâncias combinadas). O TCC usa o **t de Welch** (`scripts/analise_estatistica.mjs`). A lógica é a mesma, e só mudam o erro padrão e os graus de liberdade.

## 1. Mapa aula → TCC

| Passo da aula | Aula (t clássico) | TCC (Welch) |
|---|---|---|
| Grupos | Turma A × Turma B (n=7 cada) | WebGL × WebGPU (n=9 cada, por cenário e métrica) |
| Médias | $\bar x_1=6{,}43$, $\bar x_2=5{,}21$ | `media_webgl`, `media_webgpu` |
| Variância | $s^2=\frac{\sum x^2-n\bar x^2}{n-1}$ | $s^2$ de cada API, calculada sobre os 9 ensaios |
| Dispersão combinada | $s_p^2=\frac{(n_1-1)s_1^2+(n_2-1)s_2^2}{n_1+n_2-2}$, depois $\sqrt{\cdot}$ | **Não combina**: $SE=\sqrt{s_1^2/n_1+s_2^2/n_2}$ |
| Estatística t | $t=\frac{\bar x_1-\bar x_2}{SE}$ (deu 1,51) | $t=\frac{\bar x_{GPU}-\bar x_{GL}}{SE}$, coluna `t` |
| Graus de liberdade | $n_1+n_2-2=12$ | Welch–Satterthwaite (fracionário, ex.: 15,82), coluna `gl` |
| Valor crítico (tabela, α=0,05) | ±2,179 | ≈ ±2,12 para gl≈16 |
| Decisão | $\lvert t\rvert<2{,}179$ → não significativo | coluna `p_welch` < 0,05 → significativo |

Graus de liberdade de Welch–Satterthwaite:

$$ gl=\frac{\left(\frac{s_1^2}{n_1}+\frac{s_2^2}{n_2}\right)^2}{\frac{(s_1^2/n_1)^2}{n_1-1}+\frac{(s_2^2/n_2)^2}{n_2-1}} $$

Por que Welch: as duas APIs não têm a mesma variância. O WebGPU tem mais jitter em alguns cenários. A aula pressupõe variâncias parecidas, e Welch dispensa essa suposição.

## 2. Exemplo com os dados reais (Cenário A, FPS médio)

Linha do `estatistica_comparacao.csv`: `media_webgl=143,9911`, `media_webgpu=143,6733`, `n=9` e `9`.

1. Diferença: $143{,}6733-143{,}9911=-0{,}3178$ FPS (WebGPU − WebGL).
2. Erro padrão: $SE=\lvert dif\rvert/\lvert t\rvert=0{,}3178/4{,}409\approx0{,}0721$.
3. $t=-0{,}3178/0{,}0721=-4{,}409$, com $gl=15{,}82$.
4. Valor crítico para gl≈16: ≈2,12. Como $\lvert-4{,}409\rvert>2{,}12$, cai **fora** da região central, então a diferença é significativa. Na aula (1,51 < 2,179) acontecia o contrário.
5. $p=4{,}5\times10^{-4}$ é a área das caudas além de $\pm\lvert t\rvert$, o que a tabela da aula só permite estimar.
6. IC95%: $dif\pm t_{crit}\cdot SE=-0{,}3178\pm2{,}12\times0{,}0721=[-0{,}471;\,-0{,}165]$, igual ao CSV (`ic95_lo`, `ic95_hi`). O intervalo não contém 0, o que equivale a rejeitar H0 a 5%.

Conferência: o item 6 reproduziu os limites do CSV, então o $t_{crit}$ e o SE derivados batem com o script.

## 3. O que a aula não cobre e o TCC usa

- **d de Cohen**: $d=\frac{dif}{\sqrt{(s_1^2+s_2^2)/2}}$, que mede o tamanho do efeito. No exemplo, $d=-2{,}08$ (efeito grande), mas a diferença é de só 0,22% (−0,32 FPS). Significância não é relevância prática, e isso deve ser dito na discussão. O `g_hedges` é o mesmo $d$ com correção para amostra pequena.
- **Mann-Whitney**: alternativa que não pressupõe normalidade (ranks). Com N=9 a normalidade não é verificável, então ele serve de verificação de robustez. Coluna `p_mannwhitney`.
- **Hipóteses**: H0: $\mu_{GPU}=\mu_{GL}$; H1: $\mu_{GPU}\neq\mu_{GL}$ (bilateral).
- **Pressupostos da aula**: dado intervalar (FPS, ms e W são), amostragem aleatória (ensaios independentes em 3 lotes) e amostras independentes (cada API roda em sessão própria).

## 4. Texto sugerido para RESULTADOS E DISCUSSÃO

> Para cada combinação de cenário e métrica, comparou-se a média das $n=9$ execuções de cada API pelo teste t de Welch, que dispensa a hipótese de variâncias iguais. A estatística é $t=(\bar x_{GPU}-\bar x_{GL})/\sqrt{s_{GPU}^2/n+s_{GL}^2/n}$, com graus de liberdade de Welch–Satterthwaite, e rejeitou-se H0 com $p<0{,}05$. Reporta-se também o intervalo de confiança de 95% da diferença, o tamanho de efeito $d$ de Cohen (com correção de Hedges) e o teste não paramétrico de Mann-Whitney como verificação de robustez.
