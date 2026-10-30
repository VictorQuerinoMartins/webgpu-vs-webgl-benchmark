# Vsync desligado vs. ligado em benchmarks gráficos: o que a literatura sustenta

Data: 2026-10-30. Complementa `pesquisa-webgpu-webgl.md` (II.8.2 já registra a ressalva de vsync na decomposição CPU/GPU).

Legenda de peso epistêmico: [DOC] documentação oficial/fabricante; [FÓRUM/IMPRENSA] prática de praticantes, sem revisão por pares; [PAR] peer-reviewed; [RACIOCÍNIO] inferência minha, não fato verificado.
Legenda de verificação: ABERTA = abri a página e li o trecho; SNIPPET = só vi o resultado de busca, não abri/ não consegui ler a fonte primária.

## 1. Resposta direta

Sim, na prática de benchmarking de GPU o padrão é medir com vsync DESLIGADO (frame rate sem teto) quando o objetivo é desempenho bruto/throughput, porque o vsync trunca o resultado no refresh do monitor e esconde diferença entre configurações. Isso é consenso de ferramentas (3DMark avisa o usuário), imprensa de hardware e guias de profiling. Porém:

- Não encontrei norma formal (ISO/Khronos/W3C) que exija isso; é convenção de prática, com fontes de peso [DOC]/[FÓRUM], não [PAR].
- Vsync ligado é usado/recomendado quando a pergunta é experiência do usuário (suavidade, pacing, latência) ou energia em condições reais de uso (jogos reais rodam capados). Há literatura [PAR] de energia em jogos móveis que parte justamente de frame rate fixo/capado.
- Não encontrei nenhum estudo peer-reviewed WebGL vs WebGPU que documente explicitamente a política de vsync. A literatura comparativa que achei é de fórum/blog, e nela muitos resultados não dizem se estavam capados (fonte abaixo, SNIPPET).

## 2. Fontes

### Abertas (ABERTA)

1. UL Benchmarks (3DMark), "3DMark warns me that G-SYNC is enabled but I don't have a G-SYNC compatible monitor", suporte UL, s.d. [DOC]
   https://support.benchmarks.ul.com/support/solutions/articles/44001788420-3dmark-warns-me-that-g-sync-is-enabled-but-i-don-t-have-a-g-sync-compatible-monitor
   Trecho lido: "These settings can cap the frame rate when the benchmark frame rate exceeds the monitor refresh rate", resultando em score "too low". Sustenta: ferramenta de benchmark de referência trata vsync/G-SYNC ligados como invalidante do score bruto.

2. Hwang, C.; Pushp, S.; Koh, C.; Yoon, J.; Choi, S.; Song, J.; Liu, Y. "RAVEN: Perception-aware Optimization of Power Consumption for Mobile Games", MobiCom 2017 (KAIST/Microsoft Research Asia). [PAR]
   Aberto via post do MSR (2018): https://www.microsoft.com/en-us/research/?p=465777 (não abri o paper em si).
   Lido: jogos renderizam a 60 FPS fixos mesmo com quadros quase idênticos; economia média de 21,8% (até 34,7%) de energia por sessão reduzindo taxa de quadros; estudo com 11 usuários (Nexus 5X). Sustenta: reduzir/capar quadros reduz energia, e o custo de renderizar quadros "a mais" é um tema de pesquisa de Green IT.

3. Chromium, `third_party/blink/manual_tests/canvas/` README. [DOC, código-fonte]
   https://chromium.googlesource.com/chromium/src/+/6da1f51df86aee94ed2f57684368ff7e441a4a77/third_party/blink/manual_tests/canvas/
   Lido: "Start Chromium with `--disable-frame-rate-limit --enable-precise-memory-info`" para rodar testes de canvas com `requestAnimationFrame`. Sustenta: o próprio time do Chromium usa a flag para testes de desempenho de rAF. NÃO explica o efeito exato da flag; o README não diz o que mede.

4. Toji (Brandon Jones, Google), "WebGPU Best Practices: WebGL performance comparison". [DOC/blog de membro do grupo W3C]
   https://toji.dev/webgpu-best-practices/webgl-performance-comparison
   Lido: orienta paridade (mesma GPU via `powerPreference`, mesmo tamanho de canvas, MSAA, formato, conteúdo e câmera). NÃO trata vsync, caps nem timing (confirmei: o texto não cobre). Útil para a seção de validade interna, não para a decisão de vsync.

### Vistas só em resultados de busca (SNIPPET; não consegui abrir/ler a fonte primária)

5. Tom's Hardware, "The Meaning Of 'Flip At Vertical Retrace' Or 'VSYNC'" (NVIDIA vs. 3Dfx - TNT vs. the Voodoos), final dos anos 1990 (data/autor não confirmados). [IMPRENSA]
   https://www.tomshardware.com/reviews/nvidia,87-3.html
   Citação vista só no snippet: "Benchmarking should by all means be done with 'VSYNC disabled'". Fetch retornou conteúdo truncado.

6. Texas Instruments, Processor SDK Linux, "Chromium Browser - User Guide" (ex.: AM62x). [DOC de fabricante]
   https://software-dl.ti.com/processor-sdk-linux/esd/AM62X/11_02_08_02_Debian/exports/docs/debian/Demo_User_Guides/Chromium_Browser.html
   Snippet: "To get raw performance numbers from the GPU, you may want to disable frame sync locking in Chromium", com `--disable-gpu-vsync --disable-frame-rate-limit`, rodando WebGL Aquarium. É o único trecho que vi ligando exatamente essas flags a "números brutos". Não li a página inteira.

7. Intel, suporte (artigo 000095370), sobre 3DMark em modo janela: em janela, 3DMark pode não conseguir forçar vsync off e fica capado no refresh. [DOC]
   https://www.intel.com/content/www/us/en/support/articles/000095370.html
   Snippet apenas. Relevante para você: validar que o Chrome em janela (DWM) realmente destravou, ver seção 5.

8. UL, "The frame rate exceeded the NVIDIA Max Frame Rate setting". [DOC]
   https://support.benchmarks.ul.com/support/solutions/articles/44001873452-the-frame-rate-exceeded-the-nvidia-max-frame-rate-setting
   Snippet: cap do painel NVIDIA enviesa o score; desativar durante benchmark. Relevante: o cap global do driver também deve ser checado.

