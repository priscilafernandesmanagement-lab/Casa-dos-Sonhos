import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../lib/firebase';
import { Project, ProgressLog } from '../../types';
import { Calendar, Plus, History, CheckCircle2, User, Clock, AlertTriangle, Trash2, Pencil, Save } from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  project: Project;
}

export default function ProgressPhase({ project }: Props) {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newLog, setNewLog] = useState({ 
    stage: '', 
    percentage: 0, 
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0], 
    team: '', 
    notes: '' 
  });

  useEffect(() => {
    const q = query(collection(db, 'constructions', project.id, 'progressLogs'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgressLog[];
      setLogs(newLogs);

      if (newLogs.length > 0) {
        const maxPercent = Math.max(...newLogs.map(l => l.percentage));
        const lastVisit = newLogs[0].date; // results are ordered by date desc

        updateDoc(doc(db, 'constructions', project.id), {
          overallProgress: maxPercent,
          lastVisitDate: lastVisit,
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Error updating project progress:", err));
      } else {
        updateDoc(doc(db, 'constructions', project.id), {
          overallProgress: 0,
          lastVisitDate: null,
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Error resetting project progress:", err));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `constructions/${project.id}/progressLogs`));
    return () => unsubscribe();
  }, [project.id]);

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'constructions', project.id, 'progressLogs', editingId), {
          ...newLog,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'constructions', project.id, 'progressLogs'), {
          ...newLog,
          createdAt: serverTimestamp()
        });
      }
      
      setShowForm(false);
      setEditingId(null);
      setNewLog({ 
        stage: '', 
        percentage: 0, 
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0], 
        team: '', 
        notes: '' 
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, `constructions/${project.id}/progressLogs`);
    }
  };

  const startEdit = (log: ProgressLog) => {
    setNewLog({
      stage: log.stage,
      percentage: log.percentage,
      startDate: log.startDate || new Date().toISOString().split('T')[0],
      endDate: log.endDate || new Date().toISOString().split('T')[0],
      date: log.date,
      team: log.team || '',
      notes: log.notes || ''
    });
    setEditingId(log.id);
    setShowForm(true);
  };

  const [showAgenda, setShowAgenda] = useState(false);

  return (
    <div className="space-y-10 pb-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A2E1B] p-8 rounded-[2.5rem] text-white flex flex-col justify-center shadow-xl">
           <span className="text-[10px] font-bold text-[#D4E4C8] uppercase tracking-[3px] mb-2">Progresso Real</span>
           <p className="text-5xl font-serif">{project.overallProgress || 0}%</p>
           <p className="text-[10px] text-[#6A8F5C] uppercase tracking-widest font-bold mt-2">Atualizado em tempo real</p>
        </div>

        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-[#8B7355]/10 flex flex-col justify-between">
           <div className="flex justify-between items-center">
              <h3 className="font-serif text-2xl">Gestão de Cronograma</h3>
              {!showForm && (
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setNewLog({ 
                      stage: '', 
                      percentage: 0, 
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0],
                      date: new Date().toISOString().split('T')[0], 
                      team: '', 
                      notes: '' 
                    });
                    setShowForm(true);
                  }}
                  className="bg-[#B8965A] text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#9A7A3A] transition-all"
                >
                  <Plus size={14} /> Atualizar Progresso
                </button>
              )}
           </div>
           
           <div className="mt-6 flex items-center gap-4">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl flex-1 flex items-center gap-3">
                 <Calendar className="text-[#3D5A3E]" size={20} />
                 <div>
                   <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest">Última Visita</p>
                   <p className="text-sm font-serif font-bold">{project.lastVisitDate ? formatDate(project.lastVisitDate) : '--/--/----'}</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowAgenda(true)}
                className="p-4 bg-[#3D5A3E] text-white rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform active:scale-95 shadow-lg group"
              >
                <Calendar size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Abrir Agenda da Obra</span>
                <Clock className="opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
              </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showAgenda && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-3xl">Agenda da Obra</h3>
                <button onClick={() => setShowAgenda(false)} className="text-[#8B7355] hover:text-black">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-6 items-start p-6 bg-[#FAF7F0] rounded-2xl border border-[#3D5A3E]/5">
                    <div className="w-16 flex flex-col items-center">
                      <span className="text-xl font-serif font-bold text-[#3D5A3E]">{log.date.split('-')[2]}</span>
                      <span className="text-[9px] uppercase font-bold text-[#8B7355]">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-lg text-[#1A2E1B]">{log.stage}</h4>
                      <p className="text-xs text-[#8B7355] mt-1 italic">
                        {log.startDate && log.endDate ? `${formatDate(log.startDate)} - ${formatDate(log.endDate)}` : ''}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 bg-[#EEF5E8] rounded-full overflow-hidden">
                          <div className="h-full bg-[#3D5A3E]" style={{ width: `${log.percentage}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-[#3D5A3E]">{log.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-center py-20 text-[#8B7355] italic">Nenhuma etapa registrada no cronograma.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#EEF5E8] p-10 rounded-[3rem] border border-[#3D5A3E]/10 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-serif text-xl text-[#3D5A3E]">{editingId ? 'Editar Registro' : 'Novo Registro de Progresso'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-[#8B7355]">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddProgress} className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-3">Etapa Atual</label>
                 <input 
                  required value={newLog.stage} onChange={e => setNewLog({...newLog, stage: e.target.value})}
                  placeholder="Ex: Assentamento de Tijolos" className="w-full bg-white p-4 rounded-xl outline-none font-serif text-lg shadow-sm"
                 />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-3">Progresso (%)</label>
                  <input 
                    required type="number" min="0" max="100" value={newLog.percentage} onChange={e => setNewLog({...newLog, percentage: Number(e.target.value)})}
                    className="w-full bg-white p-4 rounded-xl outline-none font-sans font-bold text-lg shadow-sm"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-3">Data de Registro</label>
                  <input 
                    required type="date" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})}
                    className="w-full bg-white p-4 rounded-xl outline-none shadow-sm"
                  />
               </div>
               
               <div>
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-3">Início da Etapa</label>
                  <input 
                    required type="date" value={newLog.startDate} onChange={e => setNewLog({...newLog, startDate: e.target.value})}
                    className="w-full bg-white p-4 rounded-xl outline-none shadow-sm"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-3">Fim Estimado</label>
                  <input 
                    required type="date" value={newLog.endDate} onChange={e => setNewLog({...newLog, endDate: e.target.value})}
                    className="w-full bg-white p-4 rounded-xl outline-none shadow-sm"
                  />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-3">Equipe / Responsável</label>
                  <input 
                    value={newLog.team} onChange={e => setNewLog({...newLog, team: e.target.value})}
                    placeholder="Ex: Equipe de Alvenaria" className="w-full bg-white p-4 rounded-xl outline-none shadow-sm"
                  />
               </div>
               <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-3">Notas da Visita</label>
                  <textarea 
                    value={newLog.notes} onChange={e => setNewLog({...newLog, notes: e.target.value})}
                    placeholder="O que foi feito hoje?" className="w-full bg-white p-4 rounded-xl outline-none shadow-sm min-h-[100px] font-serif"
                  />
               </div>
               <div className="md:col-span-4 flex justify-end gap-6">
                  {editingId && (
                     <button 
                       type="button" 
                       onClick={async () => {
                         if(window.confirm('Excluir este registro?')) {
                           await deleteDoc(doc(db, 'constructions', project.id, 'progressLogs', editingId));
                           setEditingId(null);
                           setShowForm(false);
                         }
                       }}
                       className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                     >
                        Excluir Registro
                     </button>
                  )}
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="text-[10px] font-bold uppercase tracking-widest text-[#8B7355]">Cancelar</button>
                  <button type="submit" className="bg-[#3D5A3E] text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center gap-2">
                    <Save size={16} />
                    {editingId ? 'Salvar Alterações' : 'Registrar Progresso'}
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History List */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 px-4">
            <History className="text-[#3D5A3E]" size={20} />
            <h3 className="font-serif text-2xl text-[#2C2820]">Histórico de Evolução</h3>
         </div>

         <div className="relative space-y-6">
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-[#8B7355]/10" />
            
            {logs.map((log, idx) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-14"
              >
                <div className="absolute left-4 top-2 w-4 h-4 rounded-full bg-[#B8965A] border-4 border-white shadow-sm ring-4 ring-[#FAF7F0]" />
                
                <div className="bg-white p-6 rounded-[2rem] border border-[#8B7355]/10 shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                         <span className="text-[9px] font-bold text-[#B8965A] uppercase tracking-widest flex items-center gap-2 mb-1">
                           <Calendar size={10} /> {formatDate(log.date)}
                         </span>
                         <h4 className="font-serif text-xl text-[#1A2E1B]">{log.stage}</h4>
                         <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] font-bold text-[#8B7355] flex items-center gap-1">
                              <User size={12} /> {log.team || 'Não especificado'}
                            </span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                         <div className="text-right">
                            <span className="text-[9px] font-bold text-[#8B7355] uppercase tracking-widest block mb-1">Progresso</span>
                            <span className="font-serif text-3xl font-bold text-[#3D5A3E]">{log.percentage}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={() => startEdit(log)}
                                className="p-2 text-blue-100 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            >
                               <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => {
                                  if(window.confirm('Excluir este registro?')) {
                                    deleteDoc(doc(db, 'constructions', project.id, 'progressLogs', log.id));
                                  }
                                }}
                                className="p-2 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                   </div>
                   {log.notes && (
                     <div className="mt-4 p-4 bg-[#FAF7F0] rounded-xl text-sm italic text-[#8B7355] font-serif">
                       "{log.notes}"
                     </div>
                   )}
                </div>
              </motion.div>
            ))}

            {logs.length === 0 && (
               <div className="pl-14">
                  <div className="bg-white/50 p-10 rounded-[2rem] border-2 border-dashed border-[#8B7355]/20 text-center">
                    <p className="text-[#8B7355] font-serif italic text-lg">Ainda sem registros de progresso. Clique em "Atualizar Progresso" para registrar seu primeiro degrau.</p>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
