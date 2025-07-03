import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Rutas
INPUT_JSON = "public/data/criptos_completas.json"
OUTPUT_EXCEL = "data/predicciones_criptos.xlsx"
OUTPUT_MODEL = "data/modelo_criptos.pkl"
OUTPUT_JSON = "public/data/criptos_predichas.json"

# Crear carpeta de salida
os.makedirs("data", exist_ok=True)

# ✅ 1. Cargar datos
print("📥 Cargando datos...")
df = pd.read_json(INPUT_JSON)

# ✅ 2. Validar columnas requeridas
features = ["market_cap", "current_price", "price_change_24h", "price_change_7d"]
required = features + ["price_change_30d", "symbol", "name", "image", "chart"]

if not all(col in df.columns for col in required):
    missing = [col for col in required if col not in df.columns]
    raise Exception(f"❌ Faltan columnas requeridas: {missing}")

df = df[required].dropna()

# ✅ 3. Crear variable objetivo (binaria): ¿subió más del 30% en 30 días?
df["target"] = df["price_change_30d"] > 30

# ✅ 4. Separar datos
X = df[features]
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# ✅ 5. Entrenar modelo
print("🧠 Entrenando modelo...")
model = RandomForestClassifier(n_estimators=120, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# ✅ 6. Evaluación
y_pred = model.predict(X_test)
print("\n📊 Reporte de Clasificación:\n")
print(classification_report(y_test, y_pred))

# ✅ 7. Predicciones
df["predicted"] = model.predict(X)

# ✅ 8. Añadir explicación de la recomendación
def get_reason(row):
    if row["price_change_30d"] > 60:
        return "Crecimiento explosivo (>60%) en 30 días"
    elif row["price_change_30d"] > 30 and row["price_change_7d"] > 5:
        return "Aumento consistente en 30 días y tendencia semanal positiva"
    elif row["price_change_30d"] > 30:
        return "Alto rendimiento mensual (+30%)"
    elif row["price_change_7d"] > 10:
        return "Tendencia semanal muy positiva"
    else:
        return "Modelo identifica comportamiento rentable"

df["reason"] = df.apply(lambda row: get_reason(row) if row["predicted"] else "", axis=1)

# ✅ 9. Guardar Excel para revisión
df_out = df[[
    "name", "symbol", "image", "chart", "market_cap", "current_price",
    "price_change_24h", "price_change_7d", "price_change_30d", "predicted", "reason"
]]
df_out.to_excel(OUTPUT_EXCEL, index=False)
print(f"✅ Excel generado en: {OUTPUT_EXCEL}")

# ✅ 10. Guardar modelo
joblib.dump(model, OUTPUT_MODEL)
print(f"✅ Modelo guardado en: {OUTPUT_MODEL}")

# ✅ 11. Exportar criptos predichas a JSON para el frontend
recomendadas = df_out[df_out["predicted"] == True]
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(recomendadas.to_dict(orient="records"), f, indent=2, ensure_ascii=False)
print(f"✅ JSON frontend generado en: {OUTPUT_JSON}")
print(f"🎯 Criptos rentables encontradas: {len(recomendadas)}")
