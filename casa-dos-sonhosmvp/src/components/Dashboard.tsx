import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Construction as Cone, MapPin, DollarSign, Sparkles, Building2, TrendingUp, CheckCircle2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import PhaseGuide from './PhaseGuide';
import { Project } from '../types';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'works' | 'roadmap'>('roadmap');
  const navigate = useNavigate();

  const totalBudget = projects.reduce((acc, p) => {
    const landCost = p.financial?.land?.hasLand ? 0 : 
      ((p.financial?.land?.estimatedCost || 0) + 
       (p.financial?.land?.docsCost || 0) + 
       (p.financial?.land?.taxesCost || 0) + 
       (p.financial?.land?.feesCost || 0));
    return acc + (p.financial?.maxBudget || 0) + landCost;
  }, 0);

  const totalSpent = projects.reduce((acc, p) => {
    const landCost = p.financial?.land?.hasLand ? 0 : 
      ((p.financial?.land?.estimatedCost || 0) + 
       (p.financial?.land?.docsCost || 0) + 
       (p.financial?.land?.taxesCost || 0) + 
       (p.financial?.land?.feesCost || 0));
    return acc + (p.spent || 0) + landCost;
  }, 0);
  const totalRemaining = totalBudget - totalSpent;
  const globalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'constructions'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'constructions');
    });

    return unsubscribe;
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !auth.currentUser) return;

    try {
      if (editingProject) {
        await updateDoc(doc(db, 'constructions', editingProject.id), {
          title: newTitle,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'constructions'), {
          ownerId: auth.currentUser.uid,
          title: newTitle,
          status: 'planning',
          budget: 0,
          spent: 0,
          address: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setNewTitle('');
      setShowAddModal(false);
      setEditingProject(null);
      if (!editingProject) setActiveTab('works');
    } catch (error) {
      handleFirestoreError(error, editingProject ? OperationType.UPDATE : OperationType.CREATE, 'constructions');
    }
  };

  const startEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setNewTitle(project.title);
    setShowAddModal(true);
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir esta obra? Todos os dados vinculados (fases, progressos, custos locais) serão apagados, mas o histórico global de fornecedores e materiais será mantido.')) return;

    try {
      // Subcollections to clean up
      const subcollections = ['budgetSheets', 'progressLogs', 'references'];
      
      // Note: This is a shallow cleanup for a prototype. 
      // Ideally this happens in a Cloud Function to ensure atomicity and handle depth.
      for (const sub of subcollections) {
        const q = query(collection(db, 'constructions', projectId, sub));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      }

      await deleteDoc(doc(db, 'constructions', projectId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `constructions/${projectId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'in-progress': return 'bg-green-50 text-green-700 border border-green-100';
      case 'halted': return 'bg-red-50 text-red-700 border border-red-100';
      case 'completed': return 'bg-blue-50 text-blue-700 border border-blue-100';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planejamento';
      case 'in-progress': return 'Em Obra';
      case 'halted': return 'Pausada';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  const activePhaseFor = (project: Project) => {
    if (!project.financial) return 0;
    if (!project.landInfo) return 1;
    if (!project.definition) return 2;
    if (project.spent === 0) return 3;
    return 4;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D5A3E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#8B7355]/10 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[#9A7A3A]" />
            <span className="text-[#8B7355] font-medium uppercase tracking-[3px] text-[10px]">A jornada começou</span>
          </div>
          <h1 className="font-serif text-5xl font-light text-[#2C2820]">
            Suas <em className="italic text-[#9A7A3A]">Construções</em>
          </h1>
        </div>
        
        <div className="flex bg-white/50 p-1 rounded-2xl border border-[#8B7355]/10 self-stretch md:self-auto shadow-sm">
          <button 
            onClick={() => setActiveTab('roadmap')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'roadmap' ? 'bg-[#3D5A3E] text-white shadow-md scale-105' : 'text-[#8B7355] hover:bg-white'}`}
          >
            Roteiro
          </button>
          <button 
            onClick={() => setActiveTab('works')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'works' ? 'bg-[#3D5A3E] text-white shadow-md scale-105' : 'text-[#8B7355] hover:bg-white'}`}
          >
            Minhas Obras
          </button>
        </div>
      </header>

      <div className="flex-1">
        {activeTab === 'roadmap' ? (
          <section className="space-y-12">
            <div className="bg-[#1A2E1B] p-10 rounded-[3rem] text-[#F8F3EC] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Building2 size={160} />
              </div>
              <div className="max-w-2xl relative z-10">
                <h3 className="font-serif text-4xl mb-4 leading-tight">Por que construir em etapas?</h3>
                <p className="text-[#D4E4C8] text-lg leading-relaxed mb-10 font-serif italic">
                  "O segredo de grandes realizações é o planejamento dividido. Construir em fases permite que você more no seu sonho mais cedo, sem se endividar para sempre."
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#B8965A] text-[#1A2E1B] px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#D4B078] transition-all shadow-lg active:scale-95"
                  >
                    Começar meu Planejamento
                  </button>
                  <button 
                    onClick={() => setActiveTab('works')}
                    className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all shadow-lg active:scale-95"
                  >
                    Dar continuidade ao planejamento
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="text-[#3D5A3E]" size={24} />
                <h2 className="font-serif text-2xl">O Guia da <em className="italic text-[#9A7A3A]">Construção Inteligente</em></h2>
              </div>
              <PhaseGuide />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-[#B8965A]" size={24} />
              <h2 className="font-serif text-2xl">Sua Jornada em <em className="italic text-[#9A7A3A]">Tempo Real</em></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.length > 0 ? (
                projects.slice(0, 2).map(p => {
                  const currentPhaseIndex = activePhaseFor(p);
                  const phaseNames = ['Financeiro', 'Terreno', 'Definição', 'Orçamento', 'Progresso'];
                  const checklist = [
                    { label: 'Finanças', done: !!p.financial },
                    { label: 'Terreno', done: !!p.landInfo },
                    { label: 'Planta', done: !!p.definition },
                    { label: 'Orçamentos', done: (p.spent || 0) > 0 },
                  ];
                  
                  return (
                    <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-[#8B7355]/10 shadow-sm flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                          <h4 className="font-serif text-xl">{p.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest">{p.overallProgress || 0}% Total</span>
                            <div className="flex items-center gap-1">
                               <button 
                                 onClick={(e) => startEditProject(p, e)}
                                 className="p-1.5 text-blue-300 hover:text-blue-600 transition-colors"
                               >
                                 <Sparkles size={14} />
                               </button>
                            </div>
                          </div>
                       </div>
                       
                       <div className="space-y-6 flex-1">
                          <div>
                            <p className="text-[9px] font-bold text-[#8B7355] uppercase tracking-widest mb-2">Fase Atual</p>
                            <div className="flex items-center gap-3 bg-[#FAF7F0] p-4 rounded-2xl border border-[#3D5A3E]/5">
                               <div className="w-8 h-8 rounded-full bg-[#3D5A3E] text-white flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-sm">
                                 {currentPhaseIndex}
                               </div>
                               <span className="font-serif text-lg text-[#1A2E1B]">{phaseNames[currentPhaseIndex]}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                             {checklist.map((item, i) => (
                               <div key={i} className="flex items-center gap-2 text-xs">
                                 <div className={cn(
                                   "w-4 h-4 rounded-full flex items-center justify-center border",
                                   item.done ? "bg-[#3D5A3E] border-[#3D5A3E] text-white" : "border-[#8B7355]/30 text-transparent"
                                 )}>
                                   <CheckCircle2 size={10} />
                                 </div>
                                 <span className={cn(item.done ? "text-[#1A2E1B] font-medium" : "text-[#8B7355]")}>
                                   {item.label}
                                 </span>
                               </div>
                             ))}
                          </div>

                          <div className="w-full h-1.5 bg-[#FAF7F0] rounded-full overflow-hidden">
                             <div className="h-full bg-[#3D5A3E] rounded-full transition-all duration-1000" style={{ width: `${p.overallProgress || 0}%` }} />
                          </div>

                          <button 
                            onClick={() => navigate(`/project/${p.id}`)}
                            className="w-full py-4 bg-[#1A2E1B] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#3D5A3E] transition-all shadow-lg active:scale-95"
                          >
                            Ir para Detalhes e Agenda
                          </button>
                       </div>
                    </div>
                  );
                })
              ) : (
                <div className="md:col-span-2 bg-[#FAF7F0] p-10 rounded-[2.5rem] border border-dashed border-[#8B7355]/20 text-center">
                  <p className="font-serif text-lg text-[#8B7355]">Você ainda não tem obras cadastradas no seu roteiro.</p>
                  <button onClick={() => setShowAddModal(true)} className="mt-4 text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest hover:underline">Começar agora</button>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="space-y-10">
            {projects.length > 0 && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm space-y-6">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-[3px] mb-1">Investimento Global</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-serif text-[#3D5A3E]">{formatCurrency(totalSpent)}</span>
                        <span className="text-sm text-[#8B7355] italic">investidos de {formatCurrency(totalBudget)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest mb-1">Restante Total</p>
                       <span className={cn("text-xl font-serif font-bold", totalRemaining < 0 ? "text-red-500" : "text-[#B8965A]")}>
                         {formatCurrency(totalRemaining)}
                       </span>
                    </div>
                 </div>
                 
                 <div className="relative h-4 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#8B7355]/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, globalPercent)}%` }}
                      className={cn(
                        "h-full transition-all duration-1000 rounded-full shadow-inner",
                        globalPercent > 100 ? "bg-red-500" : globalPercent > 80 ? "bg-amber-500" : "bg-[#3D5A3E]"
                      )}
                    />
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div 
                onClick={() => setShowAddModal(true)}
                className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#8B7355]/20 rounded-[2.5rem] hover:bg-white transition-colors cursor-pointer group"
              >
                <div className="w-16 h-16 bg-[#EEF5E8] rounded-full flex items-center justify-center text-[#3D5A3E] mb-4 group-hover:scale-110 transition-transform">
                  <Plus size={32} />
                </div>
                <h3 className="font-serif text-2xl text-[#7A6E5F]">Nova Obra</h3>
                <p className="text-[#8B7355] mt-2 italic text-sm">Adicione um novo projeto de vida</p>
              </div>

              {projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group cursor-pointer bg-white border border-[#8B7355]/15 rounded-[2.5rem] p-7 hover:shadow-2xl transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-[#3D5A3E]">
                    <Cone size={64} />
                  </div>

                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] shadow-sm w-fit ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                      <span className="text-[#8B7355] text-[10px] font-serif italic">
                        Início: {formatDate(project.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={(e) => startEditProject(project, e)}
                         className="p-2 bg-blue-50 text-blue-300 hover:text-blue-600 rounded-xl transition-all"
                       >
                         <Sparkles size={16} />
                       </button>
                    </div>
                  </div>

                  <h2 className="font-serif text-3xl font-semibold mb-6 text-[#2C2820] group-hover:text-[#3D5A3E] transition-colors line-clamp-1 leading-tight">
                    {project.title}
                  </h2>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-3 text-sm text-[#7A6E5F]">
                      <div className="p-2 bg-[#FAF7F0] rounded-lg text-[#3D5A3E]"><MapPin size={16} /></div>
                      <span className="truncate italic">{project.address || 'Localização a definir'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#7A6E5F]">
                      <div className="p-2 bg-[#F8F3EC] rounded-lg text-[#9A7A3A]"><DollarSign size={16} /></div>
                      <span>Investimento: <strong className="text-[#2C2820] font-bold">{formatCurrency(project.spent || 0)}</strong></span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#8B7355]/10 flex justify-between items-center text-[#3D5A3E] font-bold text-xs uppercase tracking-[2px]">
                    <span>Log da Obra</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#3D5A3E] via-[#B8965A] to-[#3D5A3E]" />
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-16 h-16 bg-[#EEF5E8] rounded-2xl flex items-center justify-center text-[#3D5A3E] mb-4">
                <Cone size={32} />
              </div>
              <h2 className="font-serif text-3xl text-[#2C2820]">{editingProject ? 'Renomear' : 'Iniciar'} <em className="italic text-[#9A7A3A]">{editingProject ? 'Obra' : 'Nova Obra'}</em></h2>
              <p className="text-[#8B7355] text-xs uppercase tracking-[3px] mt-2">{editingProject ? 'Ajuste os alicerces' : 'Fundação do seu projeto'}</p>
            </div>
            
            <form onSubmit={handleAddProject} className="space-y-8">
              <div>
                <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-widest mb-3 text-center">Qual o nome do projeto?</label>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-6 py-4 bg-[#FAF7F0] border-l-4 border-[#3D5A3E] rounded-r-2xl outline-none font-serif italic text-2xl text-center placeholder:text-gray-300"
                  placeholder="Ex: Refúgio no Lago"
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full py-4 bg-[#3D5A3E] text-white rounded-xl font-bold uppercase tracking-[3px] text-xs hover:bg-[#2C3B2D] transition-all shadow-xl active:scale-[0.98]"
                >
                  {editingProject ? 'Salvar Nome' : 'Confirmar e Iniciar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingProject(null); setNewTitle(''); }}
                  className="w-full py-3 text-[#8B7355] font-bold uppercase tracking-widest text-[10px] hover:text-[#3D5A3E] transition-colors"
                >
                  Agora Não
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
