import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@comanda.local');
  const [password, setPassword] = useState('Pass@1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_20%),linear-gradient(180deg,#05070f_0%,#070b14_100%)] px-4 py-8">
      <div className="w-full max-w-xl lg:max-w-2xl rounded-[2rem] border border-slate-800/80 bg-slate-950/95 p-8 shadow-[0_40px_120px_-80px_rgba(15,23,42,0.9)] backdrop-blur-xl">
        <div className="mb-8 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.35em] text-slate-500">Painel de controle</span>
          <h1 className="text-4xl font-semibold text-white">Acesse seu ambiente</h1>
          <p className="max-w-full lg:max-w-2xl text-slate-400">Entre com sua conta para gerenciar comandas, pulseiras e relatórios de vendas de forma rápida e intuitiva.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Email</span>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Senha</span>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[1.5rem] bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-500"
          >
            {loading ? 'Entrando...' : 'Conectar'}
          </button>
        </form>
      </div>
    </div>
  );
}
