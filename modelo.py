import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# -------------------- Configuración --------------------
INPUT_JSON = "public/data/criptos_completas.json"
OUTPUT_EXCEL = "data/predicciones_criptos.xlsx"
OUTPUT_MODEL = "data/modelo_criptos.pkl"
OUTPUT_JSON = "public/data/criptos_predichas.json"

os.makedirs("data", exist_ok=True)

# -------------------- 1. Cargar Datos --------------------
print("📥 Cargando datos desde:", INPUT_JSON)
df = pd.read_json(INPUT_JSON)

features = ["market_cap", "current_price", "price_change_24h", "price_change_7d"]
required = features + ["price_change_30d", "symbol", "name", "image", "chart"]

missing_cols = [col for col in required if col not in df.columns]
if missing_cols:
    raise ValueError(f"❌ Faltan columnas necesarias: {missing_cols}")

df = df[required].dropna()
print(f"✅ Criptos válidas cargadas: {len(df)}")

# -------------------- 2. Variable Objetivo --------------------
df["target"] = df["price_change_30d"] > 30

# -------------------- 3. Entrenamiento --------------------
X = df[features]
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

print("🧠 Entrenando modelo RandomForest...")
model = RandomForestClassifier(
    n_estimators=120, max_depth=10, random_state=42, class_weight="balanced"
)
model.fit(X_train, y_train)

# -------------------- 4. Evaluación --------------------
print("\n📊 Reporte de Clasificación:\n")
print(classification_report(y_test, model.predict(X_test)))

# -------------------- 5. Predicciones y razones --------------------
df["predicted"] = model.predict(X)

def get_reason(row):
    if row["price_change_30d"] > 60:
        return "📈 Crecimiento explosivo (>60%) en 30 días"
    if row["price_change_30d"] > 30 and row["price_change_7d"] > 5:
        return "📊 Subida mensual fuerte + tendencia semanal positiva"
    if row["price_change_30d"] > 30:
        return "🟢 Rendimiento mensual superior al 30%"
    if row["price_change_7d"] > 10:
        return "📉 Fuerte alza en la última semana"
    return "🧠 Recomendación basada en análisis multivariable"

df["reason"] = df.apply(lambda row: get_reason(row) if row["predicted"] else "", axis=1)

# -------------------- 6. Exportar --------------------
df_out = df[[
    "name", "symbol", "image", "chart", "market_cap", "current_price",
    "price_change_24h", "price_change_7d", "price_change_30d", "predicted", "reason"
]]

df_out.to_excel(OUTPUT_EXCEL, index=False)
print(f"📁 Excel generado: {OUTPUT_EXCEL}")

joblib.dump(model, OUTPUT_MODEL)
print(f"💾 Modelo guardado en: {OUTPUT_MODEL}")

recomendadas = df_out[df_out["predicted"] == True]
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(recomendadas.to_dict(orient="records"), f, indent=2, ensure_ascii=False)

print(f"📤 JSON para frontend: {OUTPUT_JSON}")
print(f"🎯 Criptos recomendadas por IA: {len(recomendadas)}")
