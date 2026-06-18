with open(r"c:\Users\Juanma\.gemini\antigravity\scratch\alfabeta\static\app.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "noResultsView" in line:
        print(f"Line {i+1}: {line.strip()}")
