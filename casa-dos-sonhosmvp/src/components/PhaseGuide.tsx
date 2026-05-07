import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, MapPin, ClipboardCheck, Calculator, 
  Home, Wrench, Plug, Brush, Maximize, 
  Layout, GitBranch, Palette, Building, 
  Sun, Star, Trophy, Heart, RefreshCw,
  AlertTriangle, ChevronLeft, ChevronRight,
  DollarSign, Zap, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

const phases = [
  {
    label: "Fase 0",
    title: "Financeiro e Estratégia",
    period: "O Primeiro Passo",
    cost: "Definição de Teto",
    pct: 10,
    items: [
      { label: "Prioridade", val: "Crítica" },
      { label: "Foco", val: "Estabilidade" },
      { label: "Reserva", val: "15% extras" },
      { label: "Status", val: "Planejamento" },
    ],
    tips: [
      { icon: DollarSign, text: "O valor mensal disponível é mais importante que o valor hoje para manter o ritmo." },
      { icon: Calculator, text: "Considere 15% de reserva para imprevistos. Toda obra no Brasil exige esse fôlego extra." },
      { icon: Star, text: "O financiamento deve ser a última opção, use apenas se necessário para acelerar a moradia." },
      { icon: FileText, text: "Um plano financeiro sólido evita que sua obra vire um esqueleto abandonado." },
    ],
    warn: "Nunca comece sem saber exatamente quanto pode gastar por mês. A constância vence a velocidade."
  },
  {
    label: "Fase 1",
    title: "Terreno e Infraestrutura",
    period: "Fundação Legal",
    cost: "Base do Sonho",
    pct: 30,
    items: [
      { label: "Prioridade", val: "Alta" },
      { label: "Foco", val: "Legal e Base" },
      { label: "Itens", val: "Água, Luz, Esgoto" },
      { label: "Solo", val: "Topografia" },
    ],
    tips: [
      { icon: MapPin, text: "Verifique a viabilidade de esgoto antes de comprar. Poços artesianos podem custar caro." },
      { icon: Home, text: "A topografia define o custo de fundação. Terrenos planos economizam muito concreto." },
      { icon: Zap, text: "Peça a ligação de luz e água antes de começar a obra para evitar atrasos da concessionária." },
      { icon: ClipboardCheck, text: "Confirme os recuos obrigatórios da prefeitura para não ter que demolir depois." },
    ],
  },
  {
    label: "Fase 2",
    title: "Definição da Casa",
    period: "Design Inteligente",
    cost: "Habitabilidade",
    pct: 50,
    items: [
      { label: "Prioridade", val: "Média" },
      { label: "Foco", val: "Metragem" },
      { label: "Ampliação", val: "Prevista" },
      { label: "Uso", val: "Moradia rápida" },
    ],
    tips: [
      { icon: Wrench, text: "Deixe pilares e laje já calculados para receber ampliação futura. Economia enorme depois." },
      { icon: Layout, text: "Cômodos integrados dão sensação de casa maior sem aumentar a metragem construída." },
      { icon: Maximize, text: "Priorize quartos e banheiros. Áreas gourmet e piscinas podem vir na próxima etapa." },
      { icon: Home, text: "Saia do aluguel o quanto antes. O dinheiro do aluguel vira investimento na sua própria obra." },
    ],
  },
  {
    label: "Fase 3",
    title: "Orçamento e Fichas",
    period: "Gestão de Compras",
    cost: "Economia Real",
    pct: 75,
    items: [
      { label: "Prioridade", val: "Alta" },
      { label: "Foco", val: "Menor Preço" },
      { label: "Cotações", val: "Mínimo 3" },
      { label: "Pagar", val: "À vista (se puder)" },
    ],
    tips: [
      { icon: RefreshCw, text: "Sempre cote em pelo menos 3 lugares. A variação pode chegar a 40% no mesmo item." },
      { icon: Palette, text: "Acabamento é onde o dinheiro foge. Escolha marcas consolidadas mas linhas econômicas." },
      { icon: Sun, text: "Considere painéis solares. A economia na conta de luz paga o sistema em poucos anos." },
      { icon: Building, text: "Fornecedores locais economizam no frete, que é o 'custo invisível' da construção." },
    ],
  },
  {
    label: "Fase 4",
    title: "Progresso e Execução",
    period: "Realização",
    cost: "Casa Pronta",
    pct: 100,
    items: [
      { label: "Prioridade", val: "Altíssima" },
      { label: "Foco", val: "Cronograma" },
      { label: "Equipe", val: "Qualificada" },
      { label: "Patrimônio", val: "Consolidado" },
    ],
    tips: [
      { icon: Clock, text: "Registre fotos de cada etapa escondida (canos e fios) antes de fechar a parede." },
      { icon: Heart, text: "Mantenha a equipe motivada. Um canteiro limpo e organizado rende muito mais." },
      { icon: Trophy, text: "Cada pequeno progresso é uma vitória. Comemore os marcos da sua jornada." },
      { icon: Star, text: "Sua casa agora é a base para o futuro da sua família. Cuide bem do que construiu." },
    ],
  }
];

