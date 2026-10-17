export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative panel p-7 w-full max-w-md"
      >
        <h2 id="modal-title" className="text-xl font-semibold text-ink-50">
          {title}
        </h2>
        <div className="mt-3 text-ink-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
