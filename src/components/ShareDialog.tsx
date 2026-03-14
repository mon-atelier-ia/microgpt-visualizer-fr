import { type RefObject, memo } from "react";
import { QR_PATH } from "./qrPath";

interface ShareDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
}

function ShareDialogInner({ dialogRef }: ShareDialogProps) {
  const close = () => dialogRef.current?.close();
  return (
    <dialog
      ref={dialogRef}
      className="share-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onCancel={close}
    >
      <div className="share-dialog__content">
        <p className="share-dialog__title">Partager</p>
        <svg
          className="share-dialog__qr"
          role="img"
          aria-label="QR code vers microgpt-visualizer-fr.vercel.app"
          viewBox="0 0 29 29"
        >
          <defs>
            <radialGradient id="qr-grad" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="var(--text)" />
              <stop offset="100%" stopColor="var(--blue)" />
            </radialGradient>
          </defs>
          <path fill="url(#qr-grad)" d={QR_PATH} />
        </svg>
        <p className="share-dialog__url">microgpt-visualizer-fr.vercel.app</p>
        <button type="button" className="btn btn-secondary" onClick={close}>
          Fermer
        </button>
      </div>
    </dialog>
  );
}

const ShareDialog = memo(ShareDialogInner);
export default ShareDialog;
