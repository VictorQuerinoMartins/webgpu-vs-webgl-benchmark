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
instantânea da GPU dedicada (NVIDIA GeForce RTX 3050 Laptop) a 1 Hz,
independentemente da aplicação sob teste, e o resultado é correlacionado
*a posteriori* com os dados de desempenho (FPS, Frame Time) coletados pela
aplicação em `src/main.js`.

Essa separação entre *sonda de energia* (processo externo) e *software sob
teste* (aplicação WebGL/WebGPU) segue o mesmo princípio metodológico geral
adotado por estudos de eficiência energética de software, entre eles
Feitosa et al. (2017) — *"Investigating the effect of design patterns on
energy consumption"*: a energia é capturada por instrumentação de hardware
ou driver externa à aplicação, e associada ao comportamento do software por
meio de **sincronização temporal** (timestamps), e não por estimativas
indiretas via contagem de instruções de CPU ou modelos analíticos de
consumo.

> ⚠️ Nota para quem for citar Feitosa et al. (2017) na monografia: a
> caracterização acima descreve o *tipo* de abordagem (instrumentação
> externa correlacionada por tempo), comum na literatura de Green IT/Green
> Software. Antes de atribuir detalhes específicos da metodologia deles
> (ferramenta exata, granularidade de amostragem, hardware de medição) ao
> texto do TCC, confirme na seção de Metodologia do artigo original — o
> texto aqui não deve ser tratado como citação literal do procedimento
> exato empregado pelos autores.

---

## 2. Sincronização temporal entre software e sonda de energia

O `nvidia-smi` produz um log de potência em coordenadas de **tempo Unix
absoluto** (`scripts/power_monitor.sh`, amostragem a cada 1s):

```
timestamp,watts
1735900000,42.3
1735900001,44.1
...
```

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

A taxa de amostragem do `nvidia-smi` (1 Hz) é muito mais grosseira que a
taxa de quadros da aplicação (dezenas a centenas de Hz). Em vez de atribuir
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
- **Resolução temporal:** amostragem a 1 Hz é uma limitação de hardware do
  driver NVIDIA em modo usuário (não há API pública de maior frequência
  sem ferramentas adicionais de profiling). A interpolação linear suaviza,
  mas não reconstrói, variações de potência mais rápidas que 1s.
- **Sincronização por software:** o timestamp de início depende do
  relógio do sistema operacional (`Date.now()`) e do agendamento do
  processo do `nvidia-smi`; jitter de alguns milissegundos é esperado e
  irrelevante frente à janela de 60s e à resolução de 1 Hz da sonda.
- **Repetição:** conforme a seção 8 de `COMO-TESTAR-CENARIOS.md`, cada
  combinação API×Cenário deve ser repetida (mínimo 3 execuções) e a média
  reportada, para mitigar ruído de *thermal throttling* e variações do
  agendador do SO.

---

## 6. Rastreabilidade

- Instrumentação de captura de energia: `scripts/power_monitor.sh`.
- Timestamp de sincronização: `autoStartEpochMs` em `src/main.js`,
  `src/main-raw-webgl.js`, `src/main-raw-webgpu.js` (linha "Timestamp Unix
  de Inicio do Ensaio (ms)" nos relatórios exportados).
- Cálculo/correlação: `scripts/analisar_energia.mjs` (`npm run
  analisar-energia -- <relatorio.txt> <power_log.csv>`).
- Passo a passo operacional: `COMO-TESTAR-CENARIOS.md`, seção 10.
