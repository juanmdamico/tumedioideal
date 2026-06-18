import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Searching for actions containing 'diab' ---")
    cursor.execute("SELECT codigo, descripcion FROM acciofar WHERE descripcion LIKE '%diab%'")
    for row in cursor.fetchall():
        print(f"Code: {row[0]} | Desc: {row[1]}")
        
    print("\n--- Searching for actions containing 'gluc' ---")
    cursor.execute("SELECT codigo, descripcion FROM acciofar WHERE descripcion LIKE '%gluc%'")
    for row in cursor.fetchall():
        print(f"Code: {row[0]} | Desc: {row[1]}")
        
    print("\n--- Searching for actions containing 'insul' ---")
    cursor.execute("SELECT codigo, descripcion FROM acciofar WHERE descripcion LIKE '%insul%'")
    for row in cursor.fetchall():
        print(f"Code: {row[0]} | Desc: {row[1]}")

    conn.close()

if __name__ == '__main__':
    main()
