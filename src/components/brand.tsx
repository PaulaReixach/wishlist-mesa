import Image from "next/image";
import styles from "./brand.module.css";

type MesaLogoProps = {
  light?: boolean;
  compact?: boolean;
};

export function MesaMark({ className = "" }: { className?: string }) {
  return (
    <Image
      className={className}
      src="/mesa-logo.png"
      alt=""
      width={286}
      height={286}
      aria-hidden="true"
    />
  );
}

export function MesaLogo({ light = false, compact = false }: MesaLogoProps) {
  return (
    <span className={`${styles.logo} ${light ? styles.light : ""}`}>
      <MesaMark className={styles.mark} />
      <span className={styles.wordmark}>MESA</span>
      {!compact && <span className={styles.tagline}>planes que se comparten</span>}
    </span>
  );
}
