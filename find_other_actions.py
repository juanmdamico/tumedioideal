import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Actions for Hypertension ---")
    cursor.execute("SELECT codigo, descripcion FROM acciofar WHERE descripcion LIKE '%hiperten%' OR descripcion LIKE '%tensi%'")
    for row in cursor.fetchall():
        print(f"Code: {row[0]:<4} | Desc: {row[1]}")
        
    print("\n--- Actions for Lipids/Cholesterol ---")
    cursor.execute("SELECT codigo, descripcion FROM acciofar WHERE descripcion LIKE '%lipem%' OR descripcion LIKE '%colest%'")
    for row in cursor.fetchall():
        print(f"Code: {row[0]:<4} | Desc: {row[1]}")
        
    conn.close()

if __name__ == '__main__':
    main()
