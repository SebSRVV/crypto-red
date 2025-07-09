# script_una_vez.py
import pandas as pd
df = pd.read_excel("data/predicciones_liviano.xlsx")
df.to_json("public/data/criptos_predichas.json", orient="records", indent=2)
