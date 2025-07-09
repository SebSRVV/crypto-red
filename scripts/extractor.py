import os
import sys
import json
import requests
import pandas as pd
import matplotlib.pyplot as plt

from time import sleep

DATA_PATH = "public/data/criptos_completas.json"
CHARTS_DIR = "public/charts"
os.makedirs("public/data", exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)

def get_price_history(coin_id: str, days: int = 7) -> list:
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {"vs_currency": "usd", "days": days, "interval": "daily"}
    try:
        r = requests.get(url, params=params)
        if r.status_code == 200:
            return [p[1] for p in r.json().get("prices", [])]
    except:
        pass
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
    except:
        return ""

def cargar_existentes() -> dict:
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {item["symbol"]: item for item in data}
    return {}

def extraer_pagina(pagina: int):
    existentes = cargar_existentes()
    nuevos = 0

    print(f"[INFO] Consultando pagina {pagina}")

    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 50,
        "page": pagina,
        "sparkline": False,
        "price_change_percentage": "24h,7d,30d"
    }

    try:
        res = requests.get(url, params=params)
        res.raise_for_status()
        coins = res.json()
        if not coins:
            print("[INFO] Pagina vacia.")
            return
    except Exception as e:
        print(f"[ERROR] Fallo descarga: {e}")
        return

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
        if symbol in existentes:
            continue

        prices = get_price_history(row["id"])
        chart_path = generar_mini_grafico(prices, symbol)

        existentes[symbol] = {
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

        nuevos += 1

    if nuevos > 0:
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(list(existentes.values()), f, indent=2, ensure_ascii=False)
        print(f"[OK] Criptos nuevas: {nuevos}")
    else:
        print("[INFO] No se agregaron criptos nuevas.")

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            pagina = int(sys.argv[1])
            extraer_pagina(pagina)
        else:
            print("[ERROR] Debes indicar una pagina")
    except Exception as e:
        print(f"[ERROR] Argumento invalido: {e}")
