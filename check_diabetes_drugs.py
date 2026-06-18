import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
    SELECT a.descripcion as accion, md.descripcion as droga, COUNT(*) as cnt
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    JOIN acciofar a ON me.cod_acciofar = a.codigo
    JOIN monodro md ON me.cod_droga = md.codigo
    WHERE m.baja = 0 AND a.codigo IN (98, 103, 299, 328, 480, 905)
    GROUP BY a.codigo, md.codigo
    ORDER BY a.codigo, cnt DESC
    """
    cursor.execute(query)
    for row in cursor.fetchall():
        print(f"Action: {row[0]:<25} | Drug: {row[1]:<30} | Active Count: {row[2]}")
        
    conn.close()

if __name__ == '__main__':
    main()
