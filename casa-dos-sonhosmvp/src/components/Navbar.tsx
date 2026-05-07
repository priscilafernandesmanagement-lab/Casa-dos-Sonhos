import { auth } from '../lib/firebase';
import { signOut, User } from 'firebase/auth';
import { LogOut, Home, Construction } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user }: { user: User }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-[#8B7355]/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#3D5A3E] rounded-lg flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
            <Home size={22} />
          </div>
          <div>
            <span className="block font-serif text-xl font-semibold leading-none">Casa dos Sonhos</span>
            <span className="text-[10px] text-[#8B7355] font-medium uppercase tracking-[2px]">Painel de Controle</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-medium text-[#8B7355] uppercase tracking-wider">Usuário</span>
            <span className="text-sm font-medium text-[#2C2820]">{user.email}</span>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-[#7A6E5F] hover:text-[#3D5A3E] transition-colors border border-transparent hover:border-[#3D5A3E]/20 rounded-lg"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium uppercase tracking-wider hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
