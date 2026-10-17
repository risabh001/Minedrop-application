import { site } from '../config/site.js';
import { applicationTypes } from '../config/applications.js';
import { getSessionUser } from '../utils/auth.js';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import PositionCard from '../components/PositionCard.jsx';

export default function Portal() {
  const sessionUser = getSessionUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 pt-16 pb-6">
          {sessionUser?.displayName && (
            <p className="text-drop-400 text-sm font-semibold mb-2">Welcome, {sessionUser.displayName}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink-50">Join the {site.shortName} Team</h1>
          <p className="text-ink-400 mt-3 max-w-2xl leading-relaxed">{site.portalIntro}</p>
        </section>

        <section className="max-w-5xl mx-auto px-5 pb-24">
          <div className="grid sm:grid-cols-2 gap-5 mt-6">
            {applicationTypes.map((type) => (
              <PositionCard key={type.id} type={type} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
