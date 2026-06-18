import sqlite3

conn = sqlite3.connect(r"C:\alfabeta\alfabeta.db")
cursor = conn.cursor()

cursor.execute("SELECT MAX(fecha) FROM manual WHERE baja = 0 AND precio > 0")
max_date = cursor.fetchone()[0]
print(f"Max date in DB: {max_date}")

# Let's count how many products are active overall, and how many have been updated in the last 6 months
# Let's say relative to '20260617' (current local date) or relative to max_date
print("\n--- Counts relative to Max Date in DB ---")
cursor.execute(f"SELECT COUNT(*) FROM manual WHERE baja = 0 AND precio > 0")
total = cursor.fetchone()[0]

# Calculate a threshold 6 months before max_date
# max_date is YYYYMMDD
import datetime
max_dt = datetime.datetime.strptime(max_date, "%Y%m%d").date()
# Subtract 180 days (approx 6 months)
threshold_dt = max_dt - datetime.timedelta(days=180)
threshold_str = threshold_dt.strftime("%Y%m%d")
print(f"Threshold date (6 months before max_date): {threshold_str}")

cursor.execute(f"SELECT COUNT(*) FROM manual WHERE baja = 0 AND precio > 0 AND fecha >= '{threshold_str}'")
recent = cursor.fetchone()[0]
print(f"Total active products: {total}")
print(f"Products with price newer than {threshold_str}: {recent}")
print(f"Dropped products: {total - recent}")

conn.close()
