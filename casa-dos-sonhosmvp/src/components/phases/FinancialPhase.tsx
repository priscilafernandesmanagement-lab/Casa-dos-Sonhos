import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../lib/firebase';
import { Project, FinancialData } from '../../types';
import { Save, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface Props {
  project: Project;
}

export default function FinancialPhase({ project }: Props) {
  const [data, setData] = useState<FinancialData>(project.financial || {
    availableNow: 0,
    availableMonthly: 0,
    emergencyFundValue: 0,
    hasEmergencyFund: false,
    willFinance: false,
    maxBudget: 0,
    land: {
      hasLand: false,
      estimatedCost: 0,
      docsCost: 0,
      taxesCost: 0,
      feesCost: 0
    }
  });

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'constructions', project.id), {
        financial: data,
        updatedAt: serverTimestamp()
      });
      alert('Dados financeiros salvos com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `constructions/${project.id}`);
    }
  };

  const totalLandCost = data.land?.hasLand ? 0 : 
    (data.land?.estimatedCost || 0) + (data.land?.docsCost || 0) + (data.land?.taxesCost || 0) + (data.land?.feesCost || 0);

  // Automatic calculation of max budget
  // Formula: Available Now - Land Cost - Emergency Fund + (Monthly * 24 months estimate)
  const calculateAutomaticBudget = () => {
    const monthsEstimate = 18; // Common construction period
    const capacity = (data.availableNow - totalLandCost - (data.hasEmergencyFund ? data.emergencyFundValue : 0)) + (data.availableMonthly * monthsEstimate);
    setData({ ...data, maxBudget: Math.max(0, Math.round(capacity * 0.9)) }); // 10% safety margin
  };

  const overCapacity = totalLandCost > (data.availableNow - (data.hasEmergencyFund ? data.emergencyFundValue : 0));

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Budget */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="text-[#3D5A3E]" />
            <h2 className="font-serif text-2xl">Capacidade Financeira</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[3px] mb-2">Valor Disponível Hoje (R$)</label>
              <input 
                type="number" value={data.availableNow} 
                onChange={e => setData({ ...data, availableNow: Number(e.target.value) })}
                className="w-full bg-[#FAF7F0] p-4 rounded-2xl font-serif text-xl outline-none focus:ring-2 ring-[#3D5A3E]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[3px] mb-2">Valor Mensal Disponível (R$)</label>
              <input 
                type="number" value={data.availableMonthly} 
                onChange={e => setData({ ...data, availableMonthly: Number(e.target.value) })}
                className="w-full bg-[#FAF7F0] p-4 rounded-2xl font-serif text-xl outline-none focus:ring-2 ring-[#3D5A3E]"
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <div 
                className="flex items-center gap-3 p-4 bg-[#FAF7F0] rounded-2xl cursor-pointer" 
                onClick={() => setData({...data, hasEmergencyFund: !data.hasEmergencyFund})}
              >
                <div className={`w-6 h-6 rounded-full border-2 border-[#3D5A3E] flex items-center justify-center ${data.hasEmergencyFund ? 'bg-[#3D5A3E]' : ''}`}>
                  {data.hasEmergencyFund && <div className="w-2 h-2 bg-white rounded-full"/>}
                </div>
                <span className="text-sm font-medium text-[#2C2820]">Possui reserva de emergência</span>
              </div>
              {data.hasEmergencyFund && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[8px] font-bold text-[#8B7355] uppercase tracking-widest mb-1 ml-2">Valor Reservado (R$)</label>
                  <input 
                    type="number" value={data.emergencyFundValue} 
                    onChange={e => setData({ ...data, emergencyFundValue: Number(e.target.value) })}
                    className="w-full bg-[#EEF5E8] px-4 py-2 rounded-xl outline-none text-sm font-bold text-[#3D5A3E]"
                  />
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#FAF7F0] rounded-2xl cursor-pointer" onClick={() => setData({...data, willFinance: !data.willFinance})}>
              <div className={`w-6 h-6 rounded-full border-2 border-[#3D5A3E] flex items-center justify-center ${data.willFinance ? 'bg-[#3D5A3E]' : ''}`}>
                {data.willFinance && <div className="w-2 h-2 bg-white rounded-full"/>}
              </div>
              <span className="text-sm font-medium text-[#2C2820]">Pretende financiar</span>
            </div>

            <div className="md:col-span-2 p-6 bg-[#3D5A3E]/5 rounded-3xl border border-[#3D5A3E]/10">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[3px]">Valor Máximo Total da Obra</label>
                <button 
                  onClick={calculateAutomaticBudget}
                  className="text-[9px] font-bold text-[#3D5A3E] uppercase tracking-widest hover:underline"
                >
                  Sugerir automaticamente
                </button>
              </div>
              <input 
                type="number" value={data.maxBudget} 
                onChange={e => {
                  const value = Number(e.target.value);
                  if (value < 0 || value > 10000000) { // Limite de 10 milhões
                    alert('Valor inválido.');
                    return;
                  }
                  setData({ ...data, maxBudget: value });
                }}
                className="w-full bg-white p-4 rounded-2xl font-serif text-3xl font-bold text-[#3D5A3E] outline-none shadow-sm"
              />
              <p className="text-[10px] text-[#8B7355] mt-3 italic">* Este é o valor total que você planeja gastar com a construção (excluindo terreno).</p>
            </div>
          </div>
        </div>

        {/* Land Acquisition */}
        <div className="bg-[#FAF7F0] rounded-[2.5rem] p-8 border border-[#8B7355]/10 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-[#B8965A]" />
            <h2 className="font-serif text-2xl">Investimento no Terreno</h2>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm">
                <span className="text-sm font-bold text-[#8B7355] uppercase tracking-widest flex-1">Já possui o terreno?</span>
                <div className="flex bg-[#F8F3EC] p-1 rounded-xl">
                   <button 
                    onClick={() => setData({ ...data, land: { ...data.land!, hasLand: true } })}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${data.land?.hasLand ? 'bg-[#3D5A3E] text-white' : 'text-[#8B7355]'}`}
                   >Sim</button>
                   <button 
                    onClick={() => setData({ ...data, land: { ...data.land!, hasLand: false } })}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${!data.land?.hasLand ? 'bg-[#B8965A] text-white' : 'text-[#8B7355]'}`}
                   >Não</button>
                </div>
             </div>

             {!data.land?.hasLand && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[2px] mb-2">Valor Estimado do Terreno (R$)</label>
                    <input type="number" value={data.land?.estimatedCost} onChange={e => setData({...data, land: {...data.land!, estimatedCost: Number(e.target.value)}})} className="w-full bg-white p-4 rounded-2xl outline-none shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[2px] mb-2">Documentação (R$)</label>
                    <input type="number" value={data.land?.docsCost} onChange={e => setData({...data, land: {...data.land!, docsCost: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[2px] mb-2">Taxas / Outros (R$)</label>
                    <input type="number" value={data.land?.feesCost} onChange={e => setData({...data, land: {...data.land!, feesCost: Number(e.target.value)}})} className="w-full bg-white p-3 rounded-xl outline-none" />
                  </div>
                  
                  <div className={cn(
                    "col-span-2 p-6 rounded-3xl flex flex-col gap-2 transition-colors",
                    overCapacity ? "bg-red-50 border border-red-100" : "bg-[#B8965A]/10"
                  )}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#9A7A3A] uppercase tracking-widest">Custo de Aquisição:</span>
                      <span className={cn("font-serif text-2xl font-bold", overCapacity ? "text-red-600" : "text-[#9A7A3A]")}>
                        {formatCurrency(totalLandCost)}
                      </span>
                    </div>
                    {overCapacity && (
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight flex items-center gap-1 mt-2">
                        <AlertCircle size={12} /> Alerta: O investimento no terreno ultrapassa sua reserva imediata!
                      </p>
                    )}
                  </div>
               </motion.div>
             )}
          </div>
        </div>
      </div>

      <div className="bg-[#1A2E1B] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 justify-between text-white shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#3D5A3E] flex items-center justify-center text-[#D4E4C8]">
            <AlertCircle size={32} />
          </div>
          <div>
             <h3 className="font-serif text-2xl">Balanço do Sonho</h3>
             <p className="text-[#D4E4C8] text-sm opacity-80 italic">O sistema calcula seu fôlego financeiro para evitar pausas na obra.</p>
          </div>
        </div>
        <div className="text-right flex gap-4 items-center">
           <div className="text-right">
             <p className="text-[10px] font-bold text-[#6A8F5C] uppercase tracking-widest mb-1">Impacto Total Estimado</p>
             <p className="text-3xl font-serif">{formatCurrency(totalLandCost + (data.maxBudget || 0))}</p>
           </div>
           <button 
            onClick={handleSave}
            className="ml-6 bg-[#D4E4C8] text-[#1A2E1B] px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
           >
             <Save size={18} /> Salvar Fase 0
           </button>
        </div>
      </div>
    </div>
  );
}
