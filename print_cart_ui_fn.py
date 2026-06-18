import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re
match = re.search(r'function updatePrescriptionCartUI\(\)', content)
if match:
    start_pos = match.start()
    # Print 200 lines from start_pos
    lines = content[start_pos:].split('\n')
    for idx, line in enumerate(lines[:250]):
        # Let's count real line number in file
        line_num = content[:start_pos].count('\n') + idx + 1
        print(f"{line_num}: {line}")
else:
    print("Function updatePrescriptionCartUI not found")
