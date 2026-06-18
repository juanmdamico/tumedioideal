import sqlite3
import os

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Create tables
    print("Creating mapping tables...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patologias (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patologia_accion (
        cod_patologia INTEGER,
        cod_acciofar INTEGER,
        PRIMARY KEY (cod_patologia, cod_acciofar),
        FOREIGN KEY (cod_patologia) REFERENCES patologias(id),
        FOREIGN KEY (cod_acciofar) REFERENCES acciofar(codigo)
    )""")
    conn.commit()
    
    # 2. Insert master pathologies
    print("Inserting pathologies...")
    patologias_data = [
        (1, "Diabetes Mellitus", "Condición que afecta la regulación de la glucosa en sangre."),
        (2, "Hipertensión Arterial", "Presión arterial elevada sistémica."),
        (3, "Dislipidemia / Colesterol", "Niveles elevados de lípidos y colesterol en sangre.")
    ]
    cursor.executemany("INSERT OR REPLACE INTO patologias VALUES (?,?,?)", patologias_data)
    conn.commit()
    
    # 3. Define action mappings
    print("Mapping pharmacological actions to pathologies...")
    # Diabetes: Codes related to glucose control, antidiabetics, hypoglycemics, neuropathy, insulin applicators
    diabetes_actions = [7, 54, 98, 103, 154, 299, 325, 328, 480, 640, 711, 905]
    
    # Hypertension: Codes related to antihypertensives, beta-blockers, combinations
    hypertension_actions = [180, 356, 380, 515, 659, 803, 892]
    
    # Dislipidemia: Codes related to lipid-lowering, cholesterol absorption inhibitors, combinations
    lipid_actions = [7, 33, 101, 102, 545, 640, 659, 786, 835, 892, 1123]
    
    mappings = []
    for act in diabetes_actions:
        mappings.append((1, act))
    for act in hypertension_actions:
        mappings.append((2, act))
    for act in lipid_actions:
        mappings.append((3, act))
        
    cursor.executemany("INSERT OR REPLACE INTO patologia_accion VALUES (?,?)", mappings)
    conn.commit()
    
    # 4. Run verification query: Count of active products per pathology
    print("\n--- Summary: Active products per Pathology ---")
    query = """
    SELECT 
        p.id,
        p.nombre,
        COUNT(DISTINCT m.nro_registro) as total_productos,
        COUNT(DISTINCT me.cod_droga) as total_drogas
    FROM patologias p
    JOIN patologia_accion pa ON p.id = pa.cod_patologia
    JOIN manextra me ON pa.cod_acciofar = me.cod_acciofar
    JOIN manual m ON me.nro_registro = m.nro_registro
    WHERE m.baja = 0
    GROUP BY p.id
    ORDER BY total_productos DESC
    """
    cursor.execute(query)
    for row in cursor.fetchall():
        print(f"Pathology {row[0]}: {row[1]:<25} | Active Products: {row[2]:<5} | Unique Drugs: {row[3]}")
        
    # 5. Show sample products for Hypertension
    print("\n--- Sample products for 'Hipertensión Arterial' ---")
    sample_query = """
    SELECT m.nombre, m.presentacion, md.descripcion as droga, a.descripcion as accion
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    JOIN monodro md ON me.cod_droga = md.codigo
    JOIN acciofar a ON me.cod_acciofar = a.codigo
    JOIN patologia_accion pa ON a.codigo = pa.cod_acciofar
    WHERE m.baja = 0 AND pa.cod_patologia = 2 -- Hipertensión
    LIMIT 3
    """
    cursor.execute(sample_query)
    for row in cursor.fetchall():
        print(f"Product: {row[0]} {row[1]} | Drug: {row[2]} | Action: {row[3]}")
        
    conn.close()

if __name__ == '__main__':
    main()
