import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../lib/firebase';
import { Project, HouseDefinition } from '../../types';
import { Save, Layers, Plus, Trash2, Home, Bed, Bath } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  project: Project;
}

export default function DefinitionPhase({ project }: Props) {
  const [data, setData] = useState<HouseDefinition>(project.definition || {
    sqm: 0,
    rooms: 0,
    bathrooms: 0,
    additions: []
  });

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'constructions', project.id), {
        definition: data,
        updatedAt: serverTimestamp()
      });
      alert('Definição da casa salva!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `constructions/${project.id}`);
    }
  };

  const addAddition = () => {
    setData({
      ...data,
      additions: [...data.additions, { id: crypto.randomUUID(), name: '', cost: 0 }]
    });
  };

  const removeAddition = (id: string) => {
    setData({
      ...data,
      additions: data.additions.filter(a => a.id !== id)
    });
  };

  const updateAddition = (id: string, field: 'name' | 'cost', value: any) => {
    setData({
      ...data,
      additions: data.additions.map(a => a.id === id ? { ...a, [field]: value } : a)
    });
  };

  const totalAdditions = data.additions.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Specs */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Home className="text-[#3D5A3E]" />
            <h2 className="font-serif text-2xl">A Alma da Casa</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest flex items-center gap-2 mb-2">
                <Layers size={12} /> Metragem (m²)
              </label>
              <input type="number" value={data.sqm} onChange={e => setData({...data, sqm: Number(e.target.value)})} className="w-full bg-[#FAF7F0] p-4 rounded-xl outline-none font-serif text-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest flex items-center gap-2 mb-2">
                <Bed size={12} /> Quartos
              </label>
              <input type="number" value={data.rooms} onChange={e => setData({...data, rooms: Number(e.target.value)})} className="w-full bg-[#FAF7F0] p-4 rounded-xl outline-none font-serif text-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest flex items-center gap-2 mb-2">
                <Bath size={12} /> Banheiros
              </label>
              <input type="number" value={data.bathrooms} onChange={e => setData({...data, bathrooms: Number(e.target.value)})} className="w-full bg-[#FAF7F0] p-4 rounded-xl outline-none font-serif text-xl" />
            </div>
          </div>
        </div>

        {/* Custom Additions */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#8B7355]/10 shadow-sm space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Plus className="text-[#B8965A]" />
              <h2 className="font-serif text-2xl">Extras do Sonho</h2>
            </div>
            <button onClick={addAddition} className="text-[#3D5A3E] text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
              <Plus size={14} /> Adicionar Item
            </button>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            <AnimatePresence>
              {data.additions.map((adj) => (
                <motion.div 
                  key={adj.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-4 bg-[#FAF7F0] p-4 rounded-2xl group"
                >
                  <input 
                    placeholder="Ex: Piscina 3x4"
                    value={adj.name} 
                    onChange={e => updateAddition(adj.id, 'name', e.target.value)}
                    className="flex-1 bg-transparent font-serif outline-none"
                  />
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-[#8B7355]">R$</span>
                     <input 
                        type="number" 
                        value={adj.cost} 
                        onChange={e => updateAddition(adj.id, 'cost', Number(e.target.value))}
                        className="w-24 bg-white p-2 rounded-lg text-sm outline-none"
                      />
                   </div>
                   <button onClick={() => removeAddition(adj.id)} className="p-2 text-red-300 hover:text-red-600 transition-colors">
                     <Trash2 size={16} />
                   </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {data.additions.length === 0 && (
              <p className="text-center py-10 text-[#8B7355] italic text-sm">Nenhum item adicional incluído ainda.</p>
            )}
          </div>

          <div className="pt-4 border-t border-[#8B7355]/10 flex justify-between items-center text-sm">
             <span className="font-bold text-[#8B7355] uppercase tracking-widest">Total em Extras:</span>
             <span className="font-serif font-bold text-[#B8965A]">{formatCurrency(totalAdditions)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="bg-[#3D5A3E] text-white px-10 py-5 rounded-[2rem] font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl hover:bg-[#1A2E1B] transition-all"
        >
          <Save size={20} /> Salvar Definição da Casa
        </button>
      </div>
    </div>
  );
}
