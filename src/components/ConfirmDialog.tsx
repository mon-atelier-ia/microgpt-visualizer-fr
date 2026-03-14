import { type RefObject, memo } from "react";

interface ConfirmDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogInner({
  dialogRef,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <dialog ref={dialogRef} className="confirm-dialog" onCancel={onCancel}>
      <div className="confirm-dialog__content">
        <p className="confirm-dialog__title">Changer de jeu de données ?</p>
        <p className="confirm-dialog__message">
          L&apos;entraînement sera réinitialisé. Les poids appris seront perdus.
        </p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            Réinitialiser
          </button>
        </div>
      </div>
    </dialog>
  );
}

const ConfirmDialog = memo(ConfirmDialogInner);
export default ConfirmDialog;
