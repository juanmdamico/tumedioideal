import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(169, min(185, len(lines))):
    sys.stdout.buffer.write(f"{idx+1}: {lines[idx]}".encode('utf-8'))