9. Kishonti GFXBench / reviews (ex.: Tom's Hardware "GFXBench 3.0: A Fresh Look At Mobile Benchmarking"). [IMPRENSA]
   https://www.tomshardware.com/uk/reviews/gfxbench-3-graphics-performance,3743-5.html
   Snippet: testes offscreen usados para que refresh/vsync e resolução do painel não limitem a comparação. Não encontrei documentação do próprio Kishonti descrevendo isso.

10. Purdue HotPower 2015, "paper 6" (medição de 40 jogos Android: 35 a 60 FPS fixos, 5 a 30 FPS; proposta de Dynamic Frame Rate Scaling). [PAR/workshop]
    https://engineering.purdue.edu/~hotpower/HotPower_2015_paper_6.pdf
    Snippet apenas; o PDF baixou mas a ferramenta não extraiu texto. Título e autores NÃO verificados.

11. Co-Cap: "Energy-efficient Cooperative CPU-GPU Frequency Capping for Mobile Games" (2016). [PAR]
    https://archive.cps-vo.org/biblio/view/39094
    Snippet: mais de 70 jogos, melhoria de energia por quadro de ~10%. Autores/venue NÃO verificados. É o mais próximo de "energia por quadro" na literatura que achei.

12. AnandTech, "New for GTX 800M: Battery Boost" (2014). [IMPRENSA]
    https://at-web1.www.anandtech.com/show/7834/nvidia-geforce-800m-lineup-battery-boost/2
    Snippet: alvo de 30 FPS elevou autonomia de ~86 para ~107 min em Borderlands 2 (laptop de teste). Mostra que cap de FPS é prática comercial de economia de energia em laptop NVIDIA.

13. NVIDIA FrameView (via TechSpot, página de download; não a doc da NVIDIA). [IMPRENSA]
    https://www.techspot.com/downloads/7658-nvidia-frameview-app.html
    Snippet: FrameView usa PresentMon e registra potência de chip/placa via APIs de software, com percentis 90/95/99 de frame rate. Não encontrei guia oficial NVIDIA/Intel de PresentMon recomendando vsync off; a página da Intel sobre PresentMon retornou redirect e não consegui lê-la.

14. Posts de Three.js/Babylon/Unity forums comparando WebGPU vs WebGL (ex. https://discourse.threejs.org/t/webgpu-performance-issue/87939). [FÓRUM]
    Snippet: nenhum informava se estava com vsync/capado. Serve apenas como indício de que a prática do campo é pouco documentada.

15. Unity, `QualitySettings.vSyncCount` (docs 5.4): "Don't Sync" = 0. Mais um issue tracker dizendo que a configuração só vale na build, não no editor. [DOC]
    https://docs.unity3d.com/540/Documentation/ScriptReference/QualitySettings-vSyncCount.html
    Snippet. Recomendação "vSyncCount=0 + targetFrameRate=-1 + build standalone" veio de blogs, não da doc oficial; não verificada. NÃO consegui verificar guia de profiling da Unreal, guia da Khronos, nem artigo peer-reviewed WebGL/WebGPU com política de vsync.

### Não encontrado
- Documentação oficial do Chromium explicando semântica de `--disable-frame-rate-limit` / `--disable-gpu-vsync` em rAF e compositor.
- Guia oficial NVIDIA/Intel de PresentMon sobre vsync.
- Artigo peer-reviewed comparando WebGL e WebGPU com política de vsync explícita.
- Estudo [PAR] de energia por quadro comparando uncapped vs. capado em desktop/laptop com dGPU.

## 3. Pontos da pergunta

(a) Desempenho bruto vs. experiência: a convenção é separar. Throughput = sem vsync (fontes 1, 5, 6, 9). Experiência = vsync/VRR, com métricas de pacing (percentis, 1% low), como FrameView/PresentMon (13). Nada na literatura que abri diz que um substitui o outro.

(b) Energia: não achei norma. Fatos: capar quadros reduz potência (12; 2); o único número de energia por quadro [PAR] que vi é Co-Cap (11, snippet). [RACIOCÍNIO] Com cap, a GPU idle-espera dentro do intervalo do vsync, então J/quadro = P_média/FPS_capado depende do quanto sobra de folga; a API que termina antes "parece" economizar por esperar mais, e a diferença entre APIs reflete headroom, não custo por quadro. Sem cap, a GPU roda saturada e J/quadro = P/FPS mede custo de produção de um quadro, o que isola eficiência da API. Contra: sem cap a GPU atinge power limit/térmico, e P pode saturar no TGP do laptop, comprimindo diferenças de P entre APIs (a diferença vira só FPS).

(c) Riscos sem vsync: tearing é irrelevante para métricas porque você não avalia imagem (prática padrão; nenhuma fonte contraditória). Riscos reais: throttling térmico/power limit em laptop com GPU a 100% (mitigação: monitorar clocks e `clocks_throttle_reasons`, que você já tem), frames não apresentados/descartados pelo compositor (DWM) fazendo FPS medido via rAF divergir do FPS exibido (7; [RACIOCÍNIO]), e rAF em Chrome com flags não padrão (cenário não representativo do usuário; fonte 3 e 6 só mostram o uso da flag, não validam o comportamento).

(d) Ferramentas: 3DMark (1, 8), GFXBench offscreen (9), TI/Chromium (3, 6), Unity (15) convergem em "sem sync para bruto". Khronos/Unreal: não verificado.

## 4. Recomendação para este TCC

1. Reclassificar os papéis. [RACIOCÍNIO baseado nas fontes 1, 5, 6, 9]
   - Conjunto principal para desempenho bruto, frame time e decomposição CPU/GPU (CLAUDE.md §3.A): SEM vsync, em todos os cenários. A própria ressalva do CLAUDE.md (A/B/C saturam em 144 Hz) é a razão pela qual a convenção existe.
   - Conjunto de controle: COM vsync (dataset atual), apresentado como "experiência do usuário / uso real".
   Não é o inverso: o dataset vsync-on só discrimina APIs onde o frame time ultrapassa 6,9 ms (cenário D e instancing).

2. Justificativa na monografia (frase-guia): "A medição sem sincronização vertical segue a prática de ferramentas de benchmark como o 3DMark, que trata vsync ligado como causa de score subestimado quando o frame rate excede o refresh (UL, s.d.). O dataset com vsync é mantido como controle de ecologia (experiência do usuário)." Declare que não há norma formal (limitação) e que a prática é convenção da indústria.

3. Energia, duas leituras separadas e nomeadas:
   - Sem cap: J/quadro e frames/W em saturação = eficiência intrínseca da pilha. Reporte também o clock e o flag de throttle, porque P pode estar no power limit (então diferença de J/quadro vem quase só do FPS).
   - Com vsync (ou cap fixo igual para as duas APIs, p.ex. 144): potência média e joules totais por 60 s a trabalho igual = custo para entregar a mesma experiência. Esta é a leitura que um argumento de Green IT para o usuário final realmente precisa. [RACIOCÍNIO]
   Não misture as duas na mesma tabela e não interprete J/quadro do vsync-on como eficiência da API sem a ressalva de headroom.

4. Controles técnicos a documentar (checklist):
   - Confirmar que o FPS realmente destravou nas três implementações (Three.js WebGL, Three.js WebGPU, cru), em mesma janela/tamanho de canvas, MSAA igual (já corrigido).
   - Desligar/verificar Max Frame Rate no painel NVIDIA e G-SYNC (fonte 8).
   - Ordem aleatória/intercalada dos ensaios e sentinela térmica (já existe) para evitar que o throttling cumulativo se alie à ordem das APIs.
   - Registrar clocks, temperatura e throttle por ensaio e reportar quando a GPU bate no power limit.
   - Fazer um piloto curto confirmando consistência entre rAF-FPS e o que o compositor apresenta (PresentMon, ferramenta externa, pode ser um cross-check opcional).
   - Timestamp queries (GPU time) ficam muito mais úteis sem vsync: a decomposição CPU/GPU deixa de ser contaminada pela espera.

5. Limitação a declarar: as flags do Chrome são configuração não padrão; o resultado vale para "capacidade de throughput nesta pilha", não para o usuário comum.

## 5. Atualização pendente em `pesquisa-webgpu-webgl.md`
II.8.2 diz que a decomposição é confiável só no D e instancing. Se adotar o conjunto sem vsync, esta ressalva muda para "só vale no conjunto sem vsync". Não editei o documento, para você decidir a metodologia primeiro.
