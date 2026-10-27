import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenSettings?: () => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    // Sincroniza a cada minuto para atualizar viradas de dia
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Formato por extenso: "Quinta-feira, 15 de outubro"
  const rawDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(currentDate);

  const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const todayISO = currentDate.toISOString().split('T')[0];

  return (
    <header className={styles.header} role="banner">
      <time className={styles.dateDisplay} dateTime={todayISO}>
        {formattedDate}
      </time>
    </header>
  );
};
