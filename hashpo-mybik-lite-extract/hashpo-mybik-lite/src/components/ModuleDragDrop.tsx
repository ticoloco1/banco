import { useState, useRef } from "react";
import { GripVertical } from "lucide-react";

interface ModuleDragDropProps {
  modules: { id: string; label: string; icon: string }[];
  order: string[];
  onReorder: (newOrder: string[]) => void;
}

export default function ModuleDragDrop({ modules, order, onReorder }: ModuleDragDropProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const ordered = order.map(id => modules.find(m => m.id === id)).filter(Boolean) as typeof modules;
  modules.forEach(m => { if (!ordered.find(o => o.id === m.id)) ordered.push(m); });

  const handleDragStart = (idx: number) => { setDragIdx(idx); dragRef.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragRef.current === null || dragRef.current === idx) { setDragIdx(null); setOverIdx(null); return; }
    const newOrder = [...ordered.map(m => m.id)];
    const [moved] = newOrder.splice(dragRef.current, 1);
    newOrder.splice(idx, 0, moved);
    onReorder(newOrder);
    setDragIdx(null); setOverIdx(null);
  };

  return (
    <div className="space-y-1.5">
      {ordered.map((mod, idx) => (
        <div key={mod.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)} onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none
            ${dragIdx === idx ? "opacity-50 scale-95" : ""} ${overIdx === idx && dragIdx !== idx ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:bg-secondary"}`}>
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm">{mod.icon}</span>
          <span className="text-xs font-bold text-foreground">{mod.label}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">#{idx + 1}</span>
        </div>
      ))}
    </div>
  );
}
