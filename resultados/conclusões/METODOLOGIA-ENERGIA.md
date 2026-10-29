# Metodologia de Medição de Consumo Energético (Dimensão Green IT)

> Texto-fonte para a seção de Metodologia da monografia. Descreve como a
> instrumentação de energia foi implementada, os cálculos aplicados e como
> isso se relaciona com a abordagem de Feitosa et al. (2017). Adapte a
> redação/tom conforme o padrão do restante do TCC antes de colar.

---

## 1. Por que a energia não pode ser medida de dentro do navegador

A API JavaScript não expõe nenhum mecanismo para leitura de potência de
GPU — não há `navigator.gpu.power` ou equivalente. Toda medição de energia
neste estudo é, portanto, **externa ao processo do navegador**: um
utilitário de linha de comando (`nvidia-smi`) amostra a potência
instantânea da GPU dedicada (NVIDIA GeForce RTX 3050 Laptop) a 10 Hz,
independentemente da aplicação sob teste, e o resultado é correlacionado
*a posteriori* com os dados de desempenho (FPS, Frame Time) coletados pela
aplicação em `src/main.js`. O valor vem da leitura do sensor de potência da
placa exposta pelo driver, e não de um modelo de estimativa.

Essa separação entre *sonda de energia* (processo externo) e *software sob
teste* (aplicação WebGL/WebGPU) é comum em estudos de eficiência energética
de software. Feitosa et al. (2017) — *"Investigating the effect of design
patterns on energy consumption"* — também comparam duas implementações
funcionalmente equivalentes (com e sem padrão de projeto) pelo consumo em
joules, medido por ferramentas externas à aplicação. **A instrumentação,
porém, é diferente:** eles usam estimadores de software (PowerAPI, Jalen e
pTop, baseados no TDP da CPU, só CPU, em Linux), escolhidos
deliberadamente em vez de medidor de hardware para obter granularidade por
método. Este trabalho lê o sensor da dGPU diretamente, em Windows. O
paralelo com Feitosa et al. vale para o **desenho comparativo**
(alternativas equivalentes, energia em joules, ferramenta externa, limite
de escopo declarado) e para a **análise** (Shapiro-Wilk, seguido de testes
não paramétricos quando a normalidade é rejeitada), e não para o método de
captura da energia.

> ⚠️ Não atribuir a Feitosa et al. (2017) a medição por hardware nem a
> sincronização por timestamps com amostragem de potência: o artigo usa
> estimativa por software, só da CPU. O desenho deles é pareado (o mesmo
> método nas duas versões), o que não é o caso aqui (WebGL e WebGPU são
> execuções independentes).

---

## 2. Sincronização temporal entre software e sonda de energia

O `nvidia-smi` produz um log em coordenadas de **tempo Unix absoluto, em
milissegundos**. O amostrador oficial (`scripts/automatizar_coleta.mjs`,
`nvidia-smi --loop-ms=100`) usa o timestamp do próprio `nvidia-smi`, o que
evita o jitter de agendar a leitura pelo Node:

```
timestamp,watts,vram_mb,temp_c,clock_mhz,throttle_sw,throttle_hw
1735900000100,42.3,812,71,1425,Not Active,Not Active
1735900000200,44.1,812,71,1425,Not Active,Not Active
...
```

(O `scripts/power_monitor.sh`, a 1 Hz e com epoch em segundos, é o formato
antigo, para uso manual; `analisar_energia.mjs` aceita os dois.)

A aplicação (`src/main.js`, `src/main-raw-webgl.js`,
`src/main-raw-webgpu.js`), por outro lado, registra o desempenho em
**tempo relativo** ao início do ensaio automatizado (o instante em que
`[SPACE]` é pressionado), via `performance.now()`/`clock.getElapsedTime()`.

Para tornar os dois relógios comparáveis, a aplicação passou a exportar,
em todo relatório `.txt`, o instante absoluto (`Date.now()`, em
milissegundos desde a época Unix) em que o ensaio automatizado começou:

```
Timestamp Unix de Inicio do Ensaio (ms): 1735900000000
```

Com essa âncora, o timestamp absoluto de qualquer quadro *i* é:

```
t_absoluto(i) = Timestamp_Inicio + Tempo_Decorrido(i)
```

o que permite localizar, no log de potência, qual amostra de watts estava
em vigor no instante exato em que aquele quadro foi renderizado.

---

## 3. Interpolação de potência

A taxa de amostragem do `nvidia-smi` (10 Hz, `--loop-ms=100`) é mais
grosseira que a taxa de quadros da aplicação (dezenas a centenas de Hz).
Em vez de atribuir
a cada quadro apenas a amostra de potência mais próxima (*nearest
neighbor*, que introduziria descontinuidades artificiais na série), o
script `scripts/analisar_energia.mjs` aplica **interpolação linear** entre
as duas amostras de potência que envolvem o instante do quadro:

