'use client';
import { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { useRouter } from 'next/navigation';

interface Crypto {
  name: string;
  symbol: string;
  image: string;
  market_cap: number;
  current_price: number;
  price_change_percentage_30d_in_currency: number;
}

export default function Dashboard() {
  const [data, setData] = useState<Crypto[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/data/criptos_recomendadas.json')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🚀 Criptomonedas Recomendadas</h1>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          ⬅ Volver al Inicio
        </button>
      </div>
      <div className={styles.grid}>
        {data.map((crypto, index) => (
          <div key={index} className={styles.card}>
            <img src={crypto.image} alt={crypto.name} className={styles.logo} />
            <h2>{crypto.name} <span>({crypto.symbol.toUpperCase()})</span></h2>
            <p><strong>Precio:</strong> ${crypto.current_price.toFixed(6)}</p>
            <p><strong>Market Cap:</strong> ${crypto.market_cap.toLocaleString()}</p>
            <p className={crypto.price_change_percentage_30d_in_currency >= 0 ? styles.positive : styles.negative}>
              <strong>Cambio 30d:</strong> {crypto.price_change_percentage_30d_in_currency.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
