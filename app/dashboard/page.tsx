'use client';
import { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import {
  FaDollarSign,
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
  FaCoins,
  FaCalendarAlt
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

interface Crypto {
  name: string;
  symbol: string;
  image?: string;
  chart?: string;
  market_cap: number;
  current_price: number;
  price_change_30d: number;
  predicted: boolean;
  reason?: string;
}

type SortOption =
  | 'nameAsc'
  | 'nameDesc'
  | 'priceAsc'
  | 'priceDesc'
  | 'changeAsc'
  | 'changeDesc';

export default function Dashboard() {
  const [data, setData] = useState<Crypto[]>([]);
  const [sortedData, setSortedData] = useState<Crypto[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('nameAsc');
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [priceFlashes, setPriceFlashes] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
  const fetchData = async () => {
    try {
      const [resData, resPredicted] = await Promise.all([
        fetch('/data/criptos_completas.json'),
        fetch('/data/criptos_predichas.json')
      ]);

      const allCryptos: Crypto[] = await resData.json();
      const predictedList = await resPredicted.json();

      // Soporte para array de strings o de objetos
      const predictedSymbols = Array.isArray(predictedList)
        ? predictedList.map(item =>
            typeof item === 'string' ? item.toLowerCase() : item.symbol.toLowerCase()
          )
        : [];

      const updated = allCryptos.map(coin => ({
        ...coin,
        predicted: predictedSymbols.includes(coin.symbol.toLowerCase()),
      }));

      // Detectar cambios de precio para animación
      const flashes: Record<string, 'up' | 'down' | null> = {};
      updated.forEach((coin) => {
        const prev = previousPrices[coin.symbol];
        if (prev !== undefined && prev !== coin.current_price) {
          flashes[coin.symbol] = coin.current_price > prev ? 'up' : 'down';
        } else {
          flashes[coin.symbol] = null;
        }
      });

      setPriceFlashes(flashes);
      setPreviousPrices(Object.fromEntries(updated.map(c => [c.symbol, c.current_price])));
      setData(updated);
      setTimeout(() => setPriceFlashes({}), 1000);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  fetchData();
  const interval = setInterval(fetchData, 6000);
  return () => clearInterval(interval);
}, [previousPrices]);

  useEffect(() => {
    const sorted = [...data];
    switch (sortOption) {
      case 'nameAsc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'priceAsc':
        sorted.sort((a, b) => a.current_price - b.current_price);
        break;
      case 'priceDesc':
        sorted.sort((a, b) => b.current_price - a.current_price);
        break;
      case 'changeAsc':
        sorted.sort((a, b) => a.price_change_30d - b.price_change_30d);
        break;
      case 'changeDesc':
        sorted.sort((a, b) => b.price_change_30d - a.price_change_30d);
        break;
    }
    setSortedData(sorted);
  }, [data, sortOption]);

  const totalCryptos = sortedData.length;
  const recommendedCryptos = sortedData.filter(c => c.predicted).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard de Criptomonedas</h1>
        <div className={styles.actions}>
          <button onClick={() => window.location.href = '/'} className={styles.backButton}>
            ⬅ Volver al Inicio
          </button>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className={styles.sortSelect}
          >
            <option value="nameAsc">Nombre (A-Z)</option>
            <option value="nameDesc">Nombre (Z-A)</option>
            <option value="priceAsc">Precio ↑</option>
            <option value="priceDesc">Precio ↓</option>
            <option value="changeAsc">% Cambio ↑</option>
            <option value="changeDesc">% Cambio ↓</option>
          </select>
        </div>

        {/* 📊 Resumen */}
        <div className={styles.summary}>
          <p>
            <FaCoins className={styles.icon} />
            Total de criptomonedas: <strong>{totalCryptos}</strong>
          </p>
          <p>
            <HiSparkles className={styles.icon} />
            Recomendadas por IA: <strong>{recommendedCryptos}</strong>
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {sortedData.map((crypto, index) => {
          const isUp = priceFlashes[crypto.symbol] === 'up';
          const isDown = priceFlashes[crypto.symbol] === 'down';

          return (
            <a
              key={crypto.symbol}
              href={`https://www.coingecko.com/es/monedas/${crypto.name.toLowerCase().replace(/\s+/g, '-')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.card} ${styles.fadeUp}`}
              style={{ animationDelay: `${index * 0.05}s` }}
              title={`Ver ${crypto.name} en CoinGecko`}
            >
              {crypto.image && (
                <img src={crypto.image} alt={`${crypto.name} logo`} className={styles.logo} loading="lazy" />
              )}
              {crypto.chart && (
                <img src={crypto.chart} alt="mini chart" className={styles.chart} />
              )}

              <h2>{crypto.name} <span>({crypto.symbol.toUpperCase()})</span></h2>

              <p className={`${styles.price} ${isUp ? styles.priceUp : ''} ${isDown ? styles.priceDown : ''}`}>
                <FaDollarSign className={styles.icon} />
                <strong>Precio:</strong> ${crypto.current_price.toFixed(6)}
                {isUp && <FaArrowUp className={styles.upIcon} />}
                {isDown && <FaArrowDown className={styles.downIcon} />}
              </p>

              <p>
                <FaChartBar className={styles.icon} />
                <strong>Market Cap:</strong> ${crypto.market_cap.toLocaleString()}
              </p>

<div className={styles.changeBlock}>
  <span className={styles.changeLabel}>
    <FaCalendarAlt className={styles.icon} />
    Cambio 30d
  </span>
  <span className={crypto.price_change_30d >= 0 ? styles.positive : styles.negative}>
    {crypto.price_change_30d > 0 && <FaArrowUp className={styles.upIcon} />}
    {crypto.price_change_30d < 0 && <FaArrowDown className={styles.downIcon} />}
    {crypto.price_change_30d.toFixed(2)}%
  </span>
</div>

              {crypto.predicted && (
                <div className={styles.tagIA}>
                  <HiSparkles className={styles.icon} />
                  Recomendado por IA
                  <div className={styles.reason}>{crypto.reason}</div>
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
