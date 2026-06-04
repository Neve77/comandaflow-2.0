import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/comanda', label: 'Comanda' },
  { to: '/products', label: 'Produtos' },
  { to: '/reports', label: 'Relatórios' }
];

export default function Layout() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-8xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8 xl:px-10">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">comanda flow</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">Painel administrativo</h1>
              <span className="rounded-full bg-brand-600/15 px-3 py-1 text-xs font-semibold text-brand-200">Operador: {user?.name || 'Administrador'}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={logout}
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
            >
              Sair
            </button>
            <div className="rounded-full bg-slate-900/90 px-4 py-2 text-sm text-slate-300">Último login: agora</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-4 py-6 lg:px-8 xl:px-10">
        <div className="mb-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/95 p-5 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Acesso rápido</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Escolha a área e comece a operar</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-pill ${isActive ? 'nav-pill-active' : 'text-slate-300 hover:bg-slate-800/80'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
