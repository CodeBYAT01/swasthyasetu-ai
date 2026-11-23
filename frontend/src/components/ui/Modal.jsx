import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative z-10 max-h-[90vh] w-full ${widths[size]} overflow-y-auto rounded-2xl bg-white shadow-2xl animate-fadeUp`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', tone = 'primary', loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={tone} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
    </Modal>
  );
}
