import requests
import pandas as pd
import json
import os

# Crear carpetas
os.makedirs("data", exist_ok=True)
os.makedirs("public/data", exist_ok=True)

def obtener_criptos(paginas=2):
    resultados = []

    print("🔄 Descargando datos desde CoinGecko...")
    for pagina in range(1, paginas + 1):
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "order": "market_cap_asc",
            "per_page": 250,
            "page": pagina,
            "sparkline": "false",
            "price_change_percentage": "30d"
        }

        r = requests.get(url, params=params)
        if r.status_code != 200:
            print(f"❌ Error en página {pagina}")
            continue

        data = r.json()
        resultados.extend(data)
        print(f"✅ Página {pagina}: {len(data)} monedas")

    df = pd.DataFrame(resultados)

    columnas = [
        'name', 'symbol', 'image', 'market_cap',
        'current_price', 'price_change_percentage_30d_in_currency'
    ]

    df = df[columnas]
    df = df.dropna(subset=['market_cap', 'current_price', 'price_change_percentage_30d_in_currency'])

    print(f"✅ Total monedas útiles: {len(df)}")

    # Guardar todas las monedas
    df.to_excel("data/criptos_baja_cap.xlsx", index=False)
    with open("public/data/criptos_baja_cap.json", "w", encoding="utf-8") as f:
        json.dump(df.to_dict(orient="records"), f, indent=2, ensure_ascii=False)

    # Guardar solo recomendadas (cambio > 30%)
    recomendadas = df[df['price_change_percentage_30d_in_currency'] > 30].copy()
    recomendadas.to_excel("data/criptos_recomendadas.xlsx", index=False)
    with open("public/data/criptos_recomendadas.json", "w", encoding="utf-8") as f:
        json.dump(recomendadas.to_dict(orient="records"), f, indent=2, ensure_ascii=False)

    print(f"✅ Recomendadas encontradas: {len(recomendadas)}")
    print("📁 Archivos generados:")
    print("- data/criptos_baja_cap.xlsx")
    print("- data/criptos_recomendadas.xlsx")
    print("- public/data/criptos_baja_cap.json")
    print("- public/data/criptos_recomendadas.json")

if __name__ == "__main__":
    obtener_criptos()
