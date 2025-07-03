'use client';
import { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import {
  FaDollarSign,
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
  FaExternalLinkAlt,
} from 'react-icons/fa';

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
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [priceFlashes, setPriceFlashes] = useState<Record<string, 'up' | 'down' | null>>({});

  const getCoinGeckoUrl = (name: string) =>
    `https://www.coingecko.com/es/monedas/${name.toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data/criptos_recomendadas.json');
        const json: Crypto[] = await res.json();

        const flashes: Record<string, 'up' | 'down' | null> = {};

        json.forEach(coin => {
          const prev = previousPrices[coin.symbol];
          if (prev !== undefined && prev !== coin.current_price) {
            flashes[coin.symbol] = coin.current_price > prev ? 'up' : 'down';
          } else {
            flashes[coin.symbol] = null;
          }
        });

        setPriceFlashes(flashes);
        setPreviousPrices(Object.fromEntries(json.map(c => [c.symbol, c.current_price])));
        setData(json);

        setTimeout(() => setPriceFlashes({}), 1000);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [previousPrices]);

  return (
    <div className={styles.container}>
      <div className={`${styles.header} ${styles.fadeIn}`}>
        <h1>🚀 Criptomonedas Recomendadas</h1>
        <button onClick={() => window.location.href = '/'} className={styles.backButton}>
          ⬅ Volver al Inicio
        </button>
      </div>

      <div className={styles.grid}>
        {data.map((crypto, index) => {
          const isUp = priceFlashes[crypto.symbol] === 'up';
          const isDown = priceFlashes[crypto.symbol] === 'down';

          return (
            <div key={index} className={`${styles.card} ${styles.fadeUp}`}>
              <img
                src={crypto.image}
                alt={crypto.name}
                className={styles.logo}
                loading="lazy"
              />
              <div className={styles.titleRow}>
                <h2>
                  {crypto.name} <span>({crypto.symbol.toUpperCase()})</span>
                </h2>
                <a
                  href={getCoinGeckoUrl(crypto.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Ver ${crypto.name} en CoinGecko`}
                  className={styles.linkIcon}
                >
                  <FaExternalLinkAlt size={16} />
                </a>
              </div>

              <p className={`${styles.price} ${isUp ? styles.flashGreen : ''} ${isDown ? styles.flashRed : ''}`}>
                <FaDollarSign className={styles.icon} />
                <strong>Precio:</strong> ${crypto.current_price.toFixed(6)}
              </p>

              <p>
                <FaChartBar className={styles.icon} />
                <strong>Market Cap:</strong> ${crypto.market_cap.toLocaleString()}
              </p>

              <p className={crypto.price_change_percentage_30d_in_currency >= 0 ? styles.positive : styles.negative}>
                {crypto.price_change_percentage_30d_in_currency >= 0 ? <FaArrowUp className={styles.icon} /> : <FaArrowDown className={styles.icon} />}
                <strong>Cambio 30d:</strong> {crypto.price_change_percentage_30d_in_currency.toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
