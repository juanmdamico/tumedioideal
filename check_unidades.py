import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Select some active products
    cursor.execute("""
        SELECT nombre, presentacion, unidades, tamano
        FROM manual
        WHERE baja = 0 AND nombre LIKE 'ACTOS%'
    """)
    for row in cursor.fetchall():
        print(f"Name: {row[0]} | Pres: {row[1]} | Unidades: {row[2]} | Tamano: {row[3]}")
        
    print("\n--- Let's see general stats for 'unidades' field ---")
    cursor.execute("""
        SELECT unidades, COUNT(*)
        FROM manual
        GROUP BY unidades
        ORDER BY COUNT(*) DESC
        LIMIT 15
    """)
    for row in cursor.fetchall():
        print(f"Unidades value: {row[0]} | Count: {row[1]}")
        
    conn.close()

if __name__ == '__main__':
    main()
