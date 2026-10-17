import { site } from '../config/site.js';

export default function Footer() {
  return (
    <footer className="border-t border-ink-700 mt-20">
      <div className="max-w-5xl mx-auto px-5 py-8 text-center text-ink-500 text-sm space-y-1">
        <p>{site.orgName} · Applications are reviewed confidentially</p>
        <p>Copyright © 2026 {site.orgName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
