import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'function updatePrescriptionCartUI' in line:
        print(f"updatePrescriptionCartUI starts at line {idx+1}")
    if 'function printPrescription' in line:
        print(f"printPrescription starts at line {idx+1}")
