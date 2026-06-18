import sqlite3
import os

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Search for ACTOS (as seen in manual)
    print("--- Searching for product 'ACTOS' with joins ---")
    query = """
    SELECT 
        m.nro_registro,
        m.nombre,
        m.presentacion,
        m.laboratorio_desc,
        m.precio,
        m.cod_barra,
        md.descripcion as droga_principal,
        af.descripcion as accion_farmacologica,
        f.descripcion as forma_farmaceutica
    FROM manual m
    LEFT JOIN manextra me ON m.nro_registro = me.nro_registro
    LEFT JOIN monodro md ON me.cod_droga = md.codigo
    LEFT JOIN acciofar af ON me.cod_acciofar = af.codigo
    LEFT JOIN formas f ON me.cod_forma = f.codigo
    WHERE m.nombre LIKE 'ACTOS%'
    LIMIT 3
    """
    cursor.execute(query)
    for row in cursor.fetchall():
        print(f"ID: {row[0]} | Name: {row[1]} {row[2]} | Lab: {row[3]} | Price: ${row[4]:.2f} | Barcode: {row[5]} | Drug: {row[6]} | Action: {row[7]} | Form: {row[8]}")
        
    # 2. Get top 5 laboratories by product count
    print("\n--- Top 5 Laboratories by number of products ---")
    query = """
    SELECT laboratorio_desc, COUNT(*) as qty 
    FROM manual 
    GROUP BY laboratorio_desc 
    ORDER BY qty DESC 
    LIMIT 5
    """
    cursor.execute(query)
    for row in cursor.fetchall():
        print(f"Lab: {row[0]:<20} | Products: {row[1]}")
        
    # 3. Find a multi-drug product and its components
    print("\n--- Example of a product with multiple drugs (from multidro) ---")
    # Let's find some multi-drug products
    query = """
    SELECT m.nro_registro, m.nombre, m.presentacion, COUNT(mu.cod_droga) as num_drugs
    FROM manual m
    JOIN multidro mu ON m.nro_registro = mu.nro_registro
    GROUP BY m.nro_registro
    HAVING num_drugs > 1
    LIMIT 3
    """
    cursor.execute(query)
    multi_products = cursor.fetchall()
    
    for prod in multi_products:
        nro_reg, name, pres, num_drugs = prod
        print(f"\nProduct: {name} {pres} (ID: {nro_reg}) has {num_drugs} active ingredients:")
        # Get components from regnueva + nuevadro
        comp_query = """
        SELECT nd.descripcion, r.potencia, u.descripcion
        FROM regnueva r
        JOIN nuevadro nd ON r.cod_droga = nd.codigo
        LEFT JOIN upotenci u ON r.cod_unidad_potencia = u.codigo
        WHERE r.nro_registro = ?
        """
        cursor.execute(comp_query, (nro_reg,))
        for comp in cursor.fetchall():
            print(f"  - Drug: {comp[0]} | Dosis: {comp[1]} {comp[2] or ''}")

    conn.close()

if __name__ == '__main__':
    main()
