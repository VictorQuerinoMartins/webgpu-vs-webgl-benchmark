"""Verifica premissas dos testes (normalidade, variancia, tamanho de efeito) por cenario e metrica.

Le os mesmos relatorios de analise_estatistica.mjs. Saida: verificacao_premissas.csv.
Uso: py -3 scripts/verificar_premissas.py
"""

import csv
import os
import re
from pathlib import Path

import numpy as np
from scipy import stats

REPO = Path(__file__).resolve().parents[1]
SV = os.environ.get("SEM_VSYNC") == "1"  # le resultados_sem_vsync/
RAIZ = "resultados_sem_vsync" if SV else "resultados"
OUT = REPO / ("resultados/conclusões/dados-gerados_sem_vsync" if SV else "resultados/conclusões/dados-gerados") / "verificacao_premissas.csv"
DIRS = {
    "webgl": "threejs-webgl", "webgpu": "threejs-webgpu",
    "webgl-raw": "raw-webgl", "webgpu-raw": "raw-webgpu",
}
PARES = [("webgl", "webgpu"), ("webgl-raw", "webgpu-raw")]
RE_ARQ = re.compile(r"^relatorio_benchmark_(webgl-raw|webgpu-raw|webgl|webgpu)_(cenario_[a-d]|instancing_n\d+)_run(\d+)\.txt$")

# (metrica, arquivo, rotulo, tipo de dado). Tipo: unidade da medida analisada (media de 1 ensaio de 60 s).
METRICAS = [
    ("fps_medio", "rel", "Taxa de Quadros (FPS) Media: ", "taxa continua (media por ensaio), com teto de vsync"),
    ("frame_time_medio_ms", "rel", "Tempo de Frame Medio: ", "tempo continuo (media por ensaio), com piso de vsync"),
    ("draw_calls_medio", "rel", "Draw Calls Medio: ", "contagem (media por ensaio), pode ser constante"),
    ("gpu_tempo_medio_ms", "rel", "Tempo de GPU Medio (ms): ", "tempo continuo (media por ensaio)"),
    ("cpu_overhead_medio_ms", "rel", "Overhead de CPU Medio (ms): ", "derivada (frame time - GPU), pode ser negativa"),
    ("consumo_acumulado_j", "en", "Consumo Acumulado do Ensaio: ", "energia continua (integral em 60 s)"),
    ("potencia_media_w", "en", "Potencia Media (ponderada pelo tempo, janela de 60s): ", "potencia continua (media por ensaio)"),
    ("energia_por_frame_j", "en", "Assinatura Energetica Media por Quadro (Joules/Frame): ", "razao continua (J/frame)"),
    ("frames_por_watt", "en", "Coeficiente de Eficiencia Medio (Frames por Watt): ", "razao continua (frames/W)"),
    ("vram_media_mb", "en", "VRAM Media durante o Ensaio: ", "memoria continua (nvidia-smi, GPU inteira)"),
]


def numero_apos(txt, rotulo):
    for linha in txt.splitlines():
        if linha.startswith(rotulo):
            m = re.search(r"-?[\d.]+", linha[len(rotulo):])
            return float(m.group(0)) if m else None
    return None


def carregar():
    dados = {}  # dados[modo][rotulo][metrica] = [valores]
    for modo, pasta in DIRS.items():
        for arq in (REPO / RAIZ / pasta).glob("ensaio*/*/*.txt"):
            m = RE_ARQ.match(arq.name)
            if not m:
                continue
            rel = arq.read_text(encoding="utf-8")
            en_path = arq.with_name(arq.stem + "_energia.txt")
            en = en_path.read_text(encoding="utf-8") if en_path.exists() else ""
            alvo = dados.setdefault(modo, {}).setdefault(m.group(2), {})
            for nome, fonte, rotulo, _ in METRICAS:
                v = numero_apos(rel if fonte == "rel" else en, rotulo)
                if v is not None:
                    alvo.setdefault(nome, []).append(v)
    return dados


def magnitude(d):
    d = abs(d)
    return "desprezivel" if d < 0.2 else "pequeno" if d < 0.5 else "medio" if d < 0.8 else "grande"


def shapiro_p(x):
    x = np.asarray(x, float)
    return float("nan") if np.ptp(x) == 0 else float(stats.shapiro(x).pvalue)


def main():
    dados = carregar()
    tipos = {n: t for n, _, _, t in METRICAS}
    linhas = []
    for gl, gpu in PARES:
        for rotulo in sorted(dados.get(gl, {})):
            for nome, *_ in METRICAS:
                a = np.array(dados[gl][rotulo].get(nome, []), float)
                b = np.array(dados.get(gpu, {}).get(rotulo, {}).get(nome, []), float)
                if len(a) < 3 or len(b) < 3:
                    continue
                sa, sb = a.std(ddof=1), b.std(ddof=1)
                dif = b.mean() - a.mean()
                sd_medio = np.sqrt((sa**2 + sb**2) / 2)
                sp = np.sqrt(((len(a) - 1) * sa**2 + (len(b) - 1) * sb**2) / (len(a) + len(b) - 2))
                d_med = dif / sd_medio if sd_medio > 0 else float("nan")
                d_pool = dif / sp if sp > 0 else float("nan")
                cv_min = min(sa / abs(a.mean()) if a.mean() else 0, sb / abs(b.mean()) if b.mean() else 0)
                p_a, p_b = shapiro_p(a), shapiro_p(b)
                razao_sd = max(sa, sb) / min(sa, sb) if min(sa, sb) > 0 else float("nan")
                flags = []
                if sa == 0 and sb == 0:
                    flags.append("sem_variancia")
                elif cv_min < 1e-3:
                    flags.append("variancia_quase_nula")
                if any(p < 0.05 for p in (p_a, p_b) if not np.isnan(p)):
                    flags.append("normalidade_rejeitada")
                if (a < 0).any() or (b < 0).any():
                    flags.append("valor_negativo")
                if not np.isnan(razao_sd) and razao_sd > 3:
                    flags.append("variancias_muito_diferentes")
                if "sem_variancia" in flags:
                    rec = "nao_testar"
                elif "valor_negativo" in flags:
                    rec = "nao_interpretar"
                elif "variancia_quase_nula" in flags:
                    rec = "reportar_dif_absoluta_nao_d"
                elif "normalidade_rejeitada" in flags:
                    rec = "priorizar_MannWhitney"
                else:
                    rec = "ok"
                linhas.append({
                    "par": f"{gpu}_vs_{gl}", "cenario": rotulo, "metrica": nome, "tipo_dado": tipos[nome],
                    "n": f"{len(a)}/{len(b)}",
                    "shapiro_p_webgl": f"{p_a:.3f}", "shapiro_p_webgpu": f"{p_b:.3f}",
                    "razao_desvios": f"{razao_sd:.2f}", "cv_menor": f"{cv_min:.5f}",
                    "d_desvio_medio": f"{d_med:.3f}", "d_desvio_combinado": f"{d_pool:.3f}",
                    "magnitude": magnitude(d_med) if not np.isnan(d_med) else "",
                    "dif_pct": f"{dif / a.mean() * 100:.2f}" if a.mean() else "",
                    "flags": "|".join(flags), "recomendacao": rec,
                })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0]))
        w.writeheader()
        w.writerows(linhas)
    n = len(linhas)
    cont = lambda c: sum(c(l) for l in linhas)
    print(f"{n} comparacoes -> {OUT}")
    print("recomendacao:", {r: cont(lambda l, r=r: l["recomendacao"] == r) for r in sorted({l['recomendacao'] for l in linhas})})
    print("com normalidade rejeitada (algum grupo, Shapiro p<0,05):", cont(lambda l: "normalidade_rejeitada" in l["flags"]))
    print("com variancias muito diferentes (razao>3):", cont(lambda l: "variancias_muito_diferentes" in l["flags"]))
    gr = [float(l[c]) for l in linhas for c in ("shapiro_p_webgl", "shapiro_p_webgpu") if l[c] != "nan"]
    print(f"grupos testados no Shapiro: {len(gr)}, rejeitados (p<0,05): {sum(p < 0.05 for p in gr)}")
    dif_d = max(abs(float(l["d_desvio_medio"]) - float(l["d_desvio_combinado"])) for l in linhas if l["d_desvio_medio"] != "nan")
    print(f"maior diferenca |d_medio - d_combinado| (N igual => ~0): {dif_d:.2e}")


if __name__ == "__main__":
    main()
