import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-5 py-24 text-center">
      <h1 className="text-3xl font-semibold text-ink-50">Page not found</h1>
      <p className="text-ink-400 mt-3">That page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-8 inline-flex">Back to login</Link>
    </div>
  );
}
