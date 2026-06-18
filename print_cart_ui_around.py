import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('static/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re
match = re.search(r'function updatePrescriptionCartUI\(\)', content)
if match:
    start_pos = match.start()
    # Let's print 80 lines before and 200 lines after
    lines = content[start_pos-300:start_pos+3000].split('\n')
    for idx, line in enumerate(lines):
        line_num = content[:start_pos-300].count('\n') + idx + 1
        print(f"{line_num}: {line}")
