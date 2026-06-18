import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = [m.start() for m in re.finditer(r'coberturaPorcentaje|cobertura', content)]
for idx, pos in enumerate(matches):
    start = max(0, pos - 100)
    end = min(len(content), pos + 1000)
    print(f"Match {idx+1} at index {pos}:")
    print(content[start:end])
    print("-" * 50)
