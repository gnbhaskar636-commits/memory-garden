import os

filepath = r"C:\Users\pc\Downloads\memory-garden-final\memory-garden\src\routes\memories.index.tsx"
with open(filepath, "r") as f:
    content = f.read()

replacements = [
    ('@"/components/garden/empty-garden', '"./components/garden/empty-garden'),
    ('@"/components/memory/memory-card', '"./components/memory/memory-card'),
    ('@"/components/memory/mood-tag', '"./components/memory/mood-tag'),
    ('@"/components/ui/button', '"./components/ui/button'),
    ('@"/components/ui/input', '"./components/ui/input'),
    ('@"/components/ui/label', '"./components/ui/label'),
    ('@"/components/ui/switch', '"./components/ui/switch'),
    ('@"/lib/memories/types', '"./lib/memories/types'),
    ('@"/lib/memories/store', '"./lib/memories/store'),
    ('@"/lib/utils', '"./lib/utils'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, "w") as f:
    f.write(content)

print("Done fixing", filepath)