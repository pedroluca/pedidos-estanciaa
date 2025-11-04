// import Logo from '../assets/estancia.png'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Simulate login API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (login === 'user' && password === 'pass') {
            resolve('Login successful')
          } else {
            reject(new Error('Invalid credentials'))
          }
        }, 1000)
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(String(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='flex flex-col md:flex-row items-center justify-center h-screen'>
      <section className='w-full h-1/3 md:w-1/2 md:h-full flex items-center justify-center bg-[#0D5745] rounded-b-4xl md:rounded-r-2xl md:rounded-bl-none'>
        {/* <img src={Logo} alt='Logo Procede' className='w-1/2 md:w-2/5 -mt-[10%] md:mt-0' /> */}
      </section>
      <section className='w-full h-2/3 md:w-1/2 md:h-full flex items-center justify-center'>
        <div className='-mt-[calc(100vh-130%)] md:mt-0 w-4/5 md:w-full max-w-md p-8 rounded-2xl shadow-lg border border-zinc-300/10 bg-zinc-900'>
          <h1 className='text-2xl font-semibold mb-6 text-center'>Entrar</h1>

          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <label className='flex flex-col'>
              <span className='text-sm text-zinc-400'>Usuário ou email</span>
              <input
                type='text'
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className='bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none'
                placeholder='seu.usuario@exemplo.com'
              />
            </label>

            <label className='flex flex-col relative'>
              <span className='text-sm text-zinc-400'>Senha</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none pr-10'
                placeholder='••••••••'
              />
              <button
                type='button'
                onClick={() => setShowPassword((s) => !s)}
                className='absolute right-2 top-8 p-1 text-zinc-500'
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>

            {error && <div className='text-sm text-red-600'>{error}</div>}

            <button
              type='submit'
              className="bg-[#0D5745] hover:bg-emerald-700 hover:cursor-pointer text-white px-4 py-2 rounded-lg mt-2 font-medium transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}