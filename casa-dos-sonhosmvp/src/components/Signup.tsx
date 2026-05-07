import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [constructionName, setConstructionName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const now = new Date().toISOString();
      
      // Save profile
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name,
        constructionName,
        email,
        createdAt: now,
      });

      // Create initial construction
      await addDoc(collection(db, 'constructions'), {
        ownerId: user.uid,
        title: constructionName || `Obra de ${name}`,
        status: 'planning',
        budget: 0,
        spent: 0,
        address: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por E-mail/Senha não está ativo no Firebase Console. Vá em Authentication > Sign-in method e ative-o.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso por outra conta.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta. Verifique sua conexão ou as regras do banco de dados.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl border border-[#8B7355]/20 relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B8965A] to-[#3D5A3E]" />
        
        <div className="flex flex-col items-center mb-8">
          <Sparkles className="w-10 h-10 text-[#9A7A3A] mb-3" />
          <h1 className="font-serif text-3xl font-light text-[#2C2820]">
            Inicie seu <em className="italic text-[#3D5A3E]">Projeto</em>
          </h1>
          <p className="text-[#7A6E5F] text-xs uppercase tracking-[3px] mt-2">Dê o primeiro passo</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-6 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#8B7355] uppercase tracking-wider mb-2">Seu Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF7F0] border-l-3 border-[#3D5A3E] rounded-r-lg outline-none font-serif italic text-lg"
              placeholder="Ex: Priscila Greco"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#8B7355] uppercase tracking-wider mb-2">Nome da Obra / Para quem?</label>
            <input
              type="text"
              value={constructionName}
              onChange={(e) => setConstructionName(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF7F0] border-l-3 border-[#B8965A] rounded-r-lg outline-none font-serif italic text-lg"
              placeholder="Ex: Minha Casa de Campo"
              required
            />
          </div>

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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full bg-[#3D5A3E] text-white py-4 rounded-xl font-medium uppercase tracking-[3px] hover:bg-[#2C3B2D] transition-all shadow-lg active:scale-[0.98] mt-4"
          >
            {loading ? 'Preparando terreno...' : 'Começar Agora'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-[#8B7355] text-sm italic">
                Já possui um projeto ativo? <Link to="/login" className="text-[#3D5A3E] font-medium not-italic hover:underline underline-offset-4">Acesse sua conta</Link>
            </p>
        </div>
      </motion.div>
    </div>
  );
}
