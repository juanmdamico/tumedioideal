import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    actions = [7, 54, 103, 299, 325, 328, 480, 905]
    print("--- Counting ACTIVE products (baja = 0) per action code ---")
    total_active = 0
    for act in actions:
        cursor.execute("""
            SELECT a.descripcion, COUNT(DISTINCT m.nro_registro)
            FROM manual m
            JOIN manextra me ON m.nro_registro = me.nro_registro
            JOIN acciofar a ON me.cod_acciofar = a.codigo
            WHERE a.codigo = ? AND m.baja = 0
        """, (act,))
        desc, count = cursor.fetchone()
        total_active += count
        print(f"Action Code: {act:<4} | Desc: {desc:<30} | Active Count: {count}")
    print(f"Total active products: {total_active}")
    
    conn.close()

if __name__ == '__main__':
    main()
