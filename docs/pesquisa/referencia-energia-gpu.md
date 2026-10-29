# Referência: sensor de potência embutido das GPUs NVIDIA (Yang, Adamek e Armour, SC24)

Verificado em 2026-10-29. Legenda: **[V]** = aberto e conferido; **[V-sec]** = lido via sumarizador automático sobre a página (citações curtas conferíveis no HTML, mas não li o PDF/IEEE diretamente); **[NV]** = não verificado.

## 1. Referência

**YANG, Z.; ADAMEK, K.; ARMOUR, W.** Accurate and convenient energy measurements for GPUs: a detailed study of NVIDIA GPU's built-in power sensor. In: INTERNATIONAL CONFERENCE FOR HIGH PERFORMANCE COMPUTING, NETWORKING, STORAGE AND ANALYSIS (SC24), 2024. *Proceedings...* IEEE, 2024. p. 1-17. DOI: 10.1109/SC41406.2024.00028. **[V]** via Crossref (https://api.crossref.org/works/10.1109/SC41406.2024.00028).

- **Correção do título:** o Crossref registra o título como "...A Detailed Study of NVIDIA GPU's **Built-In Power Sensor**", não "Built-In Energy Measurement Feature". Usar o título do Crossref. Não abri a página da IEEE; confirmei autores, ano, veículo, páginas e DOI só pelo Crossref.
- **Versão em acesso aberto:** arXiv:2312.02741, "Part-time power measurements: nvidia-smi's lack of attention", mesmos três autores, v1 de 5 dez 2023, v3 de 12 dez 2024 (https://arxiv.org/abs/2312.02741; HTML v3: https://arxiv.org/html/2312.02741v3). **[V]** A página do arXiv lista o DOI 10.1109/SC41406.2024.00028 como relacionado, mas **não afirma** que seja o mesmo texto nem traz "journal-ref"; o título é diferente. Assumo (raciocínio meu) que é a versão de preprint do mesmo trabalho, pelos autores idênticos e pelo DOI relacionado, mas **não confirmei que o conteúdo do arXiv v3 coincida com a versão publicada no SC24**. As afirmações abaixo vêm do arXiv v3; ao citar a versão IEEE, confirmar seções e números no PDF publicado.

## 2. O que o artigo diz (arXiv v3) [V-sec]

**(a) Janela de amostragem ("part-time")**
- O valor de `power.draw` fica constante entre atualizações. Período mediano de atualização: ~20 ms na V100 e ~101 ms na A100 (Sec. 4.1, Fig. 6).
- Na A100 e na H100, o nvidia-smi "só reporta a média dos últimos 25 ms a cada 100 ms", logo ~75% da atividade não é capturada (Sec. 5.1, caso 3; Fig. 14: janela de 25 ms em todas as versões de driver testadas na A100). O resumo diz que em A100/H100 só 25% do tempo de execução é amostrado.
- **Consulta mais rápida reduz a perda?** O artigo, no que li, **não testa** consultar o nvidia-smi mais rápido como remédio. Como o valor se mantém entre atualizações do sensor, consultar mais rápido que o período de atualização tende a repetir a mesma amostra (inferência minha, não frase do artigo). A mitigação proposta é deslocar a fase da carga em relação à janela do sensor (item d), não aumentar a taxa de consulta.

**(b) Precisão e cobertura**
- Erro reportado: ±5% (não ±5 W como NVIDIA declara) (Introdução); na maioria dos casos dentro de ±5% (Sec. 4.2).
- Cobertura: a documentação descreve a leitura "instant" como cobrindo a placa inteira. Na Grace Hopper a leitura inclui potência de CPU e provavelmente DRAM, não só da GPU (Sec. 6). Para GPU discreta de notebook, o artigo não discute o que a "placa inteira" inclui.
- Erro de energia (Fig. 18): método ingênuo com média de 39,27% de erro; com as boas práticas, 4,89% (redução de 34,38 pontos); o resumo fala em redução média de 35%, até 65% em alguns casos.
- Comparações absolutas entre GPUs diferentes continuam não confiáveis (aviso do artigo).

**(c) GPUs testadas** (mais de 70 GPUs, mais de 25 modelos, 12 gerações, Sec. 3.1/Tabela 1)
- Inclui RTX 3090 (5), RTX 3070 Ti (1), RTX 2060 Super, RTX 4090, RTX A6000 (10), A5000, A10, A100, H100 e **uma GTX 1650 Ti de notebook** (Sec. 4.4).
- **A RTX 3050 Laptop do TCC não consta** nos itens que consegui ver. A cobertura de laptop é uma única GPU (GTX 1650 Ti, Turing). Não confirmei a lista completa da Tabela 1 no PDF.
- Janela da Ampere de consumo: com drivers anteriores a março de 2023 a média era de 1 s; com o driver 530 foi de 100 ms (Fig. 14). Qual é a janela da RTX 3050 Laptop no driver do TCC **não foi medido**; precisaria ser verificado.

**(d) Recomendações do artigo**
- Repetir a carga por pelo menos 32 iterações consecutivas ou 5 s e executar 4 ensaios com atrasos aleatórios entre eles (Sec. 5.1).
- Em GPUs com janela de 25 ms (A100/H100): inserir ~8 atrasos controlados de 25 ms para deslocar a fase; sem isso o erro pode chegar a 30% de desvio-padrão em cargas de 100 ms.
- Descartar as repetições do tempo de subida (rise time: ~250 ms, 1250 ms ou 100 ms conforme o caso) e deslocar os dados para alinhar com a atividade da GPU (ex.: 100 ms mais cedo).
- Se houver medidor externo, calibrar ganho e offset (reduz o erro "quase a zero", Sec. 5.3).
- **Não recomenda uma taxa de amostragem de nvidia-smi** (no que li).

## 3. O que sustenta para este TCC e o que NÃO sustenta

**Sustenta (com ressalvas):**
- O `power.draw` do nvidia-smi não é uma medida contínua; é uma média sobre janela finita, atualizada em período fixo, com erro típico de ±5% em placas testadas. Isso justifica tratar J/frame e frames/W como estimativas, não medições de precisão laboratorial.
- A prática de repetir o ensaio (N=9) e randomizar a ordem é compatível com a recomendação do artigo de repetições com atrasos aleatórios (analogia minha: o artigo randomiza atrasos de fase, o TCC randomiza a ordem dos ensaios; não são a mesma técnica).
- Comparações **relativas** entre WebGL e WebGPU na mesma placa são menos afetadas por erro proporcional comum do sensor (raciocínio meu, coerente com o aviso de que o absoluto entre GPUs é pouco confiável; o artigo não prova isso para viés relativo).

**NÃO sustenta:**
- Que amostrar a 10 Hz (100 ms) em vez de 1 Hz capture mais transientes da RTX 3050 Laptop. O artigo não testa esse efeito; a taxa de 10 Hz só ajuda se a janela de média e o período de atualização do sensor dessa placa/driver forem ≤100 ms (não medidos aqui). Se o sensor da 3050 atualiza a cada ~100 ms, consultar a 10 Hz apenas acompanha o ritmo do sensor, e se a janela for de 1 s (drivers antigos) a média de 1 s suaviza tudo. Hipótese a verificar com o próprio driver, por exemplo observando o período de repetição dos valores em `nvidia-smi --loop-ms=...`.
- Que o erro de ±5% se aplique à RTX 3050 Laptop (não foi testada).
- Que o valor represente apenas a GPU: em notebook com dGPU, o que o sensor cobre (placa inteira, incluindo VRAM e regulação?) não é discutido para essa classe.
- Que seja possível corrigir o erro sem medidor externo; o TCC não tem um (pelo que consta no projeto).
- Qualquer conclusão sobre o processo do navegador: o sensor mede a placa inteira, mesmo achado já anotado no projeto (spot-check de VRAM por processo).

## 4. Frase de uso sugerida (limitações de energia)

"A potência da dGPU foi lida do sensor embutido via nvidia-smi, que reporta médias sobre uma janela finita e atualizadas em período fixo, com erro típico de cerca de ±5% nas GPUs estudadas por Yang, Adamek e Armour (2024), que não incluíram a RTX 3050 Laptop usada aqui; por isso J/frame e frames/W são tratados como estimativas e a análise se concentra em diferenças relativas entre WebGL e WebGPU sob o mesmo sensor, sem comparação com valores absolutos de outras GPUs."

## 5. Não consegui verificar
- Página da IEEE Xplore / PDF publicado do SC24 (só Crossref). Equivalência de conteúdo entre arXiv v3 e a versão IEEE.
- Tabela 1 completa de GPUs (a presença ou ausência da RTX 3050 Laptop vem da lista resumida pelo sumarizador).
- A janela de média e o período de atualização do sensor da RTX 3050 Laptop no driver usado pelo TCC.
