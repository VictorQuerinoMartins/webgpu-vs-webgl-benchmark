# 📏 Regras do Repositório

Este repositório é o **artefato experimental de um TCC** (WebGL vs. WebGPU em renderização arquitetônica de larga escala — hardware e metodologia completos em [`CLAUDE.md`](CLAUDE.md)). Os números da monografia vêm diretamente do que este código produz, então algumas coisas aqui não são só "estilo de código" — são pré-condições para o experimento continuar válido e comparável entre APIs.

Se você só quer rodar e ver os benchmarks funcionando, pule para [Requisitos](#-requisitos-para-rodar). Se for propor uma mudança, leia [O que não alterar](#-o-que-não-alterar-sem-cuidado) antes.

---

## ✅ Requisitos para rodar

| Item | Detalhe |
|---|---|
| **Node.js** | LTS mais recente + npm |
| **Navegador** | Google Chrome ou Microsoft Edge **atualizados**, com WebGPU habilitado (padrão desde Chrome/Edge 113 — versões mais antigas precisam ativar `chrome://flags/#enable-unsafe-webgpu`). Firefox e Safari não têm suporte estável a WebGPU e não são cobertos pelos testes. |
| **GPU dedicada** | Se o notebook tiver GPU híbrida (integrada + dedicada), configure o navegador para usar a **dedicada** no SO — no Windows: *Configurações → Sistema → Vídeo → Preferências gráficas → selecione o navegador → Alto desempenho*. Sem isso o WebGPU roda na iGPU por padrão e os resultados não são comparáveis aos do dataset oficial. |
| **GPU NVIDIA** *(opcional)* | Só necessária para as métricas de energia/VRAM/temperatura (`npm run coletar` chama `nvidia-smi`). Sem uma GPU NVIDIA, rode a coleta com a flag `--sem-metricas-gpu`. |
| **Sistema Operacional** | A coleta automatizada (`npm run coletar`) usa PowerShell/WMI para auditar o estado do sistema antes do lote — testada só em Windows. A aplicação em si (`npm run dev`) roda em qualquer SO com um navegador compatível. |

```bash
npm install
npm run dev
```

---

## 🚫 O que não alterar sem cuidado

Essas são as invariantes do experimento. Mudar qualquer uma delas sem entender o motivo invalida a comparação entre WebGL e WebGPU ou quebra a compatibilidade com o dataset já coletado.

1. **Ponto único de entrada.** Motor gráfico e cenário são escolhidos só via `CONFIG_API`/`CONFIG_CENARIO` (query string `?api=` e `?cenario=`) no topo de `src/main.js`. Não fragmente a aplicação em múltiplos entry points para "simplificar" — isso é o que garante que WebGL e WebGPU rodam exatamente o mesmo código de cena.
2. **Inicialização de GPU dedicada.** Os dois renderizadores precisam de `powerPreference: "high-performance"`; o `WebGPURenderer` precisa do `await renderer.init()` assíncrono. Remover qualquer um dos dois empurra o WebGPU de volta pra iGPU silenciosamente, sem erro — e invalida qualquer número coletado depois.
3. **O trilho da câmera.** Os pontos da `THREE.CatmullRomCurve3` em `main.js`, `main-raw-webgl.js` e `main-raw-webgpu.js` foram calibrados manualmente para não colidir com a cena (histórico da última correção em `docs/CHANGES-LOG.md`). Os três arquivos têm que manter as mesmas coordenadas. Se precisar mexer, valide visualmente os 60s inteiros do percurso antes de commitar.
4. **Formato e duração do relatório.** O ensaio dura exatamente `60000` ms e o relatório final (`exportarMetricasCSV`) segue um formato de texto fixo — os scripts de análise (`scripts/consolidar_medias.mjs`, `scripts/gerar_tabela_txt.mjs`, `scripts/analisar_energia.mjs`) fazem *parsing* desse texto por linha. Mudar rótulos, unidades ou a duração quebra tudo que consome esses arquivos, incluindo o dataset já coletado.
5. **Os modelos `.glb` em `public/`.** `CenarioBistroA/B/C/D.glb` compartilham a mesma geometria-base (1.297 nodes, 1.591 primitivas) e variam só a resolução de textura — é essa a variável controlada do experimento. Não recomprima nem substitua esses arquivos sem preservar essa equivalência.
6. **Nomenclatura de `resultados/`.** Os scripts de coleta e análise esperam nomes de pasta fixos (`resultados/threejs-webgl`, `threejs-webgpu`, `raw-webgl`, `raw-webgpu`, `power_logs`, `conclusões/dados-gerados`). Renomear qualquer uma sem atualizar os scripts correspondentes quebra a automação.

Para o contexto metodológico completo por trás de cada uma dessas regras (hardware do ensaio, matriz de métricas, cenários de estresse), veja [`CLAUDE.md`](CLAUDE.md) e [`docs/COMO-TESTAR-CENARIOS.md`](docs/COMO-TESTAR-CENARIOS.md).
