import os
import urllib.request
import urllib.parse
import re
import zipfile
import shutil
import sqlite3
import getpass
from http.cookiejar import CookieJar
import subprocess

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

def main():
    print("==========================================================")
    # Human-readable title
    print("TuRemedioIdeal - Actualizador Automático de Precios Alfabeta")
    print("==========================================================\n")
    
    # Credentials prompt
    user = input("Usuario Alfabeta: ").strip()
    password = getpass.getpass("Contraseña Alfabeta: ")
    
    # Setup HTTP client with cookies
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')]
    
    # 1. Login to Alfabeta
    login_url = "https://alfabeta.net/descargas/login.jsp"
    login_data = {
        'usuario': user,
        'clave': password,
        'cmd': 'login'
    }
    encoded_data = urllib.parse.urlencode(login_data).encode('utf-8')
    
    print("\n[1/6] Iniciando sesión en Alfabeta...")
    try:
        response = opener.open(login_url, encoded_data)
        res_html = response.read().decode('utf-8', errors='ignore')
        final_url = response.geturl()
        
        if "error" in final_url.lower() or "login.jsp" in final_url.lower() and "usuario" in res_html:
            print("❌ Error de autenticación. Usuario o contraseña incorrectos.")
            return
        print("✅ Sesión iniciada con éxito.")
    except Exception as e:
        print(f"❌ Error al iniciar sesión: {e}")
        return
        
    # 2. Access downloads list and parse latest version link
    downloads_url = "https://alfabeta.net/descargas/descargas.jsp"
    print("\n[2/6] Buscando actualizaciones en el portal...")
    try:
        response = opener.open(downloads_url)
        res_html = response.read().decode('utf-8', errors='ignore')
        
        # Find all download links for TEXTO (ZIP files)
        # Format: procesar.jsp?nombre=20260617_19737_TEXTO&id=3736&tipo=zip&manual=793
        links = re.findall(r'href="([^"]*nombre=[^"]*_TEXTO[^"]*)"', res_html)
        
        if not links:
            print("❌ No se encontraron enlaces de actualización de TEXTO en la página.")
            return
            
        # Parse links and sort to find the newest by date
        # Link example: procesar.jsp?nombre=20260617_19737_TEXTO&id=3736&tipo=zip&manual=793
        parsed_links = []
        for l in links:
            match = re.search(r'nombre=(\d{8})_(\d+)_TEXTO', l)
            if match:
                date_str = match.group(1)
                version_str = match.group(2)
                parsed_links.append((date_str, version_str, l))
                
        # Sort by date and version descending
        parsed_links.sort(key=lambda x: (x[0], int(x[1])), reverse=True)
        latest_date, latest_version, latest_link = parsed_links[0]
        
        print(f"ℹ️ Última versión disponible: {latest_date} (Versión: {latest_version})")
        
    except Exception as e:
        print(f"❌ Error al buscar actualizaciones: {e}")
        return
        
    # 3. Download the ZIP file
    # Replace relative path if needed
    download_url = latest_link
    if not download_url.startswith("http"):
        download_url = "https://www.alfabeta.net/descargas/" + download_url
        
    temp_zip = "db/latest_manual.zip"
    os.makedirs("db", exist_ok=True)
    
    print(f"\n[3/6] Descargando actualización ({latest_date})...")
    try:
        with opener.open(download_url) as dl_stream, open(temp_zip, 'wb') as out_file:
            # Buffer copy
            shutil.copyfileobj(dl_stream, out_file)
        print("✅ Archivo descargado con éxito.")
    except Exception as e:
        print(f"❌ Error al descargar el archivo: {e}")
        return
        
    # 4. Extract the ZIP file
    extract_dir = "db/extracted_manual"
    if os.path.exists(extract_dir):
        shutil.rmtree(extract_dir)
    os.makedirs(extract_dir, exist_ok=True)
    
    print("\n[4/6] Descomprimiendo archivos...")
    try:
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        print("✅ Descompresión finalizada.")
    except Exception as e:
        print(f"❌ Error al descomprimir: {e}")
        # Clean up zip
        if os.path.exists(temp_zip): os.remove(temp_zip)
        return
        
    # 5. Process prices and update SQLite
    db_path = "db/alfabeta.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada en {db_path}!")
        return
        
    # Search for manual.dat
    manual_dat = os.path.join(extract_dir, "manual_nuevaversion.dat")
    is_new_format = True
    if not os.path.exists(manual_dat):
        manual_dat = os.path.join(extract_dir, "manual.dat")
        is_new_format = False
        if not os.path.exists(manual_dat):
            print(f"❌ Archivo manual.dat no encontrado en los archivos extraídos!")
            return
            
    # Determine format parameters based on version format
    if is_new_format:
        record_len = 159
        p_start, p_end = 100, 113
        r_start, r_end = 129, 134
    else:
        record_len = 156
        p_start, p_end = 100, 110
        r_start, r_end = 126, 131
        
    full_record_len = record_len + 2 # \r\n
    
    print(f"\n[5/6] Importando nuevos precios a la base de datos...")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Read the file and build batch updates
        batch_current_prices = []
        batch_historical_prices = []
        
        with open(manual_dat, 'rb') as f:
            while True:
                data = f.read(full_record_len)
                if not data:
                    break
                if len(data) < record_len:
                    continue
                
                nro_reg = clean_int(data[r_start:r_end])
                precio = clean_price(data[p_start:p_end])
                
                if nro_reg is not None and precio > 0:
                    # current prices
                    batch_current_prices.append((precio, latest_date, nro_reg))
                    # historical prices
                    batch_historical_prices.append((nro_reg, latest_date, precio))
                    
        # Update manual table
        print(f"  - Actualizando tabla 'manual' ({len(batch_current_prices)} productos)...")
        cursor.executemany("UPDATE manual SET precio = ?, fecha = ? WHERE nro_registro = ?", batch_current_prices)
        
        # Create historical prices table if not exists (in case it got lost)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS precio_historico (
            nro_registro INTEGER,
            fecha_version TEXT,
            precio REAL,
            PRIMARY KEY (nro_registro, fecha_version)
        )""")
        
        # Insert into historical prices
        print("  - Insertando registros históricos en 'precio_historico'...")
        cursor.executemany("INSERT OR REPLACE INTO precio_historico VALUES (?, ?, ?)", batch_historical_prices)
        
        # Build indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_precio_hist_reg ON precio_historico(nro_registro)")
        
        conn.commit()
        conn.close()
        print("✅ Base de datos actualizada con éxito.")
        
    except Exception as e:
        print(f"❌ Error al actualizar la base de datos: {e}")
        return
    finally:
        # Clean up temp files
        print("Limpiando archivos temporales...")
        if os.path.exists(temp_zip): os.remove(temp_zip)
        if os.path.exists(extract_dir): shutil.rmtree(extract_dir)
        
    # 6. Git commit and push to Vercel
    print("\n[6/6] Subiendo actualizaciones a GitHub y Vercel...")
    try:
        # Check if git is available in this console shell
        subprocess.run(["git", "add", "db/alfabeta.db"], check=True, stdout=subprocess.DEVNULL)
        subprocess.run(["git", "commit", "-m", f"Actualización automática de precios: {latest_date} (Versión {latest_version})"], check=True, stdout=subprocess.DEVNULL)
        print("Subiendo a GitHub (git push)...")
        subprocess.run(["git", "push"], check=True)
        print("\n🎉 ¡PROCESO FINALIZADO CON ÉXITO!")
        print("Vercel detectará la actualización y la publicará en producción en 1-2 minutos.")
    except Exception as e:
        print(f"\n⚠️ Base de datos actualizada, pero ocurrió un problema al hacer git push: {e}")
        print("Puedes hacer el 'git commit' y 'git push' manualmente desde tu consola para publicar los cambios.")

if __name__ == '__main__':
    main()
