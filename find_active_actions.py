import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
    SELECT a.codigo, a.descripcion, COUNT(m.nro_registro) as cnt
    FROM acciofar a
    JOIN manextra me ON a.codigo = me.cod_acciofar
    JOIN manual m ON me.nro_registro = m.nro_registro
    WHERE m.baja = 0
      AND (
          a.descripcion LIKE '%diab%' 
          OR a.descripcion LIKE '%gluc%' 
          OR a.descripcion LIKE '%insul%'
          OR a.descripcion LIKE '%control%'
      )
    GROUP BY a.codigo, a.descripcion
    ORDER BY cnt DESC
    """
    cursor.execute(query)
    for row in cursor.fetchall():
        print(f"Code: {row[0]:<4} | Desc: {row[1]:<35} | Active Count: {row[2]}")
        
    conn.close()

if __name__ == '__main__':
    main()
