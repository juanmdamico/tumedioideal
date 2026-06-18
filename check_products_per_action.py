import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    actions = [7, 54, 103, 299, 325, 328, 480, 905]
    print("--- Counting products per action code ---")
    for act in actions:
        cursor.execute("""
            SELECT a.descripcion, COUNT(DISTINCT m.nro_registro)
            FROM manual m
            JOIN manextra me ON m.nro_registro = me.nro_registro
            JOIN acciofar a ON me.cod_acciofar = a.codigo
            WHERE a.codigo = ?
        """, (act,))
        desc, count = cursor.fetchone()
        print(f"Action Code: {act:<4} | Desc: {desc:<30} | Product Count: {count}")
        
    conn.close()

if __name__ == '__main__':
    main()
