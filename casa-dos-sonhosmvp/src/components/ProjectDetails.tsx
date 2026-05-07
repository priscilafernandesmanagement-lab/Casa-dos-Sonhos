import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  ArrowLeft, CheckCircle2, Circle, DollarSign, Edit3, 
  Plus, Save, Trash2, MapPin, TrendingUp, 
  Wrench, Layers, AlertCircle, PieChart as PieIcon, BarChart3,
  Clock, Link as LinkIcon, Image as ImageIcon, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { Project, BudgetSheet, ProgressLog, Reference } from '../types';
import FinancialPhase from './phases/FinancialPhase';
import LandPhase from './phases/LandPhase';
import DefinitionPhase from './phases/DefinitionPhase';
import BudgetPhase from './phases/BudgetPhase';
import ProgressPhase from './phases/ProgressPhase';
import ProjectDashboard from './phases/ProjectDashboard';

const COLORS = ['#3D5A3E', '#B8965A', '#8B7355', '#6A8F5C', '#9A7A3A', '#2C3B2D'];

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(-1);

  const phases = [
    { label: '0. Financeiro', icon: DollarSign },
    { label: '1. Terreno', icon: MapPin },
    { label: '2. Definição', icon: Layers },
    { label: '3. Orçamento', icon: PieIcon },
    { label: '4. Progresso', icon: TrendingUp },
  ];

  useEffect(() => {
    if (!id) return;
    const projectRef = doc(db, 'constructions', id);
    const unsubscribeProject = onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        setProject({ ...doc.data(), id: doc.id } as Project);
        setLoading(false);
      } else {
        navigate('/');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `constructions/${id}`));

    return () => unsubscribeProject();
  }, [id, navigate]);

  if (loading || !project) {
    return <div className="animate-pulse text-center py-20 font-serif text-[#8B7355]">Carregando seu sonho...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <button onClick={() => navigate('/')} className="p-4 bg-white border border-[#8B7355]/20 rounded-2xl text-[#3D5A3E] hover:bg-[#EEF5E8] transition-all shadow-sm active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-4xl text-[#2C2820] leading-tight">{project.title}</h1>
          <p className="text-[#8B7355] mt-1 font-serif italic text-lg">{project.landInfo?.location || 'Localização a ser definida'}</p>
        </div>
        <div className="bg-[#1A2E1B] px-6 py-4 rounded-[2rem] text-white shadow-xl">
           <span className="text-[10px] font-bold text-[#D4E4C8] uppercase tracking-[3px] block mb-1">Total Investido</span>
           <p className="text-2xl font-serif">{formatCurrency(project.spent || 0)}</p>
        </div>
      </div>

      <div className="flex bg-[#FAF7F0]/50 backdrop-blur-md p-2 rounded-[2.5rem] border border-[#8B7355]/10 overflow-x-auto no-scrollbar gap-2 mb-8 shadow-sm">
        <button 
           onClick={() => setActivePhase(-1)}
           className={cn(
             "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
             activePhase === -1 
               ? "bg-[#3D5A3E] text-white shadow-lg scale-105" 
               : "bg-white text-[#8B7355] border border-[#8B7355]/10 hover:border-[#3D5A3E]"
           )}
        >
          <BarChart3 size={16} /> Resumo
        </button>
        {phases.map((ph, i) => (
          <button
            key={i}
            onClick={() => setActivePhase(i)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activePhase === i 
                ? "bg-[#3D5A3E] text-white shadow-lg scale-105" 
                : "bg-white text-[#8B7355] border border-[#8B7355]/10 hover:border-[#3D5A3E]"
            )}
          >
            <ph.icon size={16} />
            {ph.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activePhase}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           className="min-h-[400px]"
        >
          {activePhase === -1 && <ProjectDashboard project={project} />}
          {activePhase === 0 && <FinancialPhase project={project} />}
          {activePhase === 1 && <LandPhase project={project} />}
          {activePhase === 2 && <DefinitionPhase project={project} />}
          {activePhase === 3 && <BudgetPhase project={project} />}
          {activePhase === 4 && <ProgressPhase project={project} />}
        </motion.div>
      </AnimatePresence>

      <ReferencesSection projectId={project.id} />
    </div>
  );
}

function ReferencesSection({ projectId }: { projectId: string }) {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRef, setNewRef] = useState({ title: '', type: 'link', url: '', description: '' });

  useEffect(() => {
    const q = query(collection(db, 'constructions', projectId, 'references'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRefs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reference[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `constructions/${projectId}/references`));
    return () => unsubscribe();
  }, [projectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'constructions', projectId, 'references'), newRef);
      setNewRef({ title: '', type: 'link', url: '', description: '' });
      setShowAdd(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `constructions/${projectId}/references`);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 border border-[#8B7355]/10 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[#3D5A3E]" />
          <h2 className="font-serif text-3xl">Gabinete de Referências</h2>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="text-[#3D5A3E] text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:underline"
        >
          <Plus size={16} /> {showAdd ? 'Cancelar' : 'Nova Referência'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
             <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FAF7F0] p-8 rounded-3xl mb-8">
                <div>
                   <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-widest mb-2">Título</label>
                   <input required value={newRef.title} onChange={e => setNewRef({...newRef, title: e.target.value})} className="w-full bg-white p-4 rounded-xl outline-none" placeholder="Ex: Inspiração Fachada" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-widest mb-2">Tipo</label>
                   <select value={newRef.type} onChange={e => setNewRef({...newRef, type: e.target.value as any})} className="w-full bg-white p-4 rounded-xl outline-none">
                     <option value="link">Link</option>
                     <option value="image">Imagem (URL)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-widest mb-2">URL</label>
                   <input required value={newRef.url} onChange={e => setNewRef({...newRef, url: e.target.value})} className="w-full bg-white p-4 rounded-xl outline-none" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-widest mb-2">Descrição</label>
                   <input value={newRef.description} onChange={e => setNewRef({...newRef, description: e.target.value})} className="w-full bg-white p-4 rounded-xl outline-none" />
                </div>
                <div className="flex items-end">
                   <button type="submit" className="bg-[#3D5A3E] text-white w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Adicionar</button>
                </div>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {refs.map(ref => (
          <div key={ref.id} className="bg-[#FAF7F0] rounded-2xl p-4 group relative overflow-hidden flex flex-col">
            {ref.type === 'image' ? (
              <img src={ref.url} alt={ref.title} className="w-full h-32 object-cover rounded-xl mb-3 shadow-inner" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-32 bg-white rounded-xl mb-3 flex items-center justify-center text-[#3D5A3E]">
                <LinkIcon size={32} />
              </div>
            )}
            <h4 className="font-serif font-bold text-[#1A2E1B] truncate">{ref.title}</h4>
            <p className="text-xs text-[#8B7355] line-clamp-2 mt-1">{ref.description}</p>
            <div className="mt-4 flex gap-4">
              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest hover:underline flex items-center gap-1">
                {ref.type === 'image' ? <ImageIcon size={12} /> : <LinkIcon size={12} />} Ver Origem
              </a>
              <button 
                onClick={() => deleteDoc(doc(db, 'constructions', projectId, 'references', ref.id))}
                className="text-[10px] font-bold text-red-300 hover:text-red-600 uppercase tracking-widest ml-auto"
              >Excluir</button>
            </div>
          </div>
        ))}

        {refs.length === 0 && (
          <div className="col-span-full py-20 text-center text-[#8B7355] italic">
            Nenhuma referência salva ainda. Guarde inspirações, catálogos e orçamentos aqui.
          </div>
        )}
      </div>
    </div>
  );
}
