'use client';
import { useState } from 'react';
import styles from './Tools.module.css';
import { FaTools, FaPlay, FaDownload, FaHome } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function ToolsPage() {
  const [startPage, setStartPage] = useState(3);
  const [endPage, setEndPage] = useState(6);
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const runScript = async (script: 'extractor' | 'modelo') => {
    setLoading(true);
    setLog('Ejecutando script...');

    const query =
      script === 'extractor'
        ? `?script=extractor&start=${startPage}&end=${endPage}`
        : `?script=modelo`;

    try {
      const res = await fetch(`/api/run${query}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLog(data.output || 'Sin salida');
    } catch (err: any) {
      setLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <FaTools />
        Herramientas de Administración
      </div>

      <div className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Página de inicio:</label>
          <input
            className={styles.input}
            type="number"
            value={startPage}
            min={1}
            onChange={(e) => setStartPage(Number(e.target.value))}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Página final:</label>
          <input
            className={styles.input}
            type="number"
            value={endPage}
            min={startPage}
            onChange={(e) => setEndPage(Number(e.target.value))}
          />
        </div>

        <button
          className={styles.button}
          onClick={() => runScript('extractor')}
          disabled={loading}
        >
          <FaDownload style={{ marginRight: 6 }} />
          Extraer Criptos
        </button>

        <button
          className={styles.button}
          onClick={() => runScript('modelo')}
          disabled={loading}
        >
          <FaPlay style={{ marginRight: 6 }} />
          Ejecutar Modelo
        </button>
      </div>

      <div className={styles.logBox}>
        <strong>Log de ejecución:</strong>
        <div style={{ marginTop: '0.5rem' }}>{log}</div>
      </div>

      <button onClick={() => router.push('/')} className={styles.backBtn}>
        <FaHome style={{ marginRight: 6 }} />
        Volver al Inicio
      </button>
    </div>
  );
}
