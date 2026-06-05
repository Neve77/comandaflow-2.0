import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/comanda', label: 'Comanda' },
  { to: '/products', label: 'Produtos' },
  { to: '/inventory', label: 'Estoque' },
  { to: '/clients', label: 'Clientes' },
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
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="panel p-5 lg:sticky lg:top-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Bem-vindo</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Olá, {user?.name || 'Administrador'}</h2>
                </div>
                <div className="space-y-2 rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-4">
                  <p className="text-sm text-slate-400">Painel otimizado para desktop.</p>
                  <p className="text-sm text-slate-400">Use os atalhos abaixo para navegar rápido.</p>
                </div>
                <div className="space-y-3">
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `nav-pill w-full justify-center ${isActive ? 'nav-pill-active' : 'text-slate-300 hover:bg-slate-800/80'}`
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden lg:block panel p-5">
              <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Dicas rápidas</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3">Monitore pedidos em tempo real.</li>
                <li className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3">Use relatórios para decisões rápidas.</li>
                <li className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3">Abra e feche comandas com poucos cliques.</li>
                <li className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3">Mantenha produtos e pulseiras organizados.</li>
              </ul>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="panel p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Painel administrativo</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Gerencie comandas e pedidos com mais velocidade</h2>
                  <p className="mt-2 text-slate-400">Navegue pelo menu à esquerda para acessar o dashboard, comanda, produtos e relatórios.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="status-chip bg-brand-600/15 text-brand-200">Desktop friendly</span>
                  <span className="status-chip bg-slate-700/80 text-slate-200">Interface ampla</span>
                </div>
              </div>
            </div>

            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
