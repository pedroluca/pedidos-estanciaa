import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, senha);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-zinc-950">
      <section className="w-full h-1/3 md:w-1/2 md:h-screen flex items-center justify-center bg-[#0D5745] rounded-b-4xl md:rounded-r-2xl md:rounded-bl-none">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-2">Floricultura</h1>
          <h2 className="text-2xl">Estância-A</h2>
        </div>
      </section>
      
      <section className="w-full h-2/3 md:w-1/2 md:h-screen flex items-center justify-center">
        <div className="w-4/5 md:w-full max-w-md p-8 rounded-2xl shadow-lg border border-zinc-800 bg-zinc-900">
          <h1 className="text-2xl font-semibold mb-6 text-center text-white">Entrar</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col">
              <span className="text-sm text-zinc-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                placeholder="seu.email@exemplo.com"
                required
              />
            </label>

            <label className="flex flex-col relative">
              <span className="text-sm text-zinc-400">Senha</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none pr-10 text-white"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-8 p-1 text-zinc-500"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <button
              type="submit"
              className="bg-[#0D5745] hover:bg-emerald-700 hover:cursor-pointer text-white px-4 py-2 rounded-lg mt-2 font-medium transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/painel" className="text-sm text-zinc-400 hover:text-zinc-300">
              Ver Painel de Produção
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
