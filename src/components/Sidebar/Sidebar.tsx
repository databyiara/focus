import React from 'react';
import {
  Timer as TimerIcon,
  CheckSquare as TasksIcon,
  History as HistoryIcon,
  BarChart2 as StatsIcon,
  Settings as SettingsIcon,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/app';
import styles from './Sidebar.module.css';

export type NavTab = 'pomodoro' | 'tasks' | 'history' | 'stats' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ size: number; strokeWidth: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'pomodoro', label: 'Foco', icon: TimerIcon },
  { id: 'tasks', label: 'Tarefas', icon: TasksIcon },
  { id: 'history', label: 'Histórico', icon: HistoryIcon },
  { id: 'stats', label: 'Stats', icon: StatsIcon },
  { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <>
      {/* Desktop Sidebar (>= 900px) */}
      <aside className={styles.sidebar} aria-label="Menu principal">
        <div className={styles.logoArea}>
          <span className={styles.logoText}>{APP_CONFIG.name}</span>
        </div>
        <nav className={styles.navList} aria-label="Navegação desktop">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id} className={styles.navItem}>
                  <button
                    type="button"
                    className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}
                    onClick={() => onSelectTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    <span className={styles.navLabel}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Bottom Nav (< 900px) */}
      <nav className={styles.mobileNav} aria-label="Navegação móvel inferior">
        <ul className={styles.mobileNavList}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} className={styles.mobileNavItem}>
                <button
                  type="button"
                  className={`${styles.mobileNavButton} ${isActive ? styles.mobileNavButtonActive : ''}`}
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                  <span className={styles.mobileNavLabel}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};
