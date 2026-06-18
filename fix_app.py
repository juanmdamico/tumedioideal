import sys

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find("@app.route('/api/snomed/details/<string:concept_id>')")
if start_idx == -1:
    print('Could not find snomed_details route')
    sys.exit(1)

new_content = content[:start_idx] + """@app.route('/api/snomed/details/<string:concept_id>')
def snomed_details(concept_id):
    known_mappings = {
        "195967001": {
            "patologyId": "24",
            "atc": "R03",
            "cie10": "J45",
            "cie10Name": "Asma",
            "atcName": "Agentes contra padecimientos obstructivos de las vías respiratorias",
            "substanceQuery": "Salbutamol",
            "methodologyA": {
                "procedureName": "Terapia farmacológica para el asma",
                "procedureSctid": "426032003",
                "parentName": "Procedimiento de farmacoterapia",
                "parentSctid": "182972004",
                "substances": [{"name": "Broncodilatador de acción corta", "sctid": "372605002", "query": "Salbutamol", "atc": "R03AC"}]
            }
        },
        "44054006": {
            "patologyId": "2",
            "atc": "A10",
            "cie10": "E11",
            "cie10Name": "Diabetes mellitus no insulinodependiente",
            "atcName": "Fármacos usados en diabetes",
            "substanceQuery": "Metformina",
            "methodologyA": {
                "procedureName": "Terapia con hipoglucemiantes orales para diabetes mellitus tipo 2",
                "procedureSctid": "385807002",
                "parentName": "Procedimiento de farmacoterapia",
                "parentSctid": "182972004",
                "substances": [{"name": "Agente hipoglucemiante oral", "sctid": "372687004", "query": "Metformina", "atc": "A10B"}]
            }
        },
        "38341003": {
            "patologyId": "5",
            "atc": "C09",
            "cie10": "I10",
            "cie10Name": "Hipertensión esencial (primaria)",
            "atcName": "Agentes que actúan sobre el sistema renina-angiotensina",
            "substanceQuery": "Enalapril",
            "methodologyA": {
                "procedureName": "Tratamiento de la hipertensión esencial",
                "procedureSctid": "426639002",
                "parentName": "Procedimiento de farmacoterapia",
                "parentSctid": "182972004",
                "substances": [{"name": "Agente antihipertensivo", "sctid": "372733002", "query": "Enalapril", "atc": "C09AA02"}]
            }
        }
    }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT term FROM snomed_descriptions WHERE concept_id = ?", (concept_id,))
    row = cursor.fetchone()
    conn.close()
    
    term = row["term"] if row else "Concepto Desconocido"
    
    if concept_id in known_mappings:
        data = known_mappings[concept_id]
        return jsonify({
            "sctid": concept_id,
            "name": term,
            "desc": f"Diagnóstico validado de {term}.",
            "patologyId": data["patologyId"],
            "methodologyA": data["methodologyA"],
            "methodologyB": {
                "cie10Code": data["cie10"],
                "cie10Name": data["cie10Name"],
                "atcCode": data["atc"],
                "atcName": data["atcName"],
                "query": data["substanceQuery"]
            },
            "treatments": [{
                "class": data["atcName"],
                "sctid": "N/A",
                "guideline": f"Tratamiento estándar para {term}.",
                "substances": data["substanceQuery"],
                "atc": data["atc"]
            }]
        })
    else:
        # Generamos un mapeo genérico (simulado) para que la UI no quede vacía
        return jsonify({
            "sctid": concept_id,
            "name": term,
            "desc": f"El concepto '{term}' no tiene un mapeo manual estricto en el prototipo. Se ha generado un flujo ontológico y cruzado genérico (simulado) para propósitos de demostración.",
            "patologyId": concept_id,
            "methodologyA": {
                "procedureName": f"Terapia dirigida a: {term}",
                "procedureSctid": "Generado dinámicamente",
                "parentName": "Procedimiento de farmacoterapia",
                "parentSctid": "182972004",
                "substances": [{"name": f"Tratamiento genérico", "sctid": "N/A", "query": term, "atc": ""}]
            },
            "methodologyB": {
                "cie10Code": "S/D",
                "cie10Name": term,
                "atcCode": "S/D",
                "atcName": "Familia Farmacológica General",
                "query": term
            },
            "treatments": [{
                "class": "Búsqueda Textual (Metodología C)",
                "sctid": "N/A",
                "guideline": f"Búsqueda libre por indicación clínica: {term}.",
                "substances": term,
                "atc": ""
            }]
        })

if __name__ == '__main__':
    print("Starting Alfabeta Drug Viewer backend server...")
    app.run(host='127.0.0.1', port=5000, debug=True)
"""

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
