'use client';
import { useRouter } from 'next/navigation';
import styles from './Home.module.css';
import { HiOutlineCpuChip } from 'react-icons/hi2';

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* Header con logo e ícono */}
      <header className={styles.header}>
        <div className={styles.logoWrapper}>
          <HiOutlineCpuChip className={styles.icon} />
          <h1 className={styles.logo}>CryptoRed</h1>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h2 className={styles.title}>
            Impulsando tus decisiones con <span className={styles.accent}>inteligencia artificial</span>
          </h2>
          <p className={styles.description}>
            CryptoRed es una plataforma que detecta oportunidades de inversión en criptomonedas emergentes.
            Utilizamos modelos de machine learning y análisis de narrativas clave como inteligencia artificial, videojuegos, activos tokenizados y memes.
          </p>
          <button className={styles.button} onClick={() => router.push('/dashboard')}>
            Ir al Dashboard 🚀
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} CryptoRed — Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
