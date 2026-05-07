import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../lib/firebase';
import { Project, LandInfo } from '../../types';
import { Save, MapPin, Droplets, Zap, Trash2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion } from 'motion/react';

interface Props {
  project: Project;
}

export default function LandPhase({ project }: Props) {
  const [data, setData] = useState<LandInfo>(project.landInfo || {
    location: '',
    sizeSqm: 0,
    topography: 'Plano',
    infra: {
      waterCost: 0,
      powerCost: 0,
      sanitationCost: 0,
      accessCost: 0
    }
  });

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'constructions', project.id), {
        landInfo: data,
        updatedAt: serverTimestamp()
      });
      alert('Dados do terreno salvos!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `constructions/${project.id}`);
    }
  };

  const totalInfraCost = (data.infra.waterCost || 0) + (data.infra.powerCost || 0) + (data.infra.sanitationCost || 0) + (data.infra.accessCost || 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Land Details */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-[#3D5A3E]" />
            <h2 className="font-serif text-2xl">Especificações do Terreno</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[3px] mb-2">Localização / Endereço</label>
              <input 
                type="text" value={data.location} 
                onChange={e => setData({ ...data, location: e.target.value })}
                placeholder="Ex: Condomínio Villa Real, Lote 12"
                className="w-full bg-[#FAF7F0] p-4 rounded-2xl font-serif text-xl outline-none focus:ring-2 ring-[#3D5A3E]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[2px] mb-2">Tamanho (m²)</label>
                 <input type="number" value={data.sizeSqm} onChange={e => setData({...data, sizeSqm: Number(e.target.value)})} className="w-full bg-[#FAF7F0] p-4 rounded-xl outline-none" />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#8B7355] uppercase tracking-[2px] mb-2">Topografia</label>
                  <select value={data.topography} onChange={e => setData({...data, topography: e.target.value})} className="w-full bg-[#FAF7F0] p-4 rounded-xl outline-none appearance-none font-serif">
                    <option>Plano</option>
                    <option>Aclive (Sobe)</option>
                    <option>Declive (Desce)</option>
                    <option>Irregular</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-[#B8965A]" />
            <h2 className="font-serif text-2xl">Custos de Infraestrutura</h2>
          </div>
          
          <p className="text-xs text-[#8B7355] italic">Insira os custos apenas se os serviços ainda não estiverem disponíveis no lote.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest flex items-center gap-2">
                  <Droplets size={12} /> Água
                </label>
                <input type="number" value={data.infra.waterCost} onChange={e => setData({...data, infra: {...data.infra, waterCost: Number(e.target.value)}})} className="w-full bg-[#F8F3EC] p-3 rounded-xl outline-none" placeholder="Custo de ligação/poço" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} /> Energia
                </label>
                <input type="number" value={data.infra.powerCost} onChange={e => setData({...data, infra: {...data.infra, powerCost: Number(e.target.value)}})} className="w-full bg-[#F8F3EC] p-3 rounded-xl outline-none" placeholder="Custo de padrão/poste" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest flex items-center gap-2">
                  <Droplets size={12} /> Saneamento
                </label>
                <input type="number" value={data.infra.sanitationCost} onChange={e => setData({...data, infra: {...data.infra, sanitationCost: Number(e.target.value)}})} className="w-full bg-[#F8F3EC] p-3 rounded-xl outline-none" placeholder="Fossa/Rede de esgoto" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> Acesso
                </label>
                <input type="number" value={data.infra.accessCost} onChange={e => setData({...data, infra: {...data.infra, accessCost: Number(e.target.value)}})} className="w-full bg-[#F8F3EC] p-3 rounded-xl outline-none" placeholder="Calçada/Portão inicial" />
             </div>
          </div>

          <div className="pt-4 border-t border-[#8B7355]/10 flex justify-between items-center">
             <span className="text-xs font-bold text-[#8B7355] uppercase tracking-widest">Total Infra:</span>
             <span className="font-serif text-xl font-bold text-[#3D5A3E]">{formatCurrency(totalInfraCost)}</span>
          </div>
        </div>
      </div>

       <div className="bg-[#3D5A3E] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 justify-between text-white shadow-xl">
        <div className="flex items-center gap-4">
           <ShieldCheck size={40} className="text-[#D4E4C8]" />
           <p className="font-serif text-xl">Prepare a base antes de erguer o sonho.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-white text-[#3D5A3E] px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg hover:bg-[#EEF5E8] transition-all"
        >
          <Save size={18} /> Salvar Fase 1
        </button>
      </div>
    </div>
  );
}
