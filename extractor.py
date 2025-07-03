# extractor_criptos.py

import os
import json
import requests
import pandas as pd
import matplotlib.pyplot as plt

# Crear carpetas necesarias
os.makedirs("public/data", exist_ok=True)
os.makedirs("public/charts", exist_ok=True)

def get_price_history(coin_id: str, days: int = 7) -> list:
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        "vs_currency": "usd",
        "days": days,
        "interval": "daily"
    }
    res = requests.get(url, params=params)
    if res.status_code == 200:
        return [p[1] for p in res.json()["prices"]]
    return []

def generar_mini_grafico(prices: list, symbol: str):
    if not prices:
        return
    plt.figure(figsize=(3, 1.4))
    plt.plot(prices, color="#7f5af0", linewidth=1.5)
    plt.xticks([])
    plt.yticks([])
    plt.tight_layout()
    path = f"public/charts/{symbol}_chart.png"
    plt.savefig(path, transparent=True)
    plt.close()

def extraer_criptos_completas(paginas=1):
    print("🔄 Descargando datos de CoinGecko...")
    resultados = []

    for page in range(1, paginas + 1):
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 50,
            "page": page,
            "sparkline": False,
            "price_change_percentage": "24h,7d,30d"
        }

        res = requests.get(url, params=params)
        if res.status_code != 200:
            print(f"❌ Error en página {page}")
            continue
        resultados.extend(res.json())

    df = pd.DataFrame(resultados)

    df = df[[
        'id', 'name', 'symbol', 'image', 'market_cap',
        'current_price',
        'price_change_percentage_24h_in_currency',
        'price_change_percentage_7d_in_currency',
        'price_change_percentage_30d_in_currency'
    ]].dropna()

    df = df.rename(columns={
        'price_change_percentage_24h_in_currency': 'price_change_24h',
        'price_change_percentage_7d_in_currency': 'price_change_7d',
        'price_change_percentage_30d_in_currency': 'price_change_30d'
    })

    criptos_final = []

    for _, row in df.iterrows():
        symbol = row["symbol"]
        prices = get_price_history(row["id"], days=7)
        generar_mini_grafico(prices, symbol)

        criptos_final.append({
            "id": row["id"],
            "name": row["name"],
            "symbol": symbol,
            "image": row["image"],
            "market_cap": row["market_cap"],
            "current_price": row["current_price"],
            "price_change_24h": row["price_change_24h"],
            "price_change_7d": row["price_change_7d"],
            "price_change_30d": row["price_change_30d"],
            "chart": f"/charts/{symbol}_chart.png",
            "predicted": False,
            "reason": ""
        })

    with open("public/data/criptos_completas.json", "w", encoding="utf-8") as f:
        json.dump(criptos_final, f, indent=2, ensure_ascii=False)

    print(f"✅ Total criptos guardadas: {len(criptos_final)}")
    print("📁 Archivo generado: public/data/criptos_completas.json")

if __name__ == "__main__":
    extraer_criptos_completas()
