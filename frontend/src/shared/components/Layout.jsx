import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  DatabaseBackup,
  DollarSign,
  MonitorSmartphone,
  LayoutDashboard,
  LogOut,
  Package,
  Tags,
  Users
} from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/bracelets', label: 'Pulseiras', icon: Tags },
  { to: '/comanda', label: 'Comandas', icon: ClipboardList },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/inventory', label: 'Estoque', icon: Boxes },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/events', label: 'Eventos', icon: CalendarDays },
  { to: '/finance', label: 'Financeiro', icon: DollarSign },
  { to: '/intelligence', label: 'IA', icon: BrainCircuit },
  { to: '/devices', label: 'Conexao Mobile', icon: MonitorSmartphone },
  { to: '/backup', label: 'Backup', icon: DatabaseBackup },
  { to: '/reports', label: 'Relatorios', icon: BarChart3 }
];

export default function Layout() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
              CF
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-950">ComandaFlow</h1>
              <p className="truncate text-sm text-slate-500">{user?.name || 'Administrador'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sair"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        <nav className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 pb-3 lg:px-8">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-pill ${isActive ? 'nav-pill-active' : 'hover:bg-slate-100'}`
              }
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
