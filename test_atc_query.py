import sqlite3

def run():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Test R03
    cursor.execute("""
        SELECT COUNT(*) 
        FROM manual m 
        JOIN atc ON m.nro_registro = atc.nro_registro 
        WHERE m.baja = 0 AND m.precio > 0 AND atc.cod_atc LIKE 'R03%'
    """)
    print("R03 count:", cursor.fetchone()[0])

    # Test R03AC
    cursor.execute("""
        SELECT COUNT(*) 
        FROM manual m 
        JOIN atc ON m.nro_registro = atc.nro_registro 
        WHERE m.baja = 0 AND m.precio > 0 AND atc.cod_atc LIKE 'R03AC%'
    """)
    print("R03AC count:", cursor.fetchone()[0])
    
    # Let's print some sample rows
    cursor.execute("""
        SELECT m.nombre, atc.cod_atc 
        FROM manual m 
        JOIN atc ON m.nro_registro = atc.nro_registro 
        WHERE m.baja = 0 AND m.precio > 0 AND atc.cod_atc LIKE 'R03%'
        LIMIT 5
    """)
    print("R03 samples:", cursor.fetchall())
    
    conn.close()

if __name__ == '__main__':
    run()
