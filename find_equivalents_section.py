import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'function openMedicineDetail' in line:
        print(f"Starts at line {idx+1}")
        # Print next 60 lines
        for i in range(idx, min(idx + 180, len(lines))):
            if 'equivalents.forEach' in lines[i] or 'snomedEquivalentsBody' in lines[i]:
                print(f"Found equivalents section around line {i+1}:")
                for j in range(max(idx, i - 15), min(i + 80, len(lines))):
                    print(f"{j+1}: {lines[j]}", end='')
                break
        break
