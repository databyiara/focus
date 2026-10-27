import React, { useState, useEffect, useRef } from 'react';
import styles from './OnboardingModal.module.css';

interface OnboardingModalProps {
  isOpen: boolean;
  onConfirm: (name: string) => void;
  onSkip: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onConfirm,
  onSkip,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-foco suave ao abrir
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onSkip();
    }
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.brandBadge}>Bem-vindo ao Focus</span>
          <h2 id="onboarding-title" className={styles.title}>
            Como devemos te chamar?
          </h2>
          <p className={styles.description}>
            Usamos seu nome para personalizar suas saudações diárias. Você pode alterar isso a qualquer momento em Ajustes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="user-name-input" className={styles.inputLabel}>
              Seu nome ou apelido
            </label>
            <input
              id="user-name-input"
              ref={inputRef}
              type="text"
              maxLength={40}
              className={styles.textInput}
              placeholder="Ex: Sofia, Lucas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryButton}
              id="onboarding-continue-button"
            >
              Continuar
            </button>
            <button
              type="button"
              className={styles.skipButton}
              id="onboarding-skip-button"
              onClick={onSkip}
            >
              Pular por enquanto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
