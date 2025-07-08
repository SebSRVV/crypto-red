import os
import json
import pandas as pd
import requests
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import sys

INPUT_JSON = "public/data/criptos_completas.json"
OUTPUT_EXCEL = "data/predicciones_criptos.xlsx"
OUTPUT_MODEL = "data/modelo_criptos.pkl"
OUTPUT_JSON = "public/data/criptos_predichas.json"
UMBRAL_PROBABILIDAD = 0.35

os.makedirs("data", exist_ok=True)

def obtener_variacion_btc():
    url = "https://api.coingecko.com/api/v3/coins/bitcoin"
    try:
        r = requests.get(url)
        r.raise_for_status()
        data = r.json()["market_data"]
        return {
            "btc_change_7d": data["price_change_percentage_7d"],
            "btc_change_30d": data["price_change_percentage_30d"]
        }
    except Exception as e:
        print(f"[ERROR] No se pudo obtener variacion de BTC: {e}")
        return {
            "btc_change_7d": 0.0,
            "btc_change_30d": 0.0
        }

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
    raise ValueError("Muy pocas criptos positivas para entrenar")

btc = obtener_variacion_btc()
df["btc_change_7d"] = btc["btc_change_7d"]
df["btc_change_30d"] = btc["btc_change_30d"]
features += ["btc_change_7d", "btc_change_30d"]

X = df[features]
y = df["target"]

try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
except ValueError:
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

    if row["price_change_30d"] > 100:
        reasons.append("Explosion mensual (+100%)")
    elif row["price_change_30d"] > 60:
        reasons.append("Crecimiento mensual sobresaliente (+60%)")
    elif row["price_change_30d"] > 30:
        reasons.append("Buen rendimiento mensual (+30%)")

    if row["price_change_7d"] > 10:
        reasons.append("Fuerte tendencia semanal (+10%)")
    elif row["price_change_7d"] > 5:
        reasons.append("Tendencia semanal positiva")

    if "volume_24h" in row:
        if row["volume_24h"] > 5e8:
            reasons.append("Volumen extremadamente alto")
        elif row["volume_24h"] > 1e8:
            reasons.append("Volumen alto")

    if "market_cap_rank" in row:
        if row["market_cap_rank"] <= 10:
            reasons.append("Top 10 por capitalizacion")
        elif row["market_cap_rank"] <= 100:
            reasons.append("Top 100 por capitalizacion")

    if row["score"] > 0.8:
        reasons.append("Alta confianza del modelo")
    elif row["score"] > 0.6:
        reasons.append("Buena puntuacion en analisis multivariable")

    if "btc_change_30d" in row and row["btc_change_30d"] < 0 and row["price_change_30d"] > 0:
        reasons.append("Destacando pese a caida de BTC")

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

def recomendar_generico_por_plazo(plazo: str, top_n: int = 5):
    if plazo == "24h":
        col = "price_change_24h"
    elif plazo == "30d" or plazo == "1a":
        col = "price_change_30d"
    else:
        raise ValueError("Plazo invalido. Usa '24h' o '30d'.")

    candidatos = df_out[df_out["predicted"] == True].copy()
    candidatos = candidatos.sort_values("score", ascending=False)
    seleccionadas = candidatos.head(top_n)

    print(f"\n=== TOP {top_n} CRIPTOS RECOMENDADAS ({plazo.upper()}) ===\n")
    for _, row in seleccionadas.iterrows():
        print(f"- {row['name']} ({row['symbol'].upper()}):")
        print(f"  Precio actual: ${row['current_price']:.2f}")
        print(f"  Rendimiento ({plazo}): {row[col]:.2f}%")
        print(f"  Score del modelo: {row['score']:.2f}")
        print(f"  Razon: {row['reason']}\n")

if __name__ == "__main__":
    if len(sys.argv) == 2:
        try:
            plazo = sys.argv[1].lower()
            recomendar_generico_por_plazo(plazo)
        except Exception as e:
            print(f"Error al procesar: {e}")
    else:
        print("Script Finalizado")

