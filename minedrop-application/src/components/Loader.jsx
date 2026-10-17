export default function Loader({ label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span>{label}</span>
    </span>
  );
}
