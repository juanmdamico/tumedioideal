import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

total = len(lines)
for idx in range(max(0, total - 30), total):
    print(f"{idx+1}: {lines[idx]}", end='')
