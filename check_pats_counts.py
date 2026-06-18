import sqlite3

def run():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, nombre FROM patologias")
    pats = cursor.fetchall()
    
    for pat_id, name in pats:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM manual m
            JOIN manextra me ON m.nro_registro = me.nro_registro
            JOIN monodro md ON me.cod_droga = md.codigo
            JOIN acciofar a ON me.cod_acciofar = a.codigo
            JOIN patologia_accion pa ON a.codigo = pa.cod_acciofar
            WHERE m.baja = 0 AND m.precio > 0 AND pa.cod_patologia = ?
        """, (pat_id,))
        count = cursor.fetchone()[0]
        
        # Unique drugs
        cursor.execute("""
            SELECT COUNT(DISTINCT me.cod_droga)
            FROM manual m
            JOIN manextra me ON m.nro_registro = me.nro_registro
            JOIN monodro md ON me.cod_droga = md.codigo
            JOIN acciofar a ON me.cod_acciofar = a.codigo
            JOIN patologia_accion pa ON a.codigo = pa.cod_acciofar
            WHERE m.baja = 0 AND m.precio > 0 AND pa.cod_patologia = ?
        """, (pat_id,))
        drugs = cursor.fetchone()[0]
        
        # Unique actions
        cursor.execute("""
            SELECT COUNT(DISTINCT me.cod_acciofar)
            FROM manual m
            JOIN manextra me ON m.nro_registro = me.nro_registro
            JOIN monodro md ON me.cod_droga = md.codigo
            JOIN acciofar a ON me.cod_acciofar = a.codigo
            JOIN patologia_accion pa ON a.codigo = pa.cod_acciofar
            WHERE m.baja = 0 AND m.precio > 0 AND pa.cod_patologia = ?
        """, (pat_id,))
        actions = cursor.fetchone()[0]
        
        print(f"Patology {pat_id} ({name}): Products: {count}, Drugs: {drugs}, Actions: {actions}")
        
    conn.close()

if __name__ == '__main__':
    run()
