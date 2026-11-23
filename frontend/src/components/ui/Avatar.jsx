import { initials } from '../../utils/formatters';

export function Avatar({ name = '', size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-xs', lg: 'h-12 w-12 text-sm' };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 ${sizes[size]} ${className}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
