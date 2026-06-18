import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

js_path = os.path.join('static', 'app.js')
with open(js_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = 1180
end = 1280

for idx in range(start - 1, min(end, len(lines))):
    line = lines[idx]
    sys.stdout.buffer.write(f"{idx + 1}: {line}".encode('utf-8'))
