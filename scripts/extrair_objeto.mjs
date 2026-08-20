import { NodeIO } from "@gltf-transform/core";
import { KHRMaterialsSpecular, KHRTextureTransform } from "@gltf-transform/extensions";
import { prune, dedup } from "@gltf-transform/functions";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--fonte":
        opts.fonte = next();
        break;
      case "--nodes":
        opts.nodes = next().split(",").map((s) => s.trim());
        break;
      case "--saida":
        opts.saida = next();
        break;
      default:
        console.error(`[extrair_objeto] Opcao desconhecida: ${arg}`);
        process.exit(1);
    }
  }
  if (!opts.fonte || !opts.nodes || !opts.saida) {
    console.error(
      "[extrair_objeto] Uso: node scripts/extrair_objeto.mjs --fonte <origem.glb> " +
      "--nodes \"Nome1,Nome2\" --saida <destino.glb>"
    );
    process.exit(1);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const io = new NodeIO().registerExtensions([KHRMaterialsSpecular, KHRTextureTransform]);

  console.log(`[extrair_objeto] Lendo ${opts.fonte}...`);
  const document = await io.read(opts.fonte);
  const root = document.getRoot();

  const scenes = root.listScenes();
  if (scenes.length !== 1) {
    console.error(`[extrair_objeto] Esperava 1 scene, encontrei ${scenes.length}.`);
    process.exit(1);
  }
  const scene = scenes[0];
  const sceneChildren = scene.listChildren();
  if (sceneChildren.length !== 1) {
    console.error(
      `[extrair_objeto] Esperava 1 node raiz na scene (grupo de conversao Blender), ` +
      `encontrei ${sceneChildren.length}. Ajuste o script se a estrutura mudou.`
    );
    process.exit(1);
  }
  const grupoRaiz = sceneChildren[0];
  console.log(`[extrair_objeto] Grupo raiz: "${grupoRaiz.getName()}" (${grupoRaiz.listChildren().length} filhos)`);

  const nomesAlvo = new Set(opts.nodes);
  const encontrados = new Set();
  for (const child of grupoRaiz.listChildren()) {
    if (nomesAlvo.has(child.getName())) {
      encontrados.add(child.getName());
    } else {
      grupoRaiz.removeChild(child);
    }
  }

  const faltando = [...nomesAlvo].filter((n) => !encontrados.has(n));
  if (faltando.length > 0) {
    console.error(`[extrair_objeto] Node(s) nao encontrado(s) no grupo raiz: ${faltando.join(", ")}`);
    process.exit(1);
  }

  console.log(`[extrair_objeto] Mantidos: ${[...encontrados].join(", ")}`);

  await document.transform(
    prune(),
    dedup(),
  );

  mkdirSync(dirname(opts.saida), { recursive: true });
  await io.write(opts.saida, document);

  console.log(`[extrair_objeto] Salvo em: ${opts.saida}`);
}

main().catch((err) => {
  console.error("[extrair_objeto] Erro fatal:", err);
  process.exit(1);
});
