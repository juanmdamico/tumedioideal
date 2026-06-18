import re

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Define serialize_product after get_price_threshold_date
serialize_func = """
def serialize_product(r):
    act_name = r["action_name"].strip().upper() if r["action_name"] else "SIN ACCIÓN DEFINIDA"
    drug_name = r["drug_name"].strip().capitalize() if r["drug_name"] else "Sin Droga"
    
    prod = {
        "nro_registro": r["nro_registro"],
        "brand_name": r["brand_name"].strip() if r["brand_name"] else "",
        "pres_orig": r["pres_orig"].strip() if r["pres_orig"] else "",
        "lab_name": r["lab_name"].strip() if r["lab_name"] else "",
        "price": r["price"],
        "price_date": r["price_date"].strip() if r["price_date"] else "",
        "drug_name": drug_name,
        "action_name": act_name,
        "potencia": r["potencia"].strip() if r["potencia"] else "",
        "unidad_potencia": r["unidad_potencia"].strip() if r["unidad_potencia"] else "",
        "forma_farmaceutica": r["forma_farmaceutica"].strip() if r["forma_farmaceutica"] else "",
        "unidades": r["unidades"],
        "troquel": r["troquel"].strip() if r["troquel"] else "",
        "tipo_venta": r["tipo_venta"].strip() if r["tipo_venta"] else "",
        "snomed_id": r["snomed_id"].strip() if r["snomed_id"] else "",
        "snomed_term": r["snomed_term"].strip() if r["snomed_term"] else "",
        "snomed_parent_id": r["snomed_parent_id"].strip() if r["snomed_parent_id"] else "",
        "snomed_parent_term": r["snomed_parent_term"].strip() if r["snomed_parent_term"] else "",
        "importado": r["importado"] if r["importado"] is not None else 0,
        "heladera": r["heladera"] if r["heladera"] is not None else 0,
        "marca_controlado": r["marca_controlado"].strip() if r["marca_controlado"] else "0"
    }
    
    if "cod_atc" in r.keys():
        prod["atc_code"] = r["cod_atc"]
        
    return prod
"""

# Insert it before app.route('/api/pathologies')
content = content.replace("@app.route('/api/pathologies')", serialize_func + "\n@app.route('/api/pathologies')")

# 2. Fix threshold_date
content = content.replace("threshold_date = get_price_threshold_date()\n        cursor.execute(query, (threshold_date,))", "cursor.execute(query, (threshold_date,))")
content = content.replace("if pat_id == 'all':", "threshold_date = get_price_threshold_date()\n    if pat_id == 'all':")

# 3. Replace the 3 for-loops
regex1 = r'for r in rows:\s+act_name = r\["action_name"\].strip\(\).upper\(\) if r\["action_name"\] else "SIN ACCIÓN DEFINIDA"\s+drug_name = r\["drug_name"\].strip\(\).capitalize\(\) if r\["drug_name"\] else "Sin Droga"\s+products.append\(\{.*?"marca_controlado": r\["marca_controlado"\].strip\(\) if r\["marca_controlado"\] else "0"\s+\}\)'
content = re.sub(regex1, 'for r in rows:\n        products.append(serialize_product(r))', content, flags=re.DOTALL)

regex2 = r'for r in rows:\s+act_name = r\["action_name"\].strip\(\).upper\(\) if r\["action_name"\] else "SIN ACCIÓN DEFINIDA"\s+drug_name = r\["drug_name"\].strip\(\).capitalize\(\) if r\["drug_name"\] else "Sin Droga"\s+products.append\(\{.*?"atc_code": r\["cod_atc"\],.*?"marca_controlado": r\["marca_controlado"\].strip\(\) if r\["marca_controlado"\] else "0"\s+\}\)'
content = re.sub(regex2, 'for r in rows:\n        products.append(serialize_product(r))', content, flags=re.DOTALL)

# 4. Fix debug=True
content = content.replace("app.run(host='127.0.0.1', port=5000, debug=True)", "app.run(host='127.0.0.1', port=5000, debug=False)")

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("app.py refactored successfully")
