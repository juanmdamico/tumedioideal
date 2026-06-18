import os

app_path = 'app.py'
with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'ORDER BY' in line or 'order_by' in line or '.sort(' in line:
        print(f"Line {idx+1}: {line.strip()}")
