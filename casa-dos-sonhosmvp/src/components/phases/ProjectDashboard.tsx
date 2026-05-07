import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../lib/firebase';
import { Project, BudgetSheet, ProgressLog } from '../../types';
import { 
  BarChart3, TrendingUp, AlertCircle, Clock, 
  CheckCircle2, DollarSign, PieChart as PieIcon,
  Activity, ArrowRight, Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { motion } from 'motion/react';

interface Props {
  project: Project;
}

export default function ProjectDashboard({ project }: Props) {
  const [sheets, setSheets] = useState<BudgetSheet[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);

  useEffect(() => {
    const qSheets = query(collection(db, 'constructions', project.id, 'budgetSheets'));
    const unsubSheets = onSnapshot(qSheets, (snap) => {
      setSheets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BudgetSheet[]);
    });

    const qLogs = query(collection(db, 'constructions', project.id, 'progressLogs'), orderBy('date', 'desc'), limit(5));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgressLog[]);
    });

    return () => { unsubSheets(); unsubLogs(); };
  }, [project.id]);

  const landCost = project.financial?.land?.hasLand ? 0 : 
    ((project.financial?.land?.estimatedCost || 0) + 
     (project.financial?.land?.docsCost || 0) + 
     (project.financial?.land?.taxesCost || 0) + 
     (project.financial?.land?.feesCost || 0));

  const totalSpent = sheets.reduce((acc, curr) => curr.selected ? acc + curr.value : acc, 0) + landCost;
  const budget = (project.financial?.maxBudget || 0) + landCost;
  const remaining = Math.max(0, budget - totalSpent);
  const spentPercent = budget > 0 ? (totalSpent / budget) * 100 : 0;

  const phaseData = [
    { name: 'Geral', value: project.overallProgress || 0 },
    { name: 'Planejamento', value: project.financial ? 100 : 0 },
    { name: 'Terreno', value: project.landInfo ? 100 : 0 },
    { name: 'Definição', value: project.definition ? 100 : 0 },
  ];

  const financialChart = [
    { name: 'Terreno', value: landCost, color: '#B8965A' },
    { name: 'Obra (Gasto)', value: totalSpent - landCost, color: '#3D5A3E' },
    { name: 'Disponível', value: remaining, color: '#FAF7F0' }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner */}
      <div className="bg-[#3D5A3E] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-xl">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-2">
               <span className="text-[10px] font-bold text-[#D4E4C8] uppercase tracking-[3px]">Status da Obra</span>
               <h2 className="text-4xl font-serif">Progresso: {project.overallProgress || 0}%</h2>
               <div className="w-full h-2 bg-white/10 rounded-full mt-4">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${project.overallProgress || 0}%` }} 
                    className="h-full bg-[#B8965A] rounded-full shadow-lg shadow-[#B8965A]/20" 
                  />
               </div>
            </div>
            
            <div className="flex flex-col justify-center border-l border-white/10 md:pl-10">
               <span className="text-[10px] font-bold text-[#D4E4C8] uppercase tracking-[3px] mb-2">Total Investido</span>
               <p className="text-3xl font-serif">{formatCurrency(totalSpent)}</p>
               <p className="text-xs text-[#D4E4C8]/60 mt-1">De um teto de {formatCurrency(budget)}</p>
            </div>

            <div className="flex flex-col justify-center border-l border-white/10 md:pl-10">
               <span className="text-[10px] font-bold text-[#D4E4C8] uppercase tracking-[3px] mb-2">Saúde Financeira</span>
               <div className="flex items-center gap-3">
                  <div className={spentPercent > 90 ? "text-red-400" : spentPercent > 70 ? "text-amber-400" : "text-green-400"}>
                    <Activity size={24} />
                  </div>
                  <p className="text-xl font-serif uppercase tracking-widest">
                    {spentPercent > 90 ? "Alerta" : spentPercent > 70 ? "Cuidado" : "Saudável"}
                  </p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Financial Breakdown */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm">
            <h3 className="font-serif text-2xl mb-8 flex items-center gap-3">
               <DollarSign className="text-[#3D5A3E]" /> Distribuição do Investimento
            </h3>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
               <ResponsiveContainer width="99%" aspect={1.5}>
                  <PieChart>
                     <Pie
                        data={financialChart}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {financialChart.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
               <div className="p-4 bg-[#FAF7F0] rounded-2xl">
                  <p className="text-[10px] text-[#849275] font-bold uppercase tracking-widest mb-1">Restante</p>
                  <p className="text-lg font-serif font-bold text-[#3D5A3E]">{formatCurrency(remaining)}</p>
               </div>
               <div className="p-4 bg-[#F8F3EC] rounded-2xl">
                  <p className="text-[10px] text-[#8B7355] font-bold uppercase tracking-widest mb-1">Comprometido</p>
                  <p className="text-lg font-serif font-bold text-[#B8965A]">{spentPercent.toFixed(1)}%</p>
               </div>
            </div>
         </div>

         {/* Latest Logs */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm flex flex-col">
            <h3 className="font-serif text-2xl mb-8 flex items-center gap-3">
               <Clock className="text-[#B8965A]" /> Atividade Recente
            </h3>
            
            <div className="space-y-4 flex-1">
               {logs.map((log) => (
                 <div key={log.id} className="flex gap-4 items-start p-4 bg-[#FAF7F0] rounded-2xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#3D5A3E] shadow-sm">
                       <CheckCircle2 size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] text-[#B8965A] font-bold uppercase tracking-widest">{formatDate(log.date)}</p>
                       <p className="font-serif font-bold text-[#1A2E1B]">{log.stage}</p>
                       <p className="text-xs text-[#8B7355] mt-1">{log.percentage}% concluído</p>
                    </div>
                 </div>
               ))}
               
               {logs.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Clock size={48} className="mb-4" />
                    <p className="font-serif italic text-lg">Sem registros recentes.</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Warnings & Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-200">
            <div className="flex items-center gap-3 mb-4 text-amber-700">
               <AlertCircle size={20} />
               <h4 className="font-bold uppercase tracking-widest text-xs">Pendências e Checklist</h4>
            </div>
            <ul className="space-y-3 text-sm text-[#7A6E5F]">
               {!project.financial && <li className="flex gap-2"><span>🔴</span> Planejamento financeiro não realizado</li>}
               {project.financial && <li className="flex gap-2"><span>🟢</span> Planejamento financeiro concluído</li>}
               {!project.landInfo && <li className="flex gap-2"><span>🔴</span> Detalhes do terreno não definidos</li>}
               {project.landInfo && <li className="flex gap-2"><span>🟢</span> Detalhes do terreno salvos</li>}
               {!project.definition && <li className="flex gap-2"><span>🔴</span> Definição da casa pendente</li>}
               {project.definition && <li className="flex gap-2"><span>🟢</span> Definição da casa concluída</li>}
               {sheets.length === 0 && <li className="flex gap-2"><span>🟡</span> Nenhuma ficha de orçamento cadastrada</li>}
               {logs.length === 0 && <li className="flex gap-2"><span>🟡</span> Registro de progresso ainda não iniciado</li>}
            </ul>
         </div>

          <div className="bg-[#FAF7F0] rounded-[2rem] p-8 border border-[#8B7355]/10 flex flex-col justify-between">
            <div>
               <div className="flex justify-between items-center mb-4">
                 <h4 className="font-serif text-2xl text-[#1A2E1B]">Agenda Integrada</h4>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-[#8B7355] uppercase tracking-widest">
                    <Calendar size={14} className="text-[#B8965A]" /> Próximos Eventos
                 </div>
               </div>
               
               <div className="space-y-3">
                 {logs.filter(l => l.endDate).slice(0, 2).map(log => (
                   <div key={log.id} className="flex justify-between items-center p-3 bg-white rounded-xl text-xs shadow-sm">
                     <span className="font-bold text-[#1A2E1B]">{log.stage}</span>
                     <span className="text-[#8B7355] font-serif tracking-tight">Final estim: {formatDate(log.endDate || '')}</span>
                   </div>
                 ))}
                 {logs.length === 0 && <p className="text-sm text-[#8B7355] italic">Nenhum evento agendado ainda.</p>}
               </div>
            </div>
            
            <div className="pt-6 mt-4 border-t border-[#8B7355]/10">
               <p className="text-[10px] text-[#8B7355] uppercase tracking-widest font-black mb-1">Dica do Sistema</p>
               <p className="text-xs text-[#3D5A3E] font-serif italic">Seu cronograma está sincronizado com as visitas técnicas registradas na fase de progresso.</p>
            </div>
          </div>
      </div>
    </div>
  );
}

function activePhaseFor(project: Project) {
  if (!project.financial) return 0;
  if (!project.landInfo) return 1;
  if (!project.definition) return 2;
  return 4;
}
