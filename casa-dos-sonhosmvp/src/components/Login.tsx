import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações de segurança
    if (!email.trim()) {
      setError('E-mail é obrigatório.');
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('E-mail inválido.');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Senha é obrigatória.');
      setLoading(false);
      return;
    }
    if (password.length > 128) {
      setError('Senha muito longa.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Credenciais inválidas ou erro de conexão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#8B7355]/20 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3D5A3E] to-[#B8965A]" />
        
        <div className="flex flex-col items-center mb-8">
          <Building2 className="w-12 h-12 text-[#3D5A3E] mb-4" />
          <h1 className="font-serif text-3xl font-light text-[#2C2820] text-center">
            Casa dos <em className="italic text-[#9A7A3A]">Sonhos</em>
          </h1>
          <p className="text-[#7A6E5F] text-sm uppercase tracking-widest mt-2">Bem-vindo de volta</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-6 border border-red-100 italic">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-[#8B7355] uppercase tracking-wider mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF7F0] border-l-3 border-[#3D5A3E] rounded-r-lg outline-none font-serif italic text-lg"
              placeholder="seu@lar.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B7355] uppercase tracking-wider mb-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F0] border-l-3 border-[#B8965A] rounded-r-lg outline-none font-serif italic text-lg"
                placeholder="********"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3D5A3E] text-white py-4 rounded-xl font-medium uppercase tracking-[3px] hover:bg-[#2C3B2D] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Acessar Obra'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-[#8B7355] text-sm italic">
                Ainda não começou sua obra? <Link to="/signup" className="text-[#3D5A3E] font-medium not-italic hover:underline underline-offset-4">Cadastre-se</Link>
            </p>
        </div>
      </motion.div>
    </div>
  );
}
