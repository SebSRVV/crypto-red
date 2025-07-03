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
import Image from 'next/image';

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

type FilterOption = 'all' | 'recommended';

export default function Dashboard() {
  const [data, setData] = useState<Crypto[]>([]);
  const [sortedData, setSortedData] = useState<Crypto[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('nameAsc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
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

        const predictedMap: Record<string, string | undefined> = {};

        if (Array.isArray(predictedList)) {
          predictedList.forEach(item => {
            if (typeof item === 'string') {
              predictedMap[item.toLowerCase()] = '';
            } else if (item.symbol) {
              predictedMap[item.symbol.toLowerCase()] = item.reason || '';
            }
          });
        }

        const updated = allCryptos.map(coin => {
          const lowerSymbol = coin.symbol.toLowerCase();
          return {
            ...coin,
            predicted: lowerSymbol in predictedMap,
            reason: predictedMap[lowerSymbol] || ''
          };
        });

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
    let filtered = [...data];
    if (filterOption === 'recommended') {
      filtered = filtered.filter(c => c.predicted);
    }

    switch (sortOption) {
      case 'nameAsc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'priceAsc':
        filtered.sort((a, b) => a.current_price - b.current_price);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.current_price - a.current_price);
        break;
      case 'changeAsc':
        filtered.sort((a, b) => a.price_change_30d - b.price_change_30d);
        break;
      case 'changeDesc':
        filtered.sort((a, b) => b.price_change_30d - a.price_change_30d);
        break;
    }

    setSortedData(filtered);
  }, [data, sortOption, filterOption]);

  const totalCryptos = data.length;
  const recommendedCryptos = data.filter(c => c.predicted).length;

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

        {/* 📊 Resumen clickeable */}
        <div className={styles.summary}>
          <p onClick={() => setFilterOption('all')} style={{ cursor: 'pointer' }}>
            <FaCoins className={styles.icon} />
            Total de criptomonedas: <strong>{totalCryptos}</strong>
          </p>
          <p onClick={() => setFilterOption('recommended')} style={{ cursor: 'pointer' }}>
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
  <Image
    src={crypto.image}
    alt={`${crypto.name} logo`}
    width={64}
    height={64}
    className={styles.logo}
    unoptimized
  />
)}
{crypto.chart && (
  <Image
    src={crypto.chart}
    alt="mini chart"
    width={200}
    height={40}
    className={styles.chart}
    unoptimized
  />
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
                  {crypto.reason && (
                    <div className={styles.reason}>{crypto.reason}</div>
                  )}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
