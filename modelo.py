import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

INPUT_JSON = "public/data/criptos_completas.json"
OUTPUT_EXCEL = "data/predicciones_criptos.xlsx"
OUTPUT_MODEL = "data/modelo_criptos.pkl"
OUTPUT_JSON = "public/data/criptos_predichas.json"
UMBRAL_PROBABILIDAD = 0.35

os.makedirs("data", exist_ok=True)

print("Cargando datos desde:", INPUT_JSON)
df = pd.read_json(INPUT_JSON)

base_features = [
    "market_cap", "current_price",
    "price_change_24h", "price_change_7d", "price_change_30d"
]

optional_features = [
    "volume_24h", "market_cap_rank",
    "circulating_supply", "total_supply"
]

extra = [f for f in optional_features if f in df.columns]
features = base_features + extra

required_cols = ["symbol", "name", "image", "chart"] + features
missing = [col for col in required_cols if col not in df.columns]
if missing:
    raise ValueError(f"Faltan columnas necesarias: {missing}")

df = df[required_cols].dropna()
print(f"Criptos validas cargadas: {len(df)}")

df["target"] = (
    (df["price_change_30d"] > 15) &
    (df["price_change_7d"] > 0)
)

print("Distribucion de clases:")
print(df["target"].value_counts())

if df["target"].sum() < 2:
    raise ValueError("Muy pocas criptos positivas para entrenar. Ajusta el criterio de target.")

X = df[features]
y = df["target"]

try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
except ValueError:
    print("Split sin estratificacion por clase")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

print("Entrenando modelo RandomForest")
model = RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    random_state=42,
    class_weight="balanced"
)
model.fit(X_train, y_train)

print("\nReporte de clasificacion\n")
print(classification_report(y_test, model.predict(X_test)))

df["score"] = model.predict_proba(X)[:, 1]
df["predicted"] = df["score"] >= UMBRAL_PROBABILIDAD

def get_reason(row):
    reasons = []
    if row["price_change_30d"] > 60:
        reasons.append("Crecimiento mensual superior al 60")
    elif row["price_change_30d"] > 30:
        reasons.append("Rendimiento mensual superior al 30")

    if row["price_change_7d"] > 5:
        reasons.append("Tendencia semanal positiva")

    if "volume_24h" in row and row["volume_24h"] > 1e8:
        reasons.append("Volumen alto")

    if "market_cap_rank" in row and row["market_cap_rank"] < 100:
        reasons.append("Top 100 por capitalizacion")

    if not reasons and row["predicted"]:
        return "Recomendacion por analisis multivariable"

    return " | ".join(reasons)

df["reason"] = df.apply(lambda row: get_reason(row) if row["predicted"] else "", axis=1)

df_out = df[[
    "name", "symbol", "image", "chart", "market_cap", "current_price",
    "price_change_24h", "price_change_7d", "price_change_30d",
    "score", "predicted", "reason"
]]

df_out.to_excel(OUTPUT_EXCEL, index=False)
print(f"Excel generado: {OUTPUT_EXCEL}")

joblib.dump(model, OUTPUT_MODEL)
print(f"Modelo guardado en: {OUTPUT_MODEL}")

recomendadas = df_out[df_out["predicted"] == True]
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(recomendadas.to_dict(orient="records"), f, indent=2, ensure_ascii=False)

print(f"JSON generado para frontend: {OUTPUT_JSON}")
print(f"Total recomendadas: {len(recomendadas)} (umbral {UMBRAL_PROBABILIDAD})")
