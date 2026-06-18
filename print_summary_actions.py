import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(810, min(840, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end='')
