import os

def test_parse_manual(file_path):
    print(f"--- Parsing first 5 records of manual file: {os.path.basename(file_path)} ---")
    record_len = 159 + 2 # 159 data bytes + 2 bytes for \r\n
    if not os.path.exists(file_path):
        print("File does not exist.")
        return
        
    with open(file_path, 'rb') as f:
        for i in range(5):
            data = f.read(record_len)
            if not data or len(data) < 159:
                break
            # Parse some fields
            troquel = data[0:7].decode('latin-1').strip()
            nombre = data[7:51].decode('latin-1').strip()
            presentacion = data[51:75].decode('latin-1').strip()
            precio_raw = data[100:113].decode('latin-1').strip()
            precio = float(precio_raw) / 100.0 if precio_raw.isdigit() else 0.0
            nro_registro = data[129:134].decode('latin-1').strip()
            barras = data[135:148].decode('latin-1').strip()
            print(f"Rec {i+1}: Nro_Reg={nro_registro} | Troquel={troquel} | Nombre={nombre} | Pres={presentacion} | Precio={precio:.2f} | Barcode={barras}")

def test_parse_manextra(file_path):
    print(f"\n--- Parsing first 5 records of manextra file: {os.path.basename(file_path)} ---")
    record_len = 53 + 2
    if not os.path.exists(file_path):
        print("File does not exist.")
        return
        
    with open(file_path, 'rb') as f:
        for i in range(5):
            data = f.read(record_len)
            if not data or len(data) < 53:
                break
            # Pos/Long: 1/5, 6/2, 8/5, 13/5, 18/5, 23/16, 39/5, 44/5, 49/5
            nro_reg = data[0:5].decode('latin-1').strip()
            tamano = data[5:7].decode('latin-1').strip()
            accion = data[7:12].decode('latin-1').strip()
            droga = data[12:17].decode('latin-1').strip()
            forma = data[17:22].decode('latin-1').strip()
            potencia = data[22:38].decode('latin-1').strip()
            uni_pot = data[38:43].decode('latin-1').strip()
            tipo_uni = data[43:48].decode('latin-1').strip()
            via = data[48:53].decode('latin-1').strip()
            print(f"Rec {i+1}: Nro_Reg={nro_reg} | Tamano={tamano} | Accion={accion} | Droga={droga} | Forma={forma} | Potencia={potencia} | UniPot={uni_pot} | Via={via}")

if __name__ == '__main__':
    dir_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO"
    test_parse_manual(os.path.join(dir_path, "manual_nuevaversion.dat"))
    test_parse_manextra(os.path.join(dir_path, "manextra.txt"))
