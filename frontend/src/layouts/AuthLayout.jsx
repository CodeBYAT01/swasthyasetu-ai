import Logo from '../components/brand/Logo';
import HealthIllustration from '../components/brand/HealthIllustration';
import { DemoBadge } from '../components/ui/Badge';
import { useI18n } from '../context/I18nContext';

export default function AuthLayout({ children }) {
  const { t, language, languages, setLanguage } = useI18n();
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between">
          <Logo />
          <select
            aria-label={t('language')}
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm"
          >
            {languages.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
          </select>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[460px]">{children}</div>
        </div>
        <p className="text-center text-[11px] text-slate-500 sm:text-left">
          © {new Date().getFullYear()} SwasthyaSetu AI · {t('demoNotice')}
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sky-50 lg:flex lg:items-center lg:justify-center">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative w-full max-w-xl px-10">
          <div className="mb-5 flex items-center gap-3"><DemoBadge /><span className="text-xs font-medium text-slate-500">Hackathon demonstration build</span></div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-4xl">
            Care that begins with <span className="text-brand-600">being heard.</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">{t('tagline')}</p>
          <HealthIllustration className="mx-auto mt-6 w-full max-w-lg" />
          <div className="mt-2 grid grid-cols-3 gap-3">
            {[
              ['Voice-first', 'ಕನ್ನಡ / हिन्दी'],
              ['Offline-ready', 'Local records'],
              ['Safety checks', 'Human review'],
            ].map(([title, subtitle]) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white/80 p-3 text-center shadow-sm">
                <p className="text-xs font-bold text-slate-800">{title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
