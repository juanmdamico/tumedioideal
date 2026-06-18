import os
import sqlite3
import time

def clean_str(val):
    if not val:
        return ""
    return val.decode('cp850').strip()

def clean_int(val):
    s = clean_str(val)
    if not s or not s.isdigit():
        return None
    return int(s)

def clean_price(val):
    s = clean_str(val)
    if not s or not s.isdigit():
        return 0.0
    return float(s) / 100.0

def import_table(conn, table_name, file_path, record_len, insert_query, row_parser):
    print(f"Importing {table_name} from {os.path.basename(file_path)}...")
    
    if not os.path.exists(file_path):
        print(f"  WARNING: File {file_path} not found. Skipping.")
        return
        
    start_time = time.time()
    cursor = conn.cursor()
    
    # We clear the table first
    cursor.execute(f"DELETE FROM {table_name}")
    
    batch = []
    count = 0
    
    # Read block size matches record_len + 2 (\r\n)
    full_record_len = record_len + 2
    
    with open(file_path, 'rb') as f:
        while True:
            data = f.read(full_record_len)
            if not data:
                break
            # If line is incomplete or empty (e.g. trailing blank line)
            if len(data) < record_len:
                continue
            
            parsed_row = row_parser(data)
            if parsed_row is not None:
                batch.append(parsed_row)
                count += 1
                
                if len(batch) >= 5000:
                    cursor.executemany(insert_query, batch)
                    batch = []
                    
        if batch:
            cursor.executemany(insert_query, batch)
            
    conn.commit()
    elapsed = time.time() - start_time
    print(f"  Successfully imported {count} rows in {elapsed:.2f}s.")

