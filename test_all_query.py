import sqlite3

def run():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
    SELECT COUNT(*)
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    LEFT JOIN monodro md ON me.cod_droga = md.codigo
    LEFT JOIN acciofar a ON me.cod_acciofar = a.codigo
    LEFT JOIN formas f ON me.cod_forma = f.codigo
    LEFT JOIN upotenci up ON me.cod_unidad_potencia = up.codigo
    LEFT JOIN snomed s ON m.nro_registro = s.nro_registro
    LEFT JOIN snomed_descriptions sd ON s.idsnomed = sd.concept_id
    LEFT JOIN snomed_parent_concepts sp ON s.idsnomed = sp.concept_id
    WHERE m.baja = 0 AND m.precio > 0
    """
    cursor.execute(query)
    count = cursor.fetchone()[0]
    print("Total active products in 'all' query:", count)
    conn.close()

if __name__ == '__main__':
    run()
