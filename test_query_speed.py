import sqlite3
import time

def run():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
    SELECT 
        m.nro_registro,
        m.nombre as brand_name,
        m.presentacion as pres_orig,
        m.laboratorio_desc as lab_name,
        m.precio as price,
        m.fecha as price_date,
        md.descripcion as drug_name,
        a.descripcion as action_name,
        me.potencia,
        up.descripcion as unidad_potencia,
        f.descripcion as forma_farmaceutica,
        m.unidades,
        m.troquel,
        m.tipo_venta,
        s.idsnomed as snomed_id,
        sd.term as snomed_term,
        sp.parent_id as snomed_parent_id,
        sp.parent_term as snomed_parent_term,
        m.importado,
        m.heladera,
        m.marca_controlado
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
    ORDER BY a.descripcion, md.descripcion, me.potencia, m.unidades, m.precio ASC
    """
    
    print("Running query...")
    start_time = time.time()
    cursor.execute(query)
    rows = cursor.fetchall()
    end_time = time.time()
    
    print(f"Query completed in {end_time - start_time:.4f} seconds.")
    print(f"Fetched {len(rows)} rows.")
    conn.close()

if __name__ == '__main__':
    run()
