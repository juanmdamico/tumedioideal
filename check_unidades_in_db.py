import sqlite3

conn = sqlite3.connect(r"C:\alfabeta\alfabeta.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get sample records of manual
cursor.execute("SELECT unidades, precio FROM manual LIMIT 10")
for r in cursor.fetchall():
    print(dict(r))

# Count where unidades is null or 0
cursor.execute("SELECT count(*) FROM manual WHERE unidades IS NULL OR unidades = 0")
count_zero = cursor.fetchone()[0]

cursor.execute("SELECT count(*) FROM manual")
total = cursor.fetchone()[0]

print(f"Total products: {total}, with zero/null unidades: {count_zero}")
conn.close()
