'use client';
import { useState } from 'react';
import styles from './Recomendar.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDollarSign,
  FaPercentage,
  FaSignal,
  FaCalendarAlt,
  FaRegLightbulb,
  FaCoins,
  FaUserShield,
  FaClock,
  FaChartLine,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

type Recomendacion = {
  image: string;
  nombre: string;
  symbol: string;
  precio_actual: number;
  unidades: number;
  valor_usd: number;
  score: number;
  reason: string;
  plazo: string;
  probabilidad_subida: string;
  proyeccion?: number[];
};

export default function RecomendarPage() {
  const [capital, setCapital] = useState(1000);
  const [riesgo, setRiesgo] = useState('moderado');
  const [plazo, setPlazo] = useState('30d');
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const solicitarRecomendacion = async () => {
    if (capital < 10) {
      setError('El capital debe ser al menos $10');
      return;
    }

    setLoading(true);
    setError('');
    setRecomendaciones([]);
    setMostrarResultados(false);

    try {
      const res = await fetch(
        `/api/recomendar?capital=${capital}&riesgo=${riesgo}&plazo=${plazo}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setRecomendaciones(data.recomendaciones || []);
      setMostrarResultados(true);
    } catch (e: unknown) {
  if (e instanceof Error) {
    setError(e.message || 'Error desconocido');
  } else {
    setError('Error desconocido');
  }
    } finally {
      setLoading(false);
    }
  };

  const generarGrafico = () => {
    if (!recomendaciones.length || !recomendaciones[0].proyeccion?.length) return undefined;

    const cantidad = recomendaciones[0].proyeccion.length;

    let etiquetas: string[] = [];

    if (plazo === "24h") {
      etiquetas = Array.from({ length: cantidad }, (_, i) => `Hora ${i}`);
    } else if (plazo === "30d") {
      etiquetas = Array.from({ length: cantidad }, (_, i) => `Día ${i}`);
    } else if (plazo === "1a") {
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      etiquetas = meses.slice(0, cantidad);
    }

    return {
      labels: etiquetas,
      datasets: recomendaciones.map((r) => ({
        label: r.symbol,
        data: r.proyeccion || [],
        fill: false,
        tension: 0.4,
        borderWidth: 2,
      })),
    };
  };

  const graficoData = generarGrafico();

  const totalProyeccion = recomendaciones
    .map((r) => r.proyeccion?.[r.proyeccion.length - 1] || 0)
    .reduce((sum, val) => sum + val, 0);

  const gananciaEstimada = totalProyeccion - capital;

  return (
    <>
      {/* === Botón fijo arriba a la derecha === */}
      <div className={styles.dashboardTopRight}>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className={styles.dashboardBtn}
        >
          Ir al Dashboard
        </button>
      </div>

      <main className={styles.container}>
        <h1 className={styles.titleCentered}>Recomendación de Inversión</h1>

        {!mostrarResultados && (
          <motion.div className={styles.centerForm} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.form}>
              <label>
                <FaCoins className={styles.iconLabel} /> Capital disponible ($)
              </label>
              <input
                type="number"
                value={capital}
                min={10}
                step={10}
                onChange={(e) => setCapital(Number(e.target.value))}
              />

              <label>
                <FaUserShield className={styles.iconLabel} /> Perfil de riesgo
              </label>
              <select value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="volatil">Volátil</option>
              </select>

              <label>
                <FaClock className={styles.iconLabel} /> Plazo de inversión
              </label>
              <select value={plazo} onChange={(e) => setPlazo(e.target.value)}>
                <option value="24h">24 horas</option>
                <option value="30d">30 días</option>
                <option value="1a">1 año</option>
              </select>

              <button onClick={solicitarRecomendacion} disabled={loading}>
                {loading ? 'Procesando...' : <><FaArrowRight /> Ver recomendaciones</>}
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FaTimesCircle className={styles.iconError} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {mostrarResultados && (
          <>
            <div className={styles.layoutGrid}>
              <div className={styles.leftPanel}>
                <div className={styles.form}>
                  <label>
                    <FaCoins className={styles.iconLabel} /> Capital disponible ($)
                  </label>
                  <input
                    type="number"
                    value={capital}
                    min={10}
                    step={10}
                    onChange={(e) => setCapital(Number(e.target.value))}
                  />

                  <label>
                    <FaUserShield className={styles.iconLabel} /> Perfil de riesgo
                  </label>
                  <select value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
                    <option value="leve">Leve</option>
                    <option value="moderado">Moderado</option>
                    <option value="volatil">Volátil</option>
                  </select>

                  <label>
                    <FaClock className={styles.iconLabel} /> Plazo de inversión
                  </label>
                  <select value={plazo} onChange={(e) => setPlazo(e.target.value)}>
                    <option value="24h">24 horas</option>
                    <option value="30d">30 días</option>
                    <option value="1a">1 año</option>
                  </select>

                  <button onClick={solicitarRecomendacion} disabled={loading}>
                    {loading ? 'Procesando...' : <><FaArrowRight /> Ver nuevas recomendaciones</>}
                  </button>
                </div>
              </div>

              <div className={styles.graphPanel}>
                {graficoData && (
                  <div className={styles.chartBox}>
                    <h2><FaChartLine /> Proyección estimada</h2>
                    <Line data={graficoData} />
                  </div>
                )}
              </div>
            </div>

            <motion.div className={styles.summary} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>
                <FaCheckCircle className={styles.icon} />
                Resumen de inversión
              </h2>

              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <FaDollarSign className={styles.summaryIcon} />
                  <div><strong>Capital invertido:</strong><br />${capital}</div>
                </div>

                <div className={styles.summaryItem}>
                  <FaCoins className={styles.summaryIcon} />
                  <div><strong>Criptomonedas:</strong><br />{recomendaciones.length}</div>
                </div>

                <div className={styles.summaryItem}>
                  <FaUserShield className={styles.summaryIcon} />
                  <div><strong>Perfil de riesgo:</strong><br />{riesgo}</div>
                </div>

                <div className={styles.summaryItem}>
                  <FaClock className={styles.summaryIcon} />
                  <div><strong>Plazo:</strong><br />{plazo}</div>
                </div>

                <div className={styles.summaryItemAccent}>
                  <FaChartLine className={styles.summaryIcon} />
                  <div><strong>Valor proyectado:</strong><br />${totalProyeccion.toFixed(2)}</div>
                </div>

                <div className={styles.summaryItemAccent}>
                  <FaPercentage className={styles.summaryIcon} />
                  <div><strong>Ganancia estimada:</strong><br />${gananciaEstimada.toFixed(2)}</div>
                </div>
              </div>
            </motion.div>

            <div className={styles.resultados}>
              {recomendaciones.map((r, i) => (
                <motion.div
                  key={i}
                  className={styles.card}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <img src={r.image} alt={r.nombre} className={styles.logo} />
                  <h3>{r.nombre} <span>({r.symbol})</span></h3>

                  <ul className={styles.infoList}>
                    <li><FaDollarSign className={styles.iconData} /><strong>Precio actual:</strong> ${r.precio_actual.toFixed(4)}</li>
                    <li><FaCoins className={styles.iconData} /><strong>Unidades:</strong> {r.unidades.toFixed(6)}</li>
                    <li><FaChartLine className={styles.iconData} /><strong>Valor estimado:</strong> ${r.valor_usd.toFixed(2)}</li>
                    <li><FaSignal className={styles.iconData} /><strong>Score:</strong> {r.score.toFixed(3)}</li>
                    <li><FaPercentage className={styles.iconData} /><strong>Probabilidad:</strong> {r.probabilidad_subida}</li>
                    <li><FaCalendarAlt className={styles.iconData} /><strong>Plazo:</strong> {r.plazo}</li>
                    <li><FaRegLightbulb className={styles.iconData} /><strong>Motivo:</strong><br />{r.reason}</li>
                  </ul>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
