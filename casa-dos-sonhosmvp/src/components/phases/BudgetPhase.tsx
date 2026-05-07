import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, limit, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../lib/firebase';
import { Project, BudgetSheet } from '../../types';
import { Plus, Trash2, PieChart as PieIcon, TrendingDown, Info, ShoppingCart, Pencil, X, Save } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  project: Project;
}

export default function BudgetPhase({ project }: Props) {
  const [sheets, setSheets] = useState<BudgetSheet[]>([]);
  const [globalSuggestions, setGlobalSuggestions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<BudgetSheet>>({ 
    itemName: '', 
    supplier: '', 
    type: 'material', 
    quantity: '', 
    value: 0, 
    notes: '' 
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Local project items
    const q = query(collection(db, 'constructions', project.id, 'budgetSheets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newSheets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BudgetSheet[];
      setSheets(newSheets);
      
      // Update spent field on project - only sum SELECTED items + land cost
      const landCost = (project.financial?.land?.estimatedCost || 0) + 
                         (project.financial?.land?.taxesCost || 0) + 
                         (project.financial?.land?.feesCost || 0);
      
      const selectedTotal = newSheets.reduce((acc, curr) => curr.selected ? acc + curr.value : acc, 0);
      updateDoc(doc(db, 'constructions', project.id), {
        spent: selectedTotal + landCost,
        updatedAt: serverTimestamp()
      }).catch(err => console.error("Error updating spent:", err));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `constructions/${project.id}/budgetSheets`));

    // Global market items (last 50 updated)
    const marketQ = query(collection(db, 'market_items'), orderBy('updatedAt', 'desc'), limit(50));
    const unsubMarket = onSnapshot(marketQ, (snapshot) => {
      setGlobalSuggestions(snapshot.docs.map(doc => doc.data().name));
    }, (error) => console.error("Market fetch error:", error));

    return () => { unsubscribe(); unsubMarket(); };
  }, [project.id]);

  const handleSelectSheet = async (sheet: BudgetSheet) => {
    try {
      // Find all sheets for the same item name and deselect them
      const key = sheet.itemName.trim().toLowerCase();
      const updates = sheets
        .filter(s => s.itemName.trim().toLowerCase() === key)
        .map(s => updateDoc(doc(db, 'constructions', project.id, 'budgetSheets', s.id), {
          selected: s.id === sheet.id ? !s.selected : false,
          updatedAt: serverTimestamp()
        }));
      
      await Promise.all(updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `constructions/${project.id}/budgetSheets`);
    }
  };

  const handleAddSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemName || !newItem.supplier || !newItem.value) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }
    
    // Service type doesn't need quantity, but material/item do (or we can just default it)
    if (newItem.type !== 'service' && !newItem.quantity) {
      alert('Quantidade é obrigatória para materiais e itens.');
      return;
    }

      try {
        const payload = {
          ...newItem,
          updatedAt: serverTimestamp()
        };
        
        if (editingId) {
          await updateDoc(doc(db, 'constructions', project.id, 'budgetSheets', editingId), payload);
          setEditingId(null);
          alert('Ficha atualizada com sucesso!');
        } else {
          await addDoc(collection(db, 'constructions', project.id, 'budgetSheets'), {
            ...payload,
            createdAt: serverTimestamp()
          });
          alert('Novo item adicionado à ficha da obra!');
        }

        // Global Market Sync
        if (newItem.itemName && newItem.supplier) {
          const marketId = newItem.itemName.trim().toLowerCase().replace(/\s+/g, '_');
          const marketRef = doc(db, 'market_items', marketId);
          
          await setDoc(marketRef, {
            name: newItem.itemName,
            lastSupplier: newItem.supplier,
            lastPrice: newItem.value,
            lastQuantity: newItem.quantity || '',
            updatedAt: serverTimestamp(),
            // Ensure createdAt exists on first set
            createdAt: serverTimestamp() 
          }, { merge: true }).catch(err => console.error("Market sync failed:", err));
        }

        setNewItem({ itemName: '', supplier: '', type: 'material', quantity: '', value: 0, notes: '' });
        setShowAddForm(false);
      } catch (error) {
        handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, `constructions/${project.id}/budgetSheets`);
      }
  };

  const startEdit = (sheet: BudgetSheet) => {
    setNewItem({
      itemName: sheet.itemName,
      supplier: sheet.supplier,
      type: sheet.type,
      quantity: sheet.quantity || '',
      value: sheet.value,
      notes: sheet.notes || ''
    });
    setEditingId(sheet.id);
    setShowAddForm(true);
  };

  const deleteSheet = async (sheetId: string) => {
    if (!window.confirm('Excluir esta ficha de orçamento?')) return;
    try {
      await deleteDoc(doc(db, 'constructions', project.id, 'budgetSheets', sheetId));
      alert('Item removido da ficha com sucesso!');
      if (editingId === sheetId) {
        setEditingId(null);
        setShowAddForm(false);
        setNewItem({ itemName: '', supplier: '', type: 'material', quantity: '', value: 0, notes: '' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `constructions/${project.id}/budgetSheets/${sheetId}`);
    }
  };

  // Group by item name for comparison
  const groupedItems: Record<string, BudgetSheet[]> = sheets.reduce((acc, sheet) => {
    const key = sheet.itemName.trim().toLowerCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(sheet);
    return acc;
  }, {} as Record<string, BudgetSheet[]>);

  // Distinct item names for suggestions
  const distinctItemNames = Array.from(new Set(sheets.map(s => s.itemName)));

  // Helper to extract first number from string (e.g. "1000 bricks" -> 1000)
  const extractNumber = (str: any) => {
    if (!str || typeof str !== 'string') return 1;
    const match = str.match(/(\d+)/);
    return match ? parseFloat(match[0]) : 1;
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-[#8B7355]/10 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#3D5A3E]/10 rounded-2xl flex items-center justify-center text-[#3D5A3E]">
              <PieIcon size={24} />
           </div>
           <div>
              <h2 className="font-serif text-2xl">Gestão de Orçamentos</h2>
              <p className="text-xs text-[#8B7355] uppercase tracking-widest font-bold">{sheets.length} Fichas Cadastradas • {sheets.filter(s => s.selected).length} Escolhidas</p>
           </div>
        </div>
        {!showAddForm && (
          <button 
            onClick={() => {
              setEditingId(null);
              setNewItem({ itemName: '', supplier: '', type: 'material', quantity: '', value: 0, notes: '' });
              setShowAddForm(true);
            }}
            className="bg-[#3D5A3E] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-[#1A2E1B] transition-all"
          >
            <Plus size={18} /> Nova Ficha
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#FAF7F0] p-8 rounded-[2.5rem] border-2 border-dashed border-[#3D5A3E]/20"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-serif text-xl text-[#3D5A3E]">{editingId ? 'Editar Ficha' : 'Nova Ficha de Orçamento'}</h3>
              <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="text-[#8B7355]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSheet} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-2">Tipo de Ficha</label>
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-[#8B7355]/10">
                    {['material', 'item', 'service'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewItem({...newItem, type: t as any})}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                          newItem.type === t ? "bg-[#3D5A3E] text-white" : "text-[#8B7355] hover:bg-gray-50"
                        )}
                      >
                        {t === 'material' ? 'Material' : t === 'service' ? 'Serviço' : 'Item'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-1 relative">
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-2">Item / Nome *</label>
                  <input 
                    required 
                    list="item-suggestions"
                    value={newItem.itemName} 
                    onChange={e => setNewItem({...newItem, itemName: e.target.value})}
                    placeholder="Ex: Cimento CP-II" 
                    className="w-full p-4 rounded-xl outline-none font-serif shadow-sm bg-white"
                  />
                  <datalist id="item-suggestions">
                    {Array.from(new Set([...distinctItemNames, ...globalSuggestions])).map(name => <option key={name} value={name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-2">Fornecedor *</label>
                  <input 
                    required value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})}
                    placeholder="Nome da Loja" className="w-full p-4 rounded-xl outline-none font-serif shadow-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={cn(newItem.type === 'service' ? "opacity-30 pointer-events-none" : "opacity-100")}>
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-2">Quantidade {newItem.type !== 'service' && '*'}</label>
                  <input 
                    required={newItem.type !== 'service'}
                    value={newItem.quantity} 
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                    placeholder="Ex: 50 sacos" 
                    className="w-full p-4 rounded-xl outline-none font-serif shadow-sm bg-white"
                    disabled={newItem.type === 'service'}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-2">Valor Total (R$) *</label>
                  <input 
                    required type="number" step="0.01" value={newItem.value} onChange={e => setNewItem({...newItem, value: Number(e.target.value)})}
                    className="w-full p-4 rounded-xl outline-none font-serif shadow-sm bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest mb-2">Observações</label>
                  <input 
                    value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})}
                    placeholder="Notas adicionais" className="w-full p-4 rounded-xl outline-none font-serif shadow-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                 <button type="submit" className="flex-1 bg-[#3D5A3E] text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[3px] shadow-lg hover:bg-[#1A2E1B] transition-all flex items-center justify-center gap-2">
                   <Save size={16} />
                   {editingId ? 'Salvar Alterações' : 'Cadastrar Ficha'}
                 </button>
                 {editingId && (
                   <button 
                     type="button" 
                     onClick={() => deleteSheet(editingId)}
                     className="bg-red-50 text-red-600 border border-red-200 px-6 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[2px] hover:bg-red-100 transition-all flex items-center gap-2"
                   >
                     <Trash2 size={16} /> Excluir
                   </button>
                 )}
                 <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} className="bg-white text-[#8B7355] border border-[#8B7355]/20 px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[2px]">Cancelar</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparator Section - Materials and Services Area */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4 pb-4 border-b border-[#8B7355]/10">
           <div className="flex items-center gap-3">
              <Info className="text-[#B8965A]" size={24} />
              <div>
                <h3 className="font-serif text-3xl text-[#1A2E1B]">Área de Materiais e Serviços</h3>
                <p className="text-xs text-[#8B7355] uppercase tracking-widest font-bold">Gestão completa da ficha de obra e comparador global</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedItems).map(([itemName, itemSheets]) => {
            const values = itemSheets.map(s => s.value);
            const unitPrices = itemSheets.map(s => s.value / extractNumber(s.quantity));
            const minUnit = Math.min(...unitPrices);
            const maxUnit = Math.max(...unitPrices);
            const bestUnitSheet = itemSheets.find(s => (s.value / extractNumber(s.quantity)) === minUnit);
            
            const min = Math.min(...values);
            const max = Math.max(...values);
            const savings = max - min;
            const unitSavings = maxUnit - minUnit;

            return (
              <motion.div 
                key={itemName}
                layout
                className="bg-white rounded-[2rem] p-6 border border-[#8B7355]/10 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <h4 className="font-serif text-xl text-[#1A2E1B] leading-tight first-letter:uppercase">{itemName}</h4>
                  <div className="w-8 h-8 rounded-full bg-[#EEF5E8] flex items-center justify-center text-[#3D5A3E] text-[10px] font-bold">
                    {itemSheets.length}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs border-b border-[#FAF7F0] pb-2">
                    <span className="text-[#8B7355] uppercase tracking-widest font-bold">Melhor Preço Total:</span>
                    <span className="text-green-600 font-bold">{formatCurrency(min)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-[#FAF7F0] pb-2">
                    <span className="text-[#8B7355] uppercase tracking-widest font-bold">Melhor Preço Unit:</span>
                    <span className="text-[#3D5A3E] font-bold">{formatCurrency(minUnit)}</span>
                  </div>
                  
                  {bestUnitSheet && unitSavings > 0 && itemSheets.length > 1 && (
                    <div className="bg-[#EEF5E8] p-3 rounded-xl flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                         <TrendingDown size={14} className="text-[#3D5A3E]" />
                         <span className="text-[9px] font-black text-[#3D5A3E] uppercase tracking-widest">Dica de Compra:</span>
                      </div>
                      <p className="text-[10px] text-[#3D5A3E]/80 italic">
                        O fornecedor <strong>{bestUnitSheet.supplier}</strong> oferece o melhor custo-benefício por unidade.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sub-list of suppliers */}
                <div className="mt-6 pt-4 border-t border-[#FAF7F0] space-y-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {itemSheets.map(s => {
                    const qtyVal = extractNumber(s.quantity || '1');
                    const unitPrice = s.value / qtyVal;
                    const isSelected = s.selected;

                    return (
                      <div 
                        key={s.id} 
                        className={cn(
                          "flex justify-between items-center rounded-lg p-2 transition-all cursor-pointer group/item",
                          isSelected ? "bg-[#EEF5E8] ring-1 ring-[#3D5A3E]/30 shadow-sm" : "hover:bg-gray-50 bg-white"
                        )}
                        onClick={() => handleSelectSheet(s)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] font-bold text-[#1A2E1B]">{s.supplier}</p>
                             {isSelected && <span className="bg-[#3D5A3E] text-white text-[7px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest">Escolhido</span>}
                          </div>
                          <p className="text-[9px] text-[#8B7355] italic">
                            {s.type === 'service' ? 'Serviço' : s.quantity}
                            {s.type !== 'service' && qtyVal > 0 && ` • Un: ${formatCurrency(unitPrice)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-xs font-bold", isSelected ? "text-[#3D5A3E]" : "text-[#1A2E1B]")}>{formatCurrency(s.value)}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); startEdit(s); }} className="text-blue-300 hover:text-blue-500 transition-colors"><Pencil size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteSheet(s.id); }} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          
          {sheets.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-[#8B7355]/20">
               <ShoppingCart className="mx-auto text-[#8B7355]/20 mb-4" size={48} />
               <p className="font-serif text-xl text-[#8B7355]">Nenhum orçamento cadastrado.</p>
               <button onClick={() => setShowAddForm(true)} className="mt-4 text-[10px] font-bold text-[#3D5A3E] uppercase tracking-widest hover:underline">Começar agora</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
