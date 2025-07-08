'use client';
import { useState } from 'react';
import styles from './Tools.module.css';
import { FaTools, FaPlay, FaDownload, FaHome } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function ToolsPage() {
  const [page, setPage] = useState(1);
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const runScript = async (script: 'extractor' | 'modelo_general') => {
    setLoading(true);
    setLog('Ejecutando script...');

    const query =
      script === 'extractor'
        ? `?script=extractor&page=${page}`
        : `?script=modelo_general&page=30d`; // Fijo a 30 días

    try {
      const res = await fetch(`/api/run${query}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLog(data.output || 'Sin salida');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setLog(`Error: ${message}`);
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
          <label className={styles.label}>Página a consultar:</label>
          <input
            className={styles.input}
            type="number"
            value={page}
            min={1}
            onChange={(e) => setPage(Number(e.target.value))}
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
          onClick={() => runScript('modelo_general')}
          disabled={loading}
        >
          <FaPlay style={{ marginRight: 6 }} />
          Correr Modelo General
        </button>
      </div>

      <div className={styles.logBox}>
        <strong>Log de ejecución:</strong>
        <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{log}</div>
      </div>

      <button onClick={() => router.push('/')} className={styles.backBtn}>
        <FaHome style={{ marginRight: 6 }} />
        Volver al Inicio
      </button>
    </div>
  );
}
