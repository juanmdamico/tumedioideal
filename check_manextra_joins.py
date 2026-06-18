import sqlite3
import os

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Query joining manextra with all related lookup tables
    query = """
    SELECT 
        m.nro_registro,
        m.nombre as nombre_comercial,
        m.presentacion as pres_manual,
        me.potencia as potencia_valor,
        up.descripcion as unidad_potencia,
        f.descripcion as forma_farmaceutica,
        t.descripcion as tamaño_relativo,
        tu.descripcion as tipo_unidad,
        v.descripcion as via_administracion,
        md.descripcion as droga,
        af.descripcion as accion
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    LEFT JOIN tamanos t ON me.cod_tamano_relativo = t.codigo
    LEFT JOIN acciofar af ON me.cod_acciofar = af.codigo
    LEFT JOIN monodro md ON me.cod_droga = md.codigo
    LEFT JOIN formas f ON me.cod_forma = f.codigo
    LEFT JOIN upotenci up ON me.cod_unidad_potencia = up.codigo
    LEFT JOIN tipounid tu ON me.cod_tipo_unidades = tu.codigo
    LEFT JOIN vias v ON me.cod_via_admin = v.codigo
    WHERE m.baja = 0 AND af.codigo = 328 -- Hipoglucemiante oral
    LIMIT 3
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    for row in rows:
        nro_reg, name, pres, pot, unit, form, size, tu, via, drug, action = row
        print(f"Producto: {name} ({pres})")
        print(f"  - Acción: {action}")
        print(f"  - Droga Principal: {drug}")
        print(f"  - Potencia: {pot} {unit or ''}")
        print(f"  - Forma: {form}")
        print(f"  - Vía Admin: {via}")
        print(f"  - Tamaño Relativo: {size}")
        print(f"  - Tipo Unidad: {tu}")
        print("-" * 50)
        
    conn.close()

if __name__ == '__main__':
    main()
