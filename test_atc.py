import os

def test_parse_atc(file_path):
    print(f"--- Parsing first 10 records of atc.txt ---")
    if not os.path.exists(file_path):
        print("File does not exist.")
        return
    with open(file_path, 'rb') as f:
        # Let's read first 10 lines
        for i in range(10):
            line = f.readline()
            if not line:
                break
            print(f"Line {i+1}: {line.decode('latin-1').strip()} | Length: {len(line)}")

if __name__ == '__main__':
    dir_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO"
    test_parse_atc(os.path.join(dir_path, "atc.txt"))