def main():
    dir_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO"
    db_path = os.path.join(dir_path, "alfabeta.db")
    
    print(f"Creating database at {db_path}...")
    conn = sqlite3.connect(db_path)
    
    # Enable Write-Ahead Log (WAL) and foreign keys (optional)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    
    cursor = conn.cursor()
    
    # 1. Create tables
    print("Creating tables...")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS manual (
        troquel TEXT,
        nombre TEXT,
        presentacion TEXT,
        ioma TEXT,
        ioma_internacion TEXT,
        laboratorio_desc TEXT,
        precio REAL,
        fecha TEXT,
        marca_controlado TEXT,
        importado INTEGER,
        tipo_venta TEXT,
        iva INTEGER,
        descuento_pami TEXT,
        cod_lab INTEGER,
        nro_registro INTEGER PRIMARY KEY,
        baja INTEGER,
        cod_barra TEXT,
        unidades INTEGER,
        tamano TEXT,
        heladera INTEGER,
        sifar TEXT,
        pami_vivir_mejor TEXT,
        gravamen TEXT,
        digito_8_troquel TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS manextra (
        nro_registro INTEGER PRIMARY KEY,
        cod_tamano_relativo INTEGER,
        cod_acciofar INTEGER,
        cod_droga INTEGER,
        cod_forma INTEGER,
        potencia TEXT,
        cod_unidad_potencia INTEGER,
        cod_tipo_unidades INTEGER,
        cod_via_admin INTEGER
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tamanos (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS acciofar (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS monodro (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS formas (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS upotenci (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tipounid (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vias (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS laboratorios (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS multidro (
        nro_registro INTEGER,
        cod_droga INTEGER,
        PRIMARY KEY (nro_registro, cod_droga)
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS regnueva (
        nro_registro INTEGER,
        cod_droga INTEGER,
        potencia TEXT,
        cod_unidad_potencia INTEGER,
        PRIMARY KEY (nro_registro, cod_droga)
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS nuevadro (
        codigo INTEGER PRIMARY KEY,
        descripcion TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS barextra (
        nro_registro INTEGER,
        cod_barra TEXT,
        PRIMARY KEY (nro_registro, cod_barra)
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gtin1 (
        nro_registro INTEGER PRIMARY KEY,
        cod_gtin TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS preciopami (
        nro_registro INTEGER PRIMARY KEY,
        precio_pami REAL
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS snomed (
        nro_registro INTEGER PRIMARY KEY,
        idsnomed TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ioma_mf (
        nro_registro INTEGER PRIMARY KEY,
        monto_fijo_ioma REAL
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS atc (
        nro_registro INTEGER,
        cod_atc TEXT,
        PRIMARY KEY (nro_registro, cod_atc)
    )""")
    
    conn.commit()
    
    # 2. Row parsers
    
    def parse_manual(d):
        return (
            clean_str(d[0:7]),   # troquel
            clean_str(d[7:51]),  # nombre
            clean_str(d[51:75]), # presentacion
            clean_str(d[83:84]), # ioma
            clean_str(d[84:85]), # ioma_internacion
            clean_str(d[85:100]),# laboratorio_desc
            clean_price(d[100:113]), # precio
            clean_str(d[113:121]),# fecha
            clean_str(d[121:122]),# marca_controlado
            clean_int(d[122:123]),# importado
            clean_str(d[123:124]),# tipo_venta
            clean_int(d[124:125]),# iva
            clean_str(d[125:126]),# descuento_pami
            clean_int(d[126:129]),# cod_lab
            clean_int(d[129:134]),# nro_registro (PK)
            clean_int(d[134:135]),# baja
            clean_str(d[135:148]),# cod_barra
            clean_int(d[148:152]),# unidades
            clean_str(d[152:153]),# tamano
            clean_int(d[153:154]),# heladera
            clean_str(d[154:155]),# sifar
            clean_str(d[155:156]),# pami_vivir_mejor
            clean_str(d[156:157]),# gravamen
            clean_str(d[157:158]) # digito_8_troquel
        )

    def parse_manextra(d):
        return (
            clean_int(d[0:5]),   # nro_registro
            clean_int(d[5:7]),   # cod_tamano_relativo
            clean_int(d[7:12]),  # cod_acciofar
            clean_int(d[12:17]), # cod_droga
            clean_int(d[17:22]), # cod_forma
            clean_str(d[22:38]), # potencia
            clean_int(d[38:43]), # cod_unidad_potencia
            clean_int(d[43:48]), # cod_tipo_unidades
            clean_int(d[48:53])  # cod_via_admin
        )

    def parse_tamanos(d):
        return (clean_int(d[0:2]), clean_str(d[2:32]))

    def parse_acciofar(d):
        return (clean_int(d[0:5]), clean_str(d[5:32]))

    def parse_monodro(d):
        return (clean_int(d[0:5]), clean_str(d[5:32]))

    def parse_formas(d):
        return (clean_int(d[0:5]), clean_str(d[5:55]))

    def parse_upotenci(d):
        return (clean_int(d[0:5]), clean_str(d[5:55]))

    def parse_tipounid(d):
        return (clean_int(d[0:5]), clean_str(d[5:55]))

    def parse_vias(d):
        return (clean_int(d[0:5]), clean_str(d[5:55]))

    def parse_laboratorios(d):
        return (clean_int(d[0:5]), clean_str(d[5:55]))

    def parse_multidro(d):
        return (clean_int(d[0:5]), clean_int(d[5:10]))

    def parse_regnueva(d):
        return (
            clean_int(d[0:5]),   # nro_registro
            clean_int(d[5:10]),  # cod_droga
            clean_str(d[10:26]), # potencia
            clean_int(d[26:31])  # cod_unidad_potencia
        )

    def parse_nuevadro(d):
        return (clean_int(d[0:5]), clean_str(d[5:41]))

    def parse_barextra(d):
        return (clean_int(d[0:5]), clean_str(d[5:18]))

    def parse_gtin1(d):
        return (clean_int(d[0:5]), clean_str(d[5:19]))

    def parse_preciopami(d):
        return (clean_int(d[0:5]), clean_price(d[5:14]))

    def parse_snomed(d):
        return (clean_int(d[0:5]), clean_str(d[5:37]))

    def parse_iomamf(d):
        return (clean_int(d[0:5]), clean_price(d[5:18]))

    def parse_atc(d):
        return (clean_int(d[0:5]), clean_str(d[5:15]))

    # 3. Perform imports
    
    # We prioritize manual_nuevaversion.dat. If not present, we can fallback to manual.dat.
    manual_file = "manual_nuevaversion.dat"
    if not os.path.exists(os.path.join(dir_path, manual_file)):
        manual_file = "manual.dat"
        
    import_table(
        conn, "manual", os.path.join(dir_path, manual_file), 159,
        "INSERT OR REPLACE INTO manual VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        parse_manual
    )
    
    import_table(
        conn, "manextra", os.path.join(dir_path, "manextra.txt"), 53,
        "INSERT OR REPLACE INTO manextra VALUES (?,?,?,?,?,?,?,?,?)",
        parse_manextra
    )
    
    import_table(
        conn, "tamanos", os.path.join(dir_path, "tamanos.txt"), 34,
        "INSERT OR REPLACE INTO tamanos VALUES (?,?)",
        parse_tamanos
    )
    
    import_table(
        conn, "acciofar", os.path.join(dir_path, "acciofar.txt"), 37,
        "INSERT OR REPLACE INTO acciofar VALUES (?,?)",
        parse_acciofar
    )
    
    import_table(
        conn, "monodro", os.path.join(dir_path, "monodro.txt"), 37,
        "INSERT OR REPLACE INTO monodro VALUES (?,?)",
        parse_monodro
    )
    
    import_table(
        conn, "formas", os.path.join(dir_path, "formas.txt"), 55,
        "INSERT OR REPLACE INTO formas VALUES (?,?)",
        parse_formas
    )
    
    import_table(
        conn, "upotenci", os.path.join(dir_path, "upotenci.txt"), 55,
        "INSERT OR REPLACE INTO upotenci VALUES (?,?)",
        parse_upotenci
    )
    
    import_table(
        conn, "tipounid", os.path.join(dir_path, "tipounid.txt"), 55,
        "INSERT OR REPLACE INTO tipounid VALUES (?,?)",
        parse_tipounid
    )
    
    import_table(
        conn, "vias", os.path.join(dir_path, "vias.txt"), 55,
        "INSERT OR REPLACE INTO vias VALUES (?,?)",
        parse_vias
    )
    
    import_table(
        conn, "laboratorios", os.path.join(dir_path, "laboratorios.txt"), 55,
        "INSERT OR REPLACE INTO laboratorios VALUES (?,?)",
        parse_laboratorios
    )
    
    import_table(
        conn, "multidro", os.path.join(dir_path, "multidro.txt"), 10,
        "INSERT OR REPLACE INTO multidro VALUES (?,?)",
        parse_multidro
    )
    
    import_table(
        conn, "regnueva", os.path.join(dir_path, "regnueva.txt"), 31,
        "INSERT OR REPLACE INTO regnueva VALUES (?,?,?,?)",
        parse_regnueva
    )
    
    import_table(
        conn, "nuevadro", os.path.join(dir_path, "nuevadro.txt"), 41,
        "INSERT OR REPLACE INTO nuevadro VALUES (?,?)",
        parse_nuevadro
    )
    
    import_table(
        conn, "barextra", os.path.join(dir_path, "barextra.txt"), 18,
        "INSERT OR REPLACE INTO barextra VALUES (?,?)",
        parse_barextra
    )
    
    import_table(
        conn, "gtin1", os.path.join(dir_path, "gtin1.txt"), 19,
        "INSERT OR REPLACE INTO gtin1 VALUES (?,?)",
        parse_gtin1
    )
    
    import_table(
        conn, "preciopami", os.path.join(dir_path, "preciopami.txt"), 14,
        "INSERT OR REPLACE INTO preciopami VALUES (?,?)",
        parse_preciopami
    )
    
    import_table(
        conn, "snomed", os.path.join(dir_path, "snomed.txt"), 37,
        "INSERT OR REPLACE INTO snomed VALUES (?,?)",
        parse_snomed
    )
    
    import_table(
        conn, "ioma_mf", os.path.join(dir_path, "iomaMF.txt"), 18,
        "INSERT OR REPLACE INTO ioma_mf VALUES (?,?)",
        parse_iomamf
    )
    
    import_table(
        conn, "atc", os.path.join(dir_path, "atc.txt"), 15,
        "INSERT OR REPLACE INTO atc VALUES (?,?)",
        parse_atc
    )
    
    # Create indexes for fast querying
    print("Creating indexes...")
    idx_start = time.time()
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_manual_nombre ON manual(nombre)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_manual_troquel ON manual(troquel)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_manual_cod_barra ON manual(cod_barra)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_manual_cod_lab ON manual(cod_lab)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_manextra_droga ON manextra(cod_droga)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_manextra_acciofar ON manextra(cod_acciofar)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_manextra_forma ON manextra(cod_forma)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_multidro_droga ON multidro(cod_droga)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_regnueva_droga ON regnueva(cod_droga)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_barextra_barcode ON barextra(cod_barra)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gtin1_gtin ON gtin1(cod_gtin)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_atc_code ON atc(cod_atc)")
    
    conn.commit()
    print(f"Indexes created successfully in {time.time() - idx_start:.2f}s.")
    
    # Perform database integrity and count check
    cursor.execute("SELECT COUNT(*) FROM manual")
    total_manual = cursor.fetchone()[0]
    print(f"\nVerification: Total products in 'manual' table = {total_manual}")
    
    conn.close()
    print("All tasks completed successfully!")

if __name__ == '__main__':
    main()
