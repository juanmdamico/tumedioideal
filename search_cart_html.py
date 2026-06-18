import sys
import re
sys.stdout.reconfigure(encoding='utf-8')

# Search in templates/index.html
with open('templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find occurrences of text related to prescription, cart, ahorro, obra social, cobertura
print("Matches in index.html:")
for m in re.finditer(r'ahorro|obra social|cobertura|cart|prescription|receta', html, re.IGNORECASE):
    pos = m.start()
    start = max(0, pos - 40)
    end = min(len(html), pos + 100)
    print(f"[{m.group()}]: {html[start:end].strip()}")
    print("-" * 30)
