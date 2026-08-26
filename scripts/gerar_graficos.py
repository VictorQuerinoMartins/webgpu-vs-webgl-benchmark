"""Gera os graficos de dados do capitulo de Resultados do TCC.

Le os relatorios brutos de cada repeticao (mesma fonte usada por
consolidar_medias.mjs) para poder calcular desvio padrao entre as 6
repeticoes de cada combinacao modo x cenario, e escreve os PNGs
diretamente na pasta imagens/ do documento LaTeX.

Uso: py -3 scripts/gerar_graficos.py
"""

import re
import statistics
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

REPO = Path(__file__).resolve().parents[1]
OUT_DIR = REPO.parent / "TCC_CComp_2026 (1)" / "imagens"

DIRS = {
    "webgl": "resultados/threejs-webgl",
    "webgpu": "resultados/threejs-webgpu",
    "webgl-raw": "resultados/raw-webgl",
    "webgpu-raw": "resultados/raw-webgpu",
}

RE_ARQUIVO = re.compile(
    r"^relatorio_benchmark_(webgl-raw|webgpu-raw|webgl|webgpu)_(cenario_[a-d]|instancing_n\d+)_run(\d+)\.txt$"
)

MODOS = ["webgl", "webgpu", "webgl-raw", "webgpu-raw"]
MODO_LABEL = {"webgl": "WebGL", "webgpu": "WebGPU", "webgl-raw": "WebGL-RAW", "webgpu-raw": "WebGPU-RAW"}
# Paleta categorica segura para daltonismo e para impressao P&B (subconjunto Okabe-Ito),
# com hachura nos modos RAW para diferenciar tambem em escala de cinza.
MODO_COLOR = {
    "webgl": "#0072B2",
    "webgpu": "#D55E00",
    "webgl-raw": "#56B4E9",
    "webgpu-raw": "#E69F00",
}
MODO_HATCH = {"webgl": "", "webgpu": "", "webgl-raw": "///", "webgpu-raw": "\\\\\\"}

CENARIOS = ["cenario_a", "cenario_b", "cenario_c", "cenario_d"]
CENARIO_LABEL = {"cenario_a": "A", "cenario_b": "B", "cenario_c": "C", "cenario_d": "D"}
DENSIDADES = ["instancing_n500", "instancing_n2000", "instancing_n5000"]
DENSIDADE_LABEL = {"instancing_n500": "N=500", "instancing_n2000": "N=2000", "instancing_n5000": "N=5000"}


def numero_apos(texto, rotulo):
    for linha in texto.splitlines():
        if linha.startswith(rotulo):
            m = re.search(r"-?[\d.]+", linha[len(rotulo):])
            return float(m.group(0)) if m else None
    return None


RE_ENSAIO_DIR = re.compile(r"^ensaio\d+$")


def listar_arquivos(dir_base):
    base = REPO / dir_base
    if not base.is_dir():
        return []
    arquivos = []
    for ensaio_dir in base.iterdir():
        if not ensaio_dir.is_dir() or not RE_ENSAIO_DIR.match(ensaio_dir.name):
            continue
        for sub_dir in ensaio_dir.iterdir():
            if not sub_dir.is_dir():
                continue
            for arquivo in sub_dir.iterdir():
                if RE_ARQUIVO.match(arquivo.name):
                    arquivos.append(arquivo)
    return arquivos


def carregar_runs():
    """Retorna dict[modo][rotulo] = lista de dicts por repeticao."""
    grupos = {modo: {} for modo in MODOS}
    for modo, dir_base in DIRS.items():
        for caminho in listar_arquivos(dir_base):
            m = RE_ARQUIVO.match(caminho.name)
            _, rotulo, _run = m.groups()
            txt = caminho.read_text(encoding="utf-8")
            caminho_energia = caminho.with_name(caminho.stem + "_energia.txt")
            energia_txt = caminho_energia.read_text(encoding="utf-8") if caminho_energia.exists() else ""
            registro = {
                "frame_time_medio_ms": numero_apos(txt, "Tempo de Frame Medio: "),
                "vram_media_mb": numero_apos(energia_txt, "VRAM Media durante o Ensaio: "),
                "frames_por_watt": numero_apos(energia_txt, "Coeficiente de Eficiencia Medio (Frames por Watt): "),
                "potencia_media_w": numero_apos(energia_txt, "Potencia Media (ponderada pelo tempo, janela de 60s): "),
            }
            grupos[modo].setdefault(rotulo, []).append(registro)
    return grupos


def media_std(grupos, modo, rotulo, campo):
    runs = grupos.get(modo, {}).get(rotulo, [])
    valores = [r[campo] for r in runs if r.get(campo) is not None]
    if not valores:
        return 0.0, 0.0
    media = statistics.fmean(valores)
    desvio = statistics.stdev(valores) if len(valores) > 1 else 0.0
    return media, desvio


def estilo_cientifico():
    plt.rcParams.update({
        "font.family": "serif",
        "font.serif": ["CMU Serif", "STIX Two Text", "Times New Roman", "DejaVu Serif"],
        "mathtext.fontset": "cm",
        "font.size": 10,
        "axes.titlesize": 11,
        "axes.labelsize": 10,
        "xtick.labelsize": 9,
        "ytick.labelsize": 9,
        "legend.fontsize": 9,
        "axes.linewidth": 0.8,
        "axes.edgecolor": "#333333",
        "axes.grid": True,
        "grid.color": "#cccccc",
        "grid.linewidth": 0.5,
        "grid.alpha": 0.7,
        "axes.axisbelow": True,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "figure.dpi": 300,
        "savefig.dpi": 300,
        "savefig.bbox": "tight",
        "errorbar.capsize": 3,
    })


def grafico_barras_agrupadas(ax, categorias, categoria_labels, campo, grupos, ylabel, log=False, legend=True):
    n_modos = len(MODOS)
    largura = 0.8 / n_modos
    x = np.arange(len(categorias))
    for i, modo in enumerate(MODOS):
        medias, desvios = [], []
        for cat in categorias:
            media, desvio = media_std(grupos, modo, cat, campo)
            medias.append(media)
            desvios.append(desvio)
        offset = (i - (n_modos - 1) / 2) * largura
        ax.bar(
            x + offset, medias, largura, yerr=desvios, capsize=3,
            label=MODO_LABEL[modo], color=MODO_COLOR[modo], hatch=MODO_HATCH[modo],
            edgecolor="#333333", linewidth=0.6, error_kw={"elinewidth": 0.8, "ecolor": "#333333"},
        )
    ax.set_xticks(x)
    ax.set_xticklabels([categoria_labels[c] for c in categorias])
    ax.set_ylabel(ylabel)
    if log:
        ax.set_yscale("log")
    if legend:
        ax.legend(
            loc="lower center", bbox_to_anchor=(0.5, 1.02), ncol=4,
            frameon=False, columnspacing=1.2, handletextpad=0.5,
        )


def fig_frametime_cenarios(grupos):
    fig, ax = plt.subplots(figsize=(6.3, 3.6))
    grafico_barras_agrupadas(ax, CENARIOS, CENARIO_LABEL, "frame_time_medio_ms", grupos,
                              "Tempo de Frame Médio (ms)")
    ax.set_xlabel("Cenário (carga de textura crescente)")
    fig.tight_layout()
    fig.savefig(OUT_DIR / "fig_frametime_cenarios.png")
    plt.close(fig)


def fig_vram_cenarios(grupos):
    fig, ax = plt.subplots(figsize=(6.3, 3.6))
    grafico_barras_agrupadas(ax, CENARIOS, CENARIO_LABEL, "vram_media_mb", grupos,
                              "VRAM Média (MB)")
    ax.set_xlabel("Cenário (carga de textura crescente)")
    fig.tight_layout()
    fig.savefig(OUT_DIR / "fig_vram_cenarios.png")
    plt.close(fig)


def fig_cenario_d_colapso(grupos):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.5, 3.4))
    x = np.arange(len(MODOS))
    medias = [media_std(grupos, m, "cenario_d", "frame_time_medio_ms")[0] for m in MODOS]
    desvios = [media_std(grupos, m, "cenario_d", "frame_time_medio_ms")[1] for m in MODOS]
    cores = [MODO_COLOR[m] for m in MODOS]
    hachuras = [MODO_HATCH[m] for m in MODOS]
    bars = ax1.bar(x, medias, yerr=desvios, capsize=3, color=cores, edgecolor="#333333", linewidth=0.6)
    for bar, h in zip(bars, hachuras):
        bar.set_hatch(h)
    ax1.set_xticks(x)
    ax1.set_xticklabels([MODO_LABEL[m] for m in MODOS], rotation=20, ha="right")
    ax1.set_ylabel("Tempo de Frame Médio (ms)")
    ax1.set_title("(a) Médio — escala linear")

    # Tempo de Frame Maximo nao esta no parser principal (nao usado nos demais
    # graficos); le direto dos relatorios brutos so para este grafico de destaque.
    maximos = []
    for m in MODOS:
        vals = []
        for caminho in listar_arquivos(DIRS[m]):
            if RE_ARQUIVO.match(caminho.name).group(2) != "cenario_d":
                continue
            txt = caminho.read_text(encoding="utf-8")
            v = numero_apos(txt, "Tempo de Frame Maximo: ")
            if v is not None:
                vals.append(v)
        maximos.append(statistics.fmean(vals) if vals else 0.0)
    bars2 = ax2.bar(x, maximos, color=cores, edgecolor="#333333", linewidth=0.6)
    for bar, h in zip(bars2, hachuras):
        bar.set_hatch(h)
    ax2.set_xticks(x)
    ax2.set_xticklabels([MODO_LABEL[m] for m in MODOS], rotation=20, ha="right")
    ax2.set_ylabel("Tempo de Frame Máximo (ms)")
    ax2.set_yscale("log")
    ax2.set_title("(b) Máximo — escala logarítmica")

    fig.suptitle("Cenário D — colapso de frame time no WebGPU via Three.js", y=1.03)
    fig.tight_layout()
    fig.savefig(OUT_DIR / "fig_cenario_d_colapso.png")
    plt.close(fig)


def fig_frametime_instancing(grupos):
    fig, ax = plt.subplots(figsize=(6.3, 3.6))
    grafico_barras_agrupadas(ax, DENSIDADES, DENSIDADE_LABEL, "frame_time_medio_ms", grupos,
                              "Tempo de Frame Médio (ms)", log=True)
    ax.set_xlabel("Densidade de instâncias (estresse de Draw Calls)")
    fig.tight_layout()
    fig.savefig(OUT_DIR / "fig_frametime_instancing.png")
    plt.close(fig)


def fig_vram_instancing(grupos):
    fig, ax = plt.subplots(figsize=(6.3, 3.6))
    grafico_barras_agrupadas(ax, DENSIDADES, DENSIDADE_LABEL, "vram_media_mb", grupos,
                              "VRAM Média (MB)")
    ax.set_xlabel("Densidade de instâncias (estresse de Draw Calls)")
    fig.tight_layout()
    fig.savefig(OUT_DIR / "fig_vram_instancing.png")
    plt.close(fig)


def fig_framesporwatt(grupos):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.8, 3.6))
    grafico_barras_agrupadas(ax1, CENARIOS, CENARIO_LABEL, "frames_por_watt", grupos, "Frames por Watt", legend=False)
    ax1.set_xlabel("Cenário (carga de textura)")
    ax1.set_title("(a) Progressão de textura")
    grafico_barras_agrupadas(ax2, DENSIDADES, DENSIDADE_LABEL, "frames_por_watt", grupos, "Frames por Watt", legend=False)
    ax2.set_xlabel("Densidade de instâncias")
    ax2.set_title("(b) Estresse de Draw Calls")
    handles, labels = ax1.get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", bbox_to_anchor=(0.5, 1.0), ncol=4, frameon=False)
    fig.suptitle("Coeficiente de Eficiência Frames/Watt", y=1.14)
    fig.tight_layout()
    fig.savefig(OUT_DIR / "fig_framesporwatt.png")
    plt.close(fig)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    estilo_cientifico()
    grupos = carregar_runs()
    fig_frametime_cenarios(grupos)
    fig_vram_cenarios(grupos)
    fig_cenario_d_colapso(grupos)
    fig_frametime_instancing(grupos)
    fig_vram_instancing(grupos)
    fig_framesporwatt(grupos)
    print(f"Graficos escritos em: {OUT_DIR}")


if __name__ == "__main__":
    main()
