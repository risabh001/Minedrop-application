import { Link } from 'react-router-dom';
import { iconByName, HammerIcon, ArrowRightIcon } from './Icons.jsx';

export default function PositionCard({ type }) {
  const Icon = iconByName[type.icon] || HammerIcon;

  return (
    <Link
      to={`/apply/${type.id}`}
      className="panel p-7 flex flex-col gap-4 hover:border-drop-400 transition-colors group"
    >
      <div className="w-11 h-11 rounded-lg bg-ink-800 border border-ink-600 flex items-center justify-center text-drop-400 text-xl">
        <Icon />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-ink-50">{type.label}</h3>
        <p className="text-ink-400 text-sm mt-1.5 leading-relaxed">{type.shortDescription}</p>
      </div>
      <span className="flex items-center gap-1.5 text-drop-400 text-sm font-semibold mt-auto pt-2 group-hover:gap-2.5 transition-all">
        Start application <ArrowRightIcon />
      </span>
    </Link>
  );
}
