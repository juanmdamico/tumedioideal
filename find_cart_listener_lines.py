import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'prescriptionBody.addEventListener' in line:
        print(f"Starts at line {idx+1}")
        for i in range(idx-2, idx+15):
            print(f"{i+1}: {lines[i]}", end='')
        break
