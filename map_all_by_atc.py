import sqlite3
import os

# Define the dictionary of ATC prefix to human-readable pathology
ATC_MAP = {
    # Level 2 or 3 prefixes (3 chars)
    "A02": ("Reflujo, Acidez y Úlceras (Gastrointestinal)", "Tratamiento de acidez gástrica, reflujo y úlceras."),
    "A10": ("Diabetes Mellitus", "Medicamentos para control de glucosa e insulinas."),
    "B01": ("Antitrombóticos / Anticoagulantes", "Prevención y tratamiento de trombos."),
    "C01": ("Terapia Cardíaca", "Tratamiento de insuficiencia cardíaca, arritmias y anginas."),
    "C02": ("Hipertensión Arterial", "Medicamentos para presión arterial elevada."),
    "C03": ("Hipertensión Arterial / Retención de Líquidos", "Diuréticos para presión y edemas."),
    "C07": ("Hipertensión Arterial / Cardiopatías (Beta-bloqueantes)", "Agentes beta-bloqueantes cardiovascular."),
    "C08": ("Hipertensión Arterial (Antagonistas de Calcio)", "Bloqueantes de canales de calcio."),
    "C09": ("Hipertensión Arterial (Sistema Renina-Angiotensina)", "Inhibidores IECA y ARA II."),
    "C10": ("Hipercolesterolemia y Dislipidemia", "Estatinas y reguladores de lípidos en sangre."),
    "G03": ("Hormonas Sexuales / Ginecología", "Anticonceptivos y terapia de reemplazo hormonal."),
    "G04": ("Urología y Afecciones Prostáticas", "Tratamiento de próstata y disfunción eréctil."),
    "H03": ("Terapia Tiroidea", "Tratamiento de hipotiroidismo e hipertiroidismo."),
    "J01": ("Infecciones Bacterianas (Antibióticos)", "Antibacterianos para uso sistémico."),
    "J05": ("Infecciones Virales (Antivirales)", "Antivirales sistémicos."),
    "L01": ("Oncología / Cáncer", "Agentes antineoplásicos para el cáncer."),
    "L02": ("Terapia Endocrina Oncológica", "Hormonas para tratamiento oncológico."),
    "M01": ("Dolor e Inflamación Musculoesquelética (AINEs)", "Antiinflamatorios no esteroideos."),
    "N02": ("Dolor y Analgesia", "Analgésicos y antipiréticos."),
    "N03": ("Epilepsia y Convulsiones", "Antiepilépticos."),
    "N05": ("Ansiedad, Insomnio y Psicosis (Salud Mental)", "Ansiolíticos, hipnóticos y antipsicóticos."),
    "N06": ("Depresión y Trastornos Afectivos (Salud Mental)", "Antidepresivos y psicoestimulantes."),
    "R01": ("Congestión y Alergias Nasales", "Preparaciones nasales."),
    "R03": ("Asma y EPOC", "Antiasmáticos y broncodilatadores."),
    "R05": ("Tos y Resfrío", "Antitusivos y expectorantes."),
    
    # Fallbacks for Level 1 prefixes (1 char)
    "A": ("Salud Digestiva y Nutrición (Otros)", "Suplementos digestivos, vitaminas y otros del sistema digestivo."),
    "B": ("Hematología / Afecciones de la Sangre (Otros)", "Antianémicos y otros tratamientos de la sangre."),
    "C": ("Cardiovascular (Otros)", "Otros fármacos cardiovasculares."),
    "D": ("Dermatología", "Preparaciones de uso dermatológico."),
    "G": ("Salud Genitourinaria (Otros)", "Otros fármacos genitourinarios."),
    "H": ("Hormonas Sistémicas (excl. Insulinas y Sexuales)", "Corticoides sistémicos y hormonas hipofisarias."),
    "J": ("Infecciones Sistémicas (Otros)", "Vacunas, sueros y antifúngicos sistémicos."),
    "L": ("Inmunología / Inmunomoduladores", "Inmunosupresores e inmunoestimulantes."),
    "M": ("Sistema Musculoesquelético (Otros)", "Relajantes musculares y preparados para articulaciones."),
    "N": ("Sistema Nervioso (Otros)", "Anestésicos y otros del sistema nervioso."),
    "P": ("Antiparasitarios", "Antiprotozoarios y antihelmínticos."),
    "R": ("Sistema Respiratorio (Otros)", "Antihistamínicos y otros respiratorios."),
    "S": ("Oftalmología y Otología", "Tratamientos oculares y óticos."),
    "V": ("Varios / Agentes de Diagnóstico", "Contrasts, alérgenos y otros no clasificados.")
}