```
P_inst(t) = P_a + (t - t_a) / (t_b - t_a) × (P_b - P_a)
```

onde `(t_a, P_a)` e `(t_b, P_b)` são as amostras de potência imediatamente
anterior e posterior a `t`. Fora do intervalo coberto pelo log de potência,
o valor satura na amostra de borda mais próxima (não há extrapolação).

---

## 4. Fórmulas aplicadas

Todas as fórmulas seguem a definição da seção 3.B do `CLAUDE.md`:

| Métrica | Fórmula | Onde é calculada |
|---|---|---|
| Assinatura Energética por Quadro (J) | `E_f = P_inst × (Δt_frame / 1000)` | por quadro |
| Coeficiente Frames/Watt | `FPS_inst / P_inst` | por quadro |
| Consumo Acumulado do Ensaio (J, Wh) | `∫ P(t) dt` sobre os 60s exatos, por regra do trapézio, aplicada diretamente sobre as amostras brutas do `nvidia-smi` (não sobre os quadros) | por ensaio |

O consumo acumulado é calculado sobre a **curva de potência bruta**, e não
como soma das energias por quadro, por dois motivos:

1. É a forma mais fiel de medir a energia real dissipada no intervalo,
   já que integra diretamente o sinal medido, sem depender da densidade de
   amostragem de quadros (que varia com o desempenho de cada API/cenário).
2. Permite comparar o consumo total entre condições com FPS muito
   diferentes (ex.: WebGL vs. WebGPU-RAW) numa base de tempo fixa e igual
   (60s), consistente com a Regra 3/4 do `CLAUDE.md` (trilho de câmera e
   duração do ensaio imutáveis).

---

## 5. Limitações a declarar na monografia

- **Escopo da medição:** o `nvidia-smi --query-gpu=power.draw` mede apenas
  a potência da GPU dedicada (RTX 3050), não o consumo do sistema como um
  todo (CPU, RAM, tela, iGPU). A métrica reflete o custo energético do
  *hardware alvo do estresse gráfico*, não o TCO energético completo da
  máquina.
- **Resolução temporal:** a amostragem é de 10 Hz (`nvidia-smi
  --loop-ms=100`), mas o sensor de potência da RTX 3050 Laptop só atualiza o
  valor a cada ~500 ms (medido sob carga: 123 mudanças em 62 s, intervalo
  entre 485 e 513 ms). A resolução efetiva é, portanto, ~2 Hz. Os 10 Hz
  evitam perder atualizações e reduzem a defasagem de leitura, mas a
  interpolação linear não reconstrói variações de potência mais rápidas
  que ~0,5 s (por exemplo, picos de Frame Time isolados no Cenário D). A
  energia acumulada em 60 s, por ser uma integral, é pouco afetada.
- **Potência em repouso incluída:** o `power.draw` é da dGPU inteira, com o
  piso de potência de repouso. Os `baseline_*.txt` em `resultados/power_logs/`
  permitem descontá-lo, se necessário.
- **CPU fora do escopo:** o custo de submissão de comandos (o ganho esperado
  do WebGPU) ocorre também na CPU, que não é medida. A energia da CPU
  (ex.: RAPL) seria um complemento, não um substituto.
- **Sincronização por software:** o timestamp de início depende do
  relógio do sistema operacional (`Date.now()`) e do agendamento do
  processo do `nvidia-smi`; jitter de alguns milissegundos é esperado e
  irrelevante frente à janela de 60s e à resolução de 100 ms da sonda.
- **Repetição:** cada combinação API×Cenário foi executada 9 vezes (3 lotes
  de 3 repetições, com a ordem sorteada em blocos), e os resultados são
  analisados estatisticamente (ver `docs/pesquisa/referencias-estatistica.md`
  e `scripts/analise_estatistica.mjs`), para mitigar ruído de *thermal
  throttling* e variações do agendador do SO.
- **Energia total não é eficiência:** o consumo acumulado (J em 60 s) só é
  comparável entre APIs quando a carga entregue é a mesma (FPS saturado em
  A–C). Onde o FPS difere (Cenário D e instancing), a medida de eficiência
  é a energia por quadro (J/frame) e o Frames/Watt.

---

## 6. Rastreabilidade

- Instrumentação de captura de energia: amostrador em
  `scripts/automatizar_coleta.mjs` (oficial, 10 Hz); `scripts/power_monitor.sh`
  é o formato manual antigo (1 Hz).
- Timestamp de sincronização: `autoStartEpochMs` em `src/main.js`,
  `src/main-raw-webgl.js`, `src/main-raw-webgpu.js` (linha "Timestamp Unix
  de Inicio do Ensaio (ms)" nos relatórios exportados).
- Cálculo/correlação: `scripts/analisar_energia.mjs` (`npm run
  analisar-energia -- <relatorio.txt> <power_log.csv>`).
- Passo a passo operacional: `COMO-TESTAR-CENARIOS.md`, seção 10.