export default function PhaseGuide() {
  const [current, setCurrent] = useState(0);
  const p = phases[current];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {phases.map((ph, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap",
              i === current 
                ? "bg-[#3D5A3E] text-white shadow-lg" 
                : "bg-white text-[#8B7355] border border-[#8B7355]/20 hover:border-[#3D5A3E]"
            )}
          >
            {ph.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-[2rem] p-8 border border-[#8B7355]/10 shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <h3 className="font-serif text-2xl text-[#2C2820] mb-1">{p.title}</h3>
              <p className="text-[#8B7355] text-sm uppercase tracking-widest font-medium">{p.period}</p>
            </div>
            <div className="bg-[#EEF5E8] px-4 py-2 rounded-xl text-[#3D5A3E] font-bold">
              {p.cost}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {p.items.map((it, i) => (
              <div key={i} className="bg-[#FAF7F0] p-4 rounded-2xl">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#8B7355] mb-1">{it.label}</p>
                <p className="text-sm font-semibold text-[#2C2820]">{it.val}</p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-[#8B7355] uppercase tracking-widest">Progresso do Sonho</span>
              <span className="text-[#3D5A3E] font-bold">{p.pct}%</span>
            </div>
            <div className="h-2 w-full bg-[#FAF7F0] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${p.pct}%` }}
                className="h-full bg-gradient-to-r from-[#3D5A3E] to-[#6A8F5C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.tips.map((tip, i) => (
              <div key={i} className="flex gap-4 items-start p-3 hover:bg-[#FAF7F0] rounded-xl transition-colors">
                <div className="p-2 bg-[#EEF5E8] rounded-lg text-[#3D5A3E]">
                  <tip.icon size={18} />
                </div>
                <p className="text-sm text-[#7A6E5F] leading-relaxed italic">
                  {tip.text}
                </p>
              </div>
            ))}
          </div>

          {p.warn && (
            <div className="mt-6 flex items-center gap-3 bg-[#FCF5E9] p-4 rounded-2xl border border-[#B8965A]/20">
              <AlertTriangle className="text-[#B8965A] shrink-0" size={20} />
              <p className="text-sm text-[#8B7355] font-medium italic">{p.warn}</p>
            </div>
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-[#8B7355]/10">
            <button 
              disabled={current === 0}
              onClick={() => setCurrent(curr => curr - 1)}
              className="flex items-center gap-2 text-sm font-bold text-[#8B7355] disabled:opacity-30 uppercase tracking-widest"
            >
              <ChevronLeft size={20} /> Anterior
            </button>
            <div className="flex gap-1.5">
              {phases.map((_, i) => (
                <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === current ? "bg-[#3D5A3E]" : "bg-[#8B7355]/20")} />
              ))}
            </div>
            <button 
              disabled={current === phases.length - 1}
              onClick={() => setCurrent(curr => curr + 1)}
              className="flex items-center gap-2 text-sm font-bold text-[#3D5A3E] disabled:opacity-30 uppercase tracking-widest"
            >
              Próxima <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
