import sqlite3
import json
import time

def run():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
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
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    start_time = time.time()
    products = []
    for r in rows:
        act_name = r["action_name"].strip().upper() if r["action_name"] else "SIN ACCIÓN DEFINIDA"
        drug_name = r["drug_name"].strip().capitalize() if r["drug_name"] else "Sin Droga"
        
        products.append({
            "nro_registro": r["nro_registro"],
            "brand_name": r["brand_name"].strip(),
            "pres_orig": r["pres_orig"].strip(),
            "lab_name": r["lab_name"].strip(),
            "price": r["price"],
            "price_date": r["price_date"].strip() if r["price_date"] else "",
            "drug_name": drug_name,
            "action_name": act_name,
            "potencia": r["potencia"].strip() if r["potencia"] else "",
            "unidad_potencia": r["unidad_potencia"].strip() if r["unidad_potencia"] else "",
            "forma_farmaceutica": r["forma_farmaceutica"].strip() if r["forma_farmaceutica"] else "",
            "unidades": r["unidades"],
            "troquel": r["troquel"].strip() if r["troquel"] else "",
            "tipo_venta": r["tipo_venta"].strip() if r["tipo_venta"] else "",
            "snomed_id": r["snomed_id"].strip() if r["snomed_id"] else "",
            "snomed_term": r["snomed_term"].strip() if r["snomed_term"] else "",
            "snomed_parent_id": r["snomed_parent_id"].strip() if r["snomed_parent_id"] else "",
            "snomed_parent_term": r["snomed_parent_term"].strip() if r["snomed_parent_term"] else "",
            "importado": r["importado"] if r["importado"] is not None else 0,
            "heladera": r["heladera"] if r["heladera"] is not None else 0,
            "marca_controlado": r["marca_controlado"].strip() if r["marca_controlado"] else "0"
        })
        
    json_data = json.dumps(products)
    end_time = time.time()
    
    print(f"Serialized to JSON in {end_time - start_time:.4f} seconds.")
    print(f"JSON data size: {len(json_data) / (1024 * 1024):.2f} MB")
    
    conn.close()

if __name__ == '__main__':
    run()
