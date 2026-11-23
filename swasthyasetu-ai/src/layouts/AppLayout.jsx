import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { DemoBadge } from '../components/ui/Badge';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pl-72">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-[1500px] p-4 pb-10 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-[10px]">
            <DemoBadge />
            <span className="text-slate-500">Fictional records · demonstration safety rules · not for clinical use</span>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
