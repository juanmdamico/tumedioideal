import sqlite3
import os
import random
import datetime

# Regional and National Prepagas
PREPAGAS = [
    {"rnemp": 1001, "nombre_comercial": "OSDE", "region": "Nacional"},
    {"rnemp": 1002, "nombre_comercial": "Swiss Medical", "region": "Nacional"},
    {"rnemp": 1003, "nombre_comercial": "Galeno", "region": "Nacional"},
    {"rnemp": 1004, "nombre_comercial": "Sancor Salud", "region": "Nacional"},
    {"rnemp": 1005, "nombre_comercial": "Medicus", "region": "Nacional"},
    {"rnemp": 1006, "nombre_comercial": "Omint", "region": "Nacional"},
    {"rnemp": 1007, "nombre_comercial": "Avalian", "region": "Nacional"},
    {"rnemp": 2001, "nombre_comercial": "Jerárquicos Salud", "region": "Litoral"},
    {"rnemp": 2002, "nombre_comercial": "Nobis", "region": "NOA"},
    {"rnemp": 2003, "nombre_comercial": "Prevención Salud", "region": "Centro"},
    {"rnemp": 2004, "nombre_comercial": "AcaSalud", "region": "Nacional"},
    {"rnemp": 2005, "nombre_comercial": "Boreal", "region": "NOA"},
    {"rnemp": 2006, "nombre_comercial": "Ensalud", "region": "PBA"},
    {"rnemp": 2007, "nombre_comercial": "SIPSSA", "region": "Córdoba"},
    {"rnemp": 2008, "nombre_comercial": "Caja Mutual", "region": "Santa Fe"},
    {"rnemp": 2009, "nombre_comercial": "Osdepym", "region": "Nacional"},
    {"rnemp": 2010, "nombre_comercial": "Luis Pasteur", "region": "CABA"}
]

PLANES = [
    {"codigo": 10, "nombre": "Plan Básico (Copagos)", "base_price": 45000, "copago": 1, "tipo": "Básico"},
    {"codigo": 20, "nombre": "Plan Clásico", "base_price": 65000, "copago": 0, "tipo": "Clásico"},
    {"codigo": 30, "nombre": "Plan Plata", "base_price": 85000, "copago": 0, "tipo": "Intermedio"},
    {"codigo": 40, "nombre": "Plan Oro", "base_price": 120000, "copago": 0, "tipo": "Premium"},
    {"codigo": 50, "nombre": "Plan Black", "base_price": 180000, "copago": 0, "tipo": "Premium"}
]

EDADES = [
    (18, 25), (26, 35), (36, 45), (46, 59), (60, 99)
]

def generate_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "db", "alfabeta.db")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if table exists, if not, create it
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sssalud_tariffs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rnemp INTEGER,
        nombre_comercial TEXT,
        periodo INTEGER,
        codigo_plan INTEGER,
        nombre_plan TEXT,
        valor_capital REAL,
        rango_etario_desde INTEGER,
        rango_etario_hasta INTEGER,
        region TEXT,
        tipo_plan TEXT,
        permite_copago INTEGER,
        tasa_aumento_mensual REAL,
        modalidad_adhesion TEXT,
        tipificacion TEXT,
        rnemp_descripcion TEXT
    )
    ''')
    
    # Clear existing data
    cursor.execute("DELETE FROM sssalud_tariffs")
    
    # Generate last 6 months periods
    today = datetime.date.today()
    periods = []
    for i in range(6):
        d = today.replace(day=1) - datetime.timedelta(days=i*30)
        periods.append(int(d.strftime("%Y%m")))
    
    periods = sorted(periods)
    
    # Insert Data
    for prepaga in PREPAGAS:
        # Each prepaga has 2-3 plans randomly
        num_plans = random.randint(2, 4)
        selected_plans = random.sample(PLANES, num_plans)
        
        # Apply regional discount
        regional_multiplier = 1.0 if prepaga["region"] == "Nacional" else random.uniform(0.7, 0.85)
        
        for plan in selected_plans:
            # Base price modification per prepaga
            prepaga_multiplier = random.uniform(0.8, 1.5)
            if prepaga["nombre_comercial"] in ["OSDE", "Swiss Medical"]:
                prepaga_multiplier = random.uniform(1.3, 1.8)
                
            base_plan_price = plan["base_price"] * prepaga_multiplier * regional_multiplier
            
            # Historical evolution (simulate inflation 4-8% per month)
            current_price = base_plan_price
            prices_by_period = {}
            for p in periods:
                prices_by_period[p] = current_price
                # Next month increases by 4-8%
                current_price = current_price * (1 + random.uniform(0.04, 0.08))
                
            # Insert for each age group
            for edad_min, edad_max in EDADES:
                age_factor = 1.0
                if edad_max == 25: age_factor = 0.8
                if edad_min == 36: age_factor = 1.2
                if edad_min == 46: age_factor = 1.6
                if edad_min == 60: age_factor = 2.5
                
                for p in periods:
                    final_price = round(prices_by_period[p] * age_factor, 2)
                    
                    cursor.execute('''
                        INSERT INTO sssalud_tariffs (
                            rnemp, nombre_comercial, periodo, codigo_plan, nombre_plan,
                            valor_capital, rango_etario_desde, rango_etario_hasta, region,
                            tipo_plan, permite_copago, tipificacion, rnemp_descripcion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        prepaga["rnemp"],
                        prepaga["nombre_comercial"],
                        p,
                        plan["codigo"],
                        plan["nombre"],
                        final_price,
                        edad_min,
                        edad_max,
                        prepaga["region"],
                        plan["tipo"],
                        plan["copago"],
                        "Particular",
                        f"Prepaga {prepaga['nombre_comercial']} ({prepaga['region']})"
                    ))

    conn.commit()
    conn.close()
    print(f"Data ingestion complete. Inserted mock data for {len(PREPAGAS)} prepagas across {len(periods)} periods.")

if __name__ == "__main__":
    generate_data()
