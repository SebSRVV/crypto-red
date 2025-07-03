import os
import json
import requests
import pandas as pd
import matplotlib.pyplot as plt
from time import sleep
import time

# Carpetas y rutas
DATA_PATH = "public/data/criptos_completas.json"
CHARTS_DIR = "public/charts"
os.makedirs("public/data", exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)

# --- Funciones auxiliares ---
def get_price_history(coin_id: str, days: int = 7) -> list:
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {"vs_currency": "usd", "days": days, "interval": "daily"}
    try:
        r = requests.get(url, params=params)
        if r.status_code == 200:
            return [p[1] for p in r.json().get("prices", [])]
    except Exception as e:
        print(f"⚠️ Error en historial de {coin_id}: {e}")
    return []

def generar_mini_grafico(prices: list, symbol: str) -> str:
    if not prices:
        return ""
    path = f"{CHARTS_DIR}/{symbol}_chart.png"
    try:
        plt.figure(figsize=(3, 1.4))
        plt.plot(prices, color="#7f5af0", linewidth=1.5)
        plt.xticks([])
        plt.yticks([])
        plt.tight_layout()
        plt.savefig(path, transparent=True)
        plt.close()
        return f"/charts/{symbol}_chart.png"
    except Exception as e:
        print(f"⚠️ Error generando gráfico para {symbol}: {e}")
        return ""

def cargar_existentes() -> dict:
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {item["symbol"]: item for item in data}
    return {}

# --- Función principal ---
def extraer_criptos_completas(paginas=3):
    print("🔄 Buscando nuevas criptos desde CoinGecko...")
    existentes_dict = cargar_existentes()
    nuevos = 0

    for page in range(1, paginas + 1):
        print(f"🌐 Página {page}")
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 50,
            "page": page,
            "sparkline": False,
            "price_change_percentage": "24h,7d,30d"
        }

        try:
            res = requests.get(url, params=params)
            res.raise_for_status()
            coins = res.json()
        except Exception as e:
            print(f"❌ Error al descargar página {page}: {e}")
            continue

        df = pd.DataFrame(coins)[[
            "id", "name", "symbol", "image", "market_cap", "current_price",
            "price_change_percentage_24h_in_currency",
            "price_change_percentage_7d_in_currency",
            "price_change_percentage_30d_in_currency"
        ]].dropna()

        df.rename(columns={
            "price_change_percentage_24h_in_currency": "price_change_24h",
            "price_change_percentage_7d_in_currency": "price_change_7d",
            "price_change_percentage_30d_in_currency": "price_change_30d"
        }, inplace=True)

        for _, row in df.iterrows():
            symbol = row["symbol"]

            # Saltar si ya está
            if symbol in existentes_dict:
                continue

            prices = get_price_history(row["id"], days=7)
            chart_path = generar_mini_grafico(prices, symbol)

            criptomoneda = {
                "id": row["id"],
                "name": row["name"],
                "symbol": symbol,
                "image": row["image"],
                "market_cap": row["market_cap"],
                "current_price": row["current_price"],
                "price_change_24h": row["price_change_24h"],
                "price_change_7d": row["price_change_7d"],
                "price_change_30d": row["price_change_30d"],
                "chart": chart_path,
                "predicted": False,
                "reason": ""
            }

            existentes_dict[symbol] = criptomoneda
            nuevos += 1

        sleep(1.2)  # Respetar rate limit

    # Guardar todos (antiguos + nuevos)
    criptos_totales = list(existentes_dict.values())
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(criptos_totales, f, indent=2, ensure_ascii=False)

    print(f"✅ Nuevas criptos agregadas: {nuevos}")
    print(f"📦 Total criptos en archivo: {len(criptos_totales)}")
    print(f"📝 Guardado en: {DATA_PATH}")

if __name__ == "__main__":
    extraer_criptos_completas(paginas=3)
