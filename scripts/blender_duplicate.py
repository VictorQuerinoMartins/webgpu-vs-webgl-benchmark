import bpy
import re

# Padrão para encontrar nomes que terminam com .001, .002, etc.
# O regex r"\.\d{3}$" procura um ponto seguido de 3 dígitos no final da string.
pattern = re.compile(r"\.\d{3}$")

# Lista para armazenar objetos que serão removidos
to_remove = []

for obj in bpy.data.objects:
    if pattern.search(obj.name):
        to_remove.append(obj)

# Deleta os objetos encontrados
count = len(to_remove)
for obj in to_remove:
    bpy.data.objects.remove(obj, do_unlink=True)

print(f"Sucesso: {count} objetos duplicados foram removidos.")