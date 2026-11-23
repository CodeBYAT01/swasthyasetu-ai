const BARS = [14, 28, 42, 22, 50, 34, 18, 46, 30, 56, 24, 40, 16, 48, 28, 38, 20, 52, 32, 18, 44, 26, 36, 14];

export default function Waveform({ active = false, className = '' }) {
  return (
    <div className={`flex h-16 items-center justify-center gap-1 ${className}`} aria-hidden="true">
      {BARS.map((height, index) => (
        <span
          key={index}
          className={`w-1.5 rounded-full transition-all duration-300 ${active ? 'animate-wave bg-brand-500' : 'bg-slate-200'}`}
          style={{ height: `${height}px`, animationDelay: `${(index % 8) * 0.09}s` }}
        />
      ))}
    </div>
  );
}
