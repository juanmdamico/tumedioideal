import sqlite3

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
    SELECT 
        m.nombre,
        m.presentacion,
        me.potencia,
        up.descripcion as unidad,
        f.descripcion as forma,
        m.unidades,
        t.descripcion as tamano_rel
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    LEFT JOIN formas f ON me.cod_forma = f.codigo
    LEFT JOIN upotenci up ON me.cod_unidad_potencia = up.codigo
    LEFT JOIN tamanos t ON me.cod_tamano_relativo = t.codigo
    WHERE m.baja = 0 AND m.nombre LIKE 'METFORMIN%'
    LIMIT 20
    """
    cursor.execute(query)
    for row in cursor.fetchall():
        name, pres_orig, pot, unit, form, units, tamano_rel = row
        # Compose a standardized presentation
        # E.g. "850 mg comprimidos x 30"
        composed = f"{pot or ''} {unit or ''} {form or ''} x {units or ''}".strip()
        print(f"Name: {name}")
        print(f"  - Original:  {pres_orig}")
        print(f"  - Composed:  {composed} (Tamaño: {tamano_rel})")
        print("-" * 50)
        
    conn.close()

if __name__ == '__main__':
    main()