def main():
    db_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO\alfabeta.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Recreate tables
    print("Re-creating mapping tables...")
    cursor.execute("DROP TABLE IF EXISTS patologia_accion")
    cursor.execute("DROP TABLE IF EXISTS patologias")
    
    cursor.execute("""
    CREATE TABLE patologias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        atc_key TEXT UNIQUE,
        nombre TEXT NOT NULL,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE patologia_accion (
        cod_patologia INTEGER,
        cod_acciofar INTEGER,
        PRIMARY KEY (cod_patologia, cod_acciofar),
        FOREIGN KEY (cod_patologia) REFERENCES patologias(id),
        FOREIGN KEY (cod_acciofar) REFERENCES acciofar(codigo)
    )""")
    conn.commit()
    
    # 2. Insert master pathologies from the map
    print("Inserting master pathologies from ATC categories...")
    for key, (name, desc) in ATC_MAP.items():
        cursor.execute("INSERT INTO patologias (atc_key, nombre, descripcion) VALUES (?, ?, ?)", (key, name, desc))
    conn.commit()
    
    # 3. Read active products and their ATC codes to link acciofar to pathologies
    print("Analyzing database relations to link actions to pathologies...")
    query = """
    SELECT DISTINCT me.cod_acciofar, a.cod_atc
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    JOIN atc a ON m.nro_registro = a.nro_registro
    WHERE m.baja = 0 AND a.cod_atc IS NOT NULL AND a.cod_atc != ''
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    
    # To keep track of mappings to insert
    mappings_to_insert = set() # (cod_patologia, cod_acciofar)
    
    # Fetch all pathology IDs from DB
    cursor.execute("SELECT id, atc_key FROM patologias")
    pat_id_map = {atc_key: pid for pid, atc_key in cursor.fetchall()}
    
    for row in rows:
        cod_acciofar, cod_atc = row
        cod_atc = cod_atc.strip().upper()
        
        # Match ATC to our map keys (first check 3-character prefix, then 1-character prefix)
        prefix_3 = cod_atc[0:3]
        prefix_1 = cod_atc[0]
        
        target_key = None
        if prefix_3 in pat_id_map:
            target_key = prefix_3
        elif prefix_1 in pat_id_map:
            target_key = prefix_1
            
        if target_key:
            pid = pat_id_map[target_key]
            mappings_to_insert.add((pid, cod_acciofar))
            
    # Insert mappings
    print(f"Inserting {len(mappings_to_insert)} unique action-to-pathology links...")
    cursor.executemany("INSERT INTO patologia_accion VALUES (?, ?)", list(mappings_to_insert))
    conn.commit()
    
    # 4. Run verification and show counts
    print("\n--- Summary: Active Products & Unique Drugs per Pathology (ATC-mapped) ---")
    summary_query = """
    SELECT 
        p.nombre,
        p.atc_key,
        COUNT(DISTINCT m.nro_registro) as total_productos,
        COUNT(DISTINCT me.cod_droga) as total_drogas
    FROM patologias p
    JOIN patologia_accion pa ON p.id = pa.cod_patologia
    JOIN manextra me ON pa.cod_acciofar = me.cod_acciofar
    JOIN manual m ON me.nro_registro = m.nro_registro
    WHERE m.baja = 0
    GROUP BY p.id
    HAVING total_productos > 0
    ORDER BY total_productos DESC
    """
    cursor.execute(summary_query)
    results = cursor.fetchall()
    
    for idx, row in enumerate(results):
        name, atc_key, products, drugs = row
        print(f"{idx+1:<2}. {name:<55} ({atc_key:<3}) | Products: {products:<5} | Drugs: {drugs}")
        
    # Check total actions mapped
    cursor.execute("SELECT COUNT(DISTINCT cod_acciofar) FROM patologia_accion")
    mapped_actions = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT cod_acciofar) FROM manextra JOIN manual ON manextra.nro_registro = manual.nro_registro WHERE manual.baja = 0")
    active_actions = cursor.fetchone()[0]
    print(f"\nSuccessfully mapped {mapped_actions} out of {active_actions} active pharmacological actions ({mapped_actions/active_actions*100:.1f}%).")
    
    conn.close()

if __name__ == '__main__':
    main()
