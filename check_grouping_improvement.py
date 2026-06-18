import sqlite3

def clean_form(form):
    if not form:
        return ""
    form_lower = form.lower()
    if "comprimidos/pastillas" in form_lower:
        return "comp."
    if "liberación controlada" in form_lower or "liberacion controlada" in form_lower:
        return "comp. lib. prol."
    if "cápsulas/globulos" in form_lower or "capsulas" in form_lower:
        return "cáps."
    if "líquidos/soluciones" in form_lower or "jarabes" in form_lower:
        return "sol."
    if "inyectables" in form_lower:
        return "iny."
    return form_lower

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
    SELECT 
        a.descripcion as action_name,
        md.descripcion as drug_name,
        m.presentacion as pres_orig,
        me.potencia,
        up.descripcion as unidad,
        f.descripcion as forma,
        m.unidades
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    JOIN acciofar a ON me.cod_acciofar = a.codigo
    JOIN monodro md ON me.cod_droga = md.codigo
    LEFT JOIN formas f ON me.cod_forma = f.codigo
    LEFT JOIN upotenci up ON me.cod_unidad_potencia = up.codigo
    WHERE m.baja = 0 AND m.precio > 0 AND a.codigo IN (98, 103, 299, 328, 480, 905)
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    
    orig_groups = set()
    new_groups = set()
    
    for row in rows:
        action, drug, pres_orig, pot, unit, form, units = row
        
        # Original grouping key
        orig_key = (action, drug, pres_orig.strip())
        orig_groups.add(orig_key)
        
        # Composed grouping key
        form_clean = clean_form(form)
        composed_pres = f"{pot or ''} {unit or ''} {form_clean} x {units or ''}".strip()
        new_key = (action, drug, composed_pres)
        new_groups.add(new_key)
        
    print(f"Total active records: {len(rows)}")
    print(f"Unique presentations using ORIGINAL strings: {len(orig_groups)}")
    print(f"Unique presentations using COMPOSED strings: {len(new_groups)}")
    print(f"Difference: {len(orig_groups) - len(new_groups)} groups consolidated.")
    
    conn.close()

if __name__ == '__main__':
    main()
