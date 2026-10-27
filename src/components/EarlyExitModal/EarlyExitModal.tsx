import React from 'react';
import styles from './EarlyExitModal.module.css';

interface EarlyExitModalProps {
  isOpen: boolean;
  actionType: 'skip' | 'reset';
  onConfirmRecord: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const EarlyExitModal: React.FC<EarlyExitModalProps> = ({
  isOpen,
  actionType,
  onConfirmRecord,
  onDiscard,
  onCancel,
}) => {
  if (!isOpen) return null;

  const actionText = actionType === 'skip' ? 'pular' : 'reiniciar';

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-exit-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div className={styles.modal}>
        <h2 id="early-exit-title" className={styles.title}>
          Registrar como interrompido?
        </h2>
        <p className={styles.description}>
          Você escolheu {actionText} o ciclo atual. Deseja salvar o tempo já transcorrido no seu histórico como sessão interrompida ou prefere apenas descartar?
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.recordButton}
            onClick={onConfirmRecord}
            id="early-exit-record"
          >
            Sim, registrar no histórico
          </button>
          <button
            type="button"
            className={styles.discardButton}
            onClick={onDiscard}
            id="early-exit-discard"
          >
            Não, apenas descartar
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            id="early-exit-cancel"
          >
            Continuar focado (Cancelar)
          </button>
        </div>
      </div>
    </div>
  );
};
