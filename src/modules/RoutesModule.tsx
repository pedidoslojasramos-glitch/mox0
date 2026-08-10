import React, { useState } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_DELIVERY_ROUTES } from '../services/mockDb';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Truck, 
  User, 
  Search, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  Info, 
  CheckCircle2, 
  RotateCcw,
  Store,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  PackageCheck,
  AlertCircle,
  Check,
  ListFilter,
  LayoutGrid,
  Columns3
} from 'lucide-react';
import { toast } from 'sonner';

interface DayConfig {
  dayKey: string;
  dayName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  headerGradient: string;
}

const DAYS_CONFIG: DayConfig[] = [
  { 
    dayKey: 'monday', 
    dayName: 'Segunda-feira', 
    badgeBg: 'bg-indigo-500/10', 
    badgeText: 'text-indigo-400', 
    badgeBorder: 'border-indigo-500/20',
    headerGradient: 'from-indigo-500/20 to-transparent'
  },
  { 
    dayKey: 'tuesday', 
    dayName: 'Terça-feira', 
    badgeBg: 'bg-cyan-500/10', 
    badgeText: 'text-cyan-400', 
    badgeBorder: 'border-cyan-500/20',
    headerGradient: 'from-cyan-500/20 to-transparent'
  },
  { 
    dayKey: 'wednesday', 
    dayName: 'Quarta-feira', 
    badgeBg: 'bg-emerald-500/10', 
    badgeText: 'text-emerald-400', 
    badgeBorder: 'border-emerald-500/20',
    headerGradient: 'from-emerald-500/20 to-transparent'
  },
  { 
    dayKey: 'thursday', 
    dayName: 'Quinta-feira', 
    badgeBg: 'bg-amber-500/10', 
    badgeText: 'text-amber-400', 
    badgeBorder: 'border-amber-500/20',
    headerGradient: 'from-amber-500/20 to-transparent'
  },
  { 
    dayKey: 'friday', 
    dayName: 'Sexta-feira', 
    badgeBg: 'bg-purple-500/10', 
    badgeText: 'text-purple-400', 
    badgeBorder: 'border-purple-500/20',
    headerGradient: 'from-purple-500/20 to-transparent'
  },
  { 
    dayKey: 'saturday', 
    dayName: 'Sábado', 
    badgeBg: 'bg-rose-500/10', 
    badgeText: 'text-rose-400', 
    badgeBorder: 'border-rose-500/20',
    headerGradient: 'from-rose-500/20 to-transparent'
  },
];

export function RoutesModule() {
  const { 
    branches, 
    branchOrders, 
    deliveryRoutes = DEFAULT_DELIVERY_ROUTES, 
    addBranchToRoute, 
    removeBranchFromRoute, 
    updateRouteDetails, 
    clearRouteDay,
    setRouteBranches
  } = useRamoxContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchToAdd, setSelectedBranchToAdd] = useState<{ [dayKey: string]: string }>({});
  const [editingDayDetails, setEditingDayDetails] = useState<string | null>(null);
  const [tempDriver, setTempDriver] = useState('');
  const [tempPlate, setTempPlate] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Multi-select modal state
  const [managingDayBranches, setManagingDayBranches] = useState<string | null>(null);
  const [manageSearchTerm, setManageSearchTerm] = useState('');
  const [tempSelectedBranchIds, setTempSelectedBranchIds] = useState<string[]>([]);

  // Layout mode state for city visualization: 'grid' (6 col rolável min-280px), 'expanded' (2-3 col largas), 'table' (tabela detalhada)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'expanded' | 'table'>('grid');

  // Helper to get route for day
  const getRouteForDay = (dayKey: string) => {
    return deliveryRoutes.find(r => r.dayKey === dayKey) || {
      dayKey,
      dayName: DAYS_CONFIG.find(d => d.dayKey === dayKey)?.dayName || dayKey,
      branchIds: [],
      driverName: '',
      vehiclePlate: '',
      notes: ''
    };
  };

  // Helper to count pending orders for a branch
  const getPendingOrdersCount = (branchId: string) => {
    return branchOrders.filter(o => o.branchId === branchId && (o.status === 'approved' || o.status === 'picking')).length;
  };

  // Add single branch to route
  const handleAddBranch = (dayKey: string, branchIdOverride?: string) => {
    const branchId = branchIdOverride || selectedBranchToAdd[dayKey];
    if (!branchId) {
      toast.error('Selecione uma filial para adicionar.');
      return;
    }
    const route = getRouteForDay(dayKey);
    if (route.branchIds.includes(branchId)) {
      toast.warning('Esta filial já está cadastrada nesta rota!');
      return;
    }

    addBranchToRoute(dayKey, branchId);
    const branch = branches.find(b => b.id === branchId);
    const dayConfig = DAYS_CONFIG.find(d => d.dayKey === dayKey);
    toast.success(`Filial "${branch?.name || branchId}" cadastrada na rota de ${dayConfig?.dayName}!`);
    setSelectedBranchToAdd(prev => ({ ...prev, [dayKey]: '' }));
  };

  // Remove branch from route
  const handleRemoveBranch = (dayKey: string, branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    const dayConfig = DAYS_CONFIG.find(d => d.dayKey === dayKey);
    removeBranchFromRoute(dayKey, branchId);
    toast.info(`Filial "${branch?.name || branchId}" removida da rota de ${dayConfig?.dayName}.`);
  };

  // Move branch sequence (up / down)
  const handleMoveBranch = (dayKey: string, branchId: string, direction: 'up' | 'down') => {
    const route = getRouteForDay(dayKey);
    const index = route.branchIds.indexOf(branchId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= route.branchIds.length) return;

    const updated = [...route.branchIds];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setRouteBranches(dayKey, updated);
  };

  // Manage branches modal
  const handleOpenManageBranches = (dayKey: string) => {
    const route = getRouteForDay(dayKey);
    setTempSelectedBranchIds([...route.branchIds]);
    setManageSearchTerm('');
    setManagingDayBranches(dayKey);
  };

  const handleToggleTempBranch = (branchId: string) => {
    setTempSelectedBranchIds(prev => 
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSelectAllBranches = () => {
    setTempSelectedBranchIds(branches.map(b => b.id));
  };

  const handleClearAllTempBranches = () => {
    setTempSelectedBranchIds([]);
  };

  const handleSaveManagedBranches = () => {
    if (!managingDayBranches) return;
    setRouteBranches(managingDayBranches, tempSelectedBranchIds);
    const dayConfig = DAYS_CONFIG.find(d => d.dayKey === managingDayBranches);
    toast.success(`Rota de ${dayConfig?.dayName} atualizada com ${tempSelectedBranchIds.length} filiais!`);
    setManagingDayBranches(null);
  };

  // Open Edit Details modal for a day
  const handleOpenEditDetails = (dayKey: string) => {
    const route = getRouteForDay(dayKey);
    setTempDriver(route.driverName || '');
    setTempPlate(route.vehiclePlate || '');
    setTempNotes(route.notes || '');
    setEditingDayDetails(dayKey);
  };

  // Save day details
  const handleSaveDetails = () => {
    if (!editingDayDetails) return;
    updateRouteDetails(editingDayDetails, {
      driverName: tempDriver,
      vehiclePlate: tempPlate,
      notes: tempNotes,
    });
    const dayConfig = DAYS_CONFIG.find(d => d.dayKey === editingDayDetails);
    toast.success(`Detalhes da rota de ${dayConfig?.dayName} atualizados!`);
    setEditingDayDetails(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Dia da Semana;Sequência;Nome da Filial;Localização;Gerente;Pedidos Pendentes;Motorista;Placa\n';
    DAYS_CONFIG.forEach(d => {
      const route = getRouteForDay(d.dayKey);
      if (route.branchIds.length === 0) {
        csv += `${d.dayName};-;Sem filiais cadastras;-;-;0;${route.driverName || '-'};${route.vehiclePlate || '-'}\n`;
      } else {
        route.branchIds.forEach((bId, idx) => {
          const b = branches.find(x => x.id === bId);
          const pending = getPendingOrdersCount(bId);
          csv += `${d.dayName};${idx + 1}º;${b?.name || bId};${b?.location || '-'};${b?.manager || '-'};${pending};${route.driverName || '-'};${route.vehiclePlate || '-'}\n`;
        });
      }
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotas_entrega_semanais_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Roteirização exportada para CSV/Excel com sucesso!');
  };

  // Statistics
  const totalScheduledBranches = deliveryRoutes.reduce((acc, r) => acc + (r.branchIds?.length || 0), 0);
  const totalActiveBranches = branches.length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/5">
              <Truck size={26} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Painel de Cadastro de Rotas
              </h2>
              <p className="text-slate-400 font-medium">Roteirização semanal de entregas para as 40 filiais (Segunda a Sábado).</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => setShowPrintModal(true)}
            variant="outline"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 h-11"
          >
            <Printer size={18} className="text-cyan-400" />
            <span className="font-semibold">Imprimir Rotas</span>
          </Button>

          <Button 
            onClick={handleExportCSV}
            variant="outline"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 h-11"
          >
            <FileSpreadsheet size={18} className="text-emerald-400" />
            <span className="font-semibold">Exportar Excel</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Agendado na Semana</p>
              <h3 className="text-2xl font-black text-white mt-1 font-mono">{totalScheduledBranches} <span className="text-xs font-normal text-slate-400">paradas</span></h3>
            </div>
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
              <Calendar size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filiais Cadastradas</p>
              <h3 className="text-2xl font-black text-white mt-1 font-mono">{totalActiveBranches} <span className="text-xs font-normal text-slate-400">lojas</span></h3>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
              <Store size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dias Operacionais</p>
              <h3 className="text-2xl font-black text-white mt-1 font-mono">6 Dias <span className="text-xs font-normal text-slate-400">(Seg - Sáb)</span></h3>
            </div>
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
              <Truck size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedidos em Separação</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1 font-mono">
                {branchOrders.filter(o => o.status === 'approved' || o.status === 'picking').length} <span className="text-xs font-normal text-slate-400">pedidos</span>
              </h3>
            </div>
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
              <PackageCheck size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Filter, View Mode Switcher & Quick Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <Input 
              placeholder="Buscar filial ou cidade nas rotas..." 
              className="pl-11 h-11 bg-slate-900/80 border-slate-800 rounded-lg focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-500 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                layoutMode === 'grid' 
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Grade semanal de 6 dias com colunas amplas e rolagem suave"
            >
              <LayoutGrid size={14} />
              <span>Grade Semanal</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode('expanded')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                layoutMode === 'expanded' 
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Visão com colunas expandidas para leitura fácil e legibilidade máxima das cidades"
            >
              <Columns3 size={14} />
              <span>Visão Ampla</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                layoutMode === 'table' 
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Visão em tabela geral com todas as cidades e filiais detalhadas"
            >
              <ListFilter size={14} />
              <span>Tabela Geral</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800 shrink-0">
          <Info size={14} className="text-cyan-400 shrink-0" />
          <span>Cidades e filiais com visualização nítida sem truncamento.</span>
        </div>
      </div>

      {/* Table Mode View */}
      {layoutMode === 'table' ? (
        <Card className="bg-slate-900/70 border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ListFilter size={18} className="text-cyan-400" />
              <span>Tabela Consolidada de Cidades e Rotas Semanais</span>
            </h3>
            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-xs">
              {totalScheduledBranches} paradas agendadas
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono">
                <tr>
                  <th className="py-3 px-4 font-bold">Dia</th>
                  <th className="py-3 px-4 font-bold">Seq.</th>
                  <th className="py-3 px-4 font-bold">Filial / Nome</th>
                  <th className="py-3 px-4 font-bold text-cyan-400">Cidade / Localização</th>
                  <th className="py-3 px-4 font-bold">Motorista / Placa</th>
                  <th className="py-3 px-4 font-bold text-center">Pedidos</th>
                  <th className="py-3 px-4 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {DAYS_CONFIG.map(d => {
                  const route = getRouteForDay(d.dayKey);
                  const assignedBranches = route.branchIds.map(bId => branches.find(b => b.id === bId)).filter(Boolean);
                  const filtered = assignedBranches.filter(b => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return b?.name.toLowerCase().includes(term) || b?.location.toLowerCase().includes(term);
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr key={d.dayKey} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-slate-300">{d.dayName}</td>
                        <td colSpan={6} className="py-3 px-4 text-slate-500 italic">Sem filiais agendadas para este dia.</td>
                      </tr>
                    );
                  }

                  return filtered.map((branch, idx) => {
                    if (!branch) return null;
                    const pending = getPendingOrdersCount(branch.id);
                    return (
                      <tr key={`${d.dayKey}-${branch.id}`} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-cyan-400">{d.dayName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">{idx + 1}º</td>
                        <td className="py-3 px-4 font-bold text-slate-100">{branch.name}</td>
                        <td className="py-3 px-4 font-bold text-cyan-300 bg-cyan-950/20 rounded">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-cyan-400 shrink-0" />
                            <span>{branch.location || branch.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {route.driverName ? `${route.driverName} ${route.vehiclePlate ? `(${route.vehiclePlate})` : ''}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {pending > 0 ? (
                            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                              {pending} pendentes
                            </Badge>
                          ) : (
                            <span className="text-slate-600 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBranch(d.dayKey, branch.id)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Remover da rota"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid and Expanded Views */
        <div className={
          layoutMode === 'expanded' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "flex gap-5 overflow-x-auto pb-4 scrollbar-thin"
        }>
          {DAYS_CONFIG.map((day) => {
            const route = getRouteForDay(day.dayKey);
            const assignedBranches = route.branchIds.map(bId => branches.find(b => b.id === bId)).filter(Boolean);
            
            // Filter branches by search term if active
            const filteredBranchList = assignedBranches.filter(b => {
              if (!searchTerm) return true;
              const term = searchTerm.toLowerCase();
              return b?.name.toLowerCase().includes(term) || b?.location.toLowerCase().includes(term);
            });

            // Unassigned branches for dropdown selector
            const unassignedBranches = branches.filter(b => !route.branchIds.includes(b.id));

            return (
              <Card 
                key={day.dayKey} 
                className={`bg-slate-900/70 border-slate-800 shadow-xl flex flex-col justify-between overflow-hidden relative group hover:border-slate-700/80 transition-all duration-300 ${
                  layoutMode === 'grid' ? "min-w-[290px] w-[290px] sm:w-[310px] shrink-0" : "w-full"
                }`}
              >
                {/* Header */}
                <div>
                  <div className={`p-4 border-b border-slate-800/80 bg-gradient-to-b ${day.headerGradient} flex items-center justify-between`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar size={18} className={`${day.badgeText} shrink-0`} />
                      <h3 className="font-bold text-white text-sm sm:text-base tracking-tight whitespace-nowrap">{day.dayName}</h3>
                    </div>
                    <Badge className={`${day.badgeBg} ${day.badgeText} border ${day.badgeBorder} font-mono font-bold px-2 py-0.5 text-xs shrink-0`}>
                      {route.branchIds.length} {route.branchIds.length === 1 ? 'Loja' : 'Lojas'}
                    </Badge>
                  </div>

                  {/* Driver / Vehicle Subheader */}
                  <div className="px-3.5 py-2.5 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <Truck size={14} className="text-slate-500 shrink-0" />
                      <span className="truncate">
                        {route.driverName ? `${route.driverName} ${route.vehiclePlate ? `(${route.vehiclePlate})` : ''}` : 'Sem motorista definido'}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenEditDetails(day.dayKey)}
                      className="h-6 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/80 font-bold shrink-0"
                    >
                      Editar
                    </Button>
                  </div>

                  {/* Branch Cards List */}
                  <div className="p-3 space-y-2.5 max-h-[460px] overflow-y-auto">
                    {filteredBranchList.length === 0 ? (
                      <div className="py-8 px-3 text-center border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
                        <MapPin size={28} className="mx-auto text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Nenhuma filial cadastrada nesta rota.</p>
                        <p className="text-[10px] text-slate-600 mt-1">Selecione uma filial abaixo para cadastrar.</p>
                      </div>
                    ) : (
                      filteredBranchList.map((branch, index) => {
                        if (!branch) return null;
                        const pendingOrders = getPendingOrdersCount(branch.id);
                        const isFirst = index === 0;
                        const isLast = index === filteredBranchList.length - 1;

                        return (
                          <div 
                            key={branch.id} 
                            className="bg-slate-950/70 hover:bg-slate-900 border border-slate-800/90 hover:border-cyan-500/50 rounded-xl p-3 transition-all duration-200 group/item shadow-sm space-y-2"
                          >
                            {/* Header Row: Sequence, Branch Title, and Reorder Actions */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                                  {index + 1}º
                                </span>
                                <h4 className="font-bold text-slate-100 text-xs break-words leading-snug group-hover/item:text-cyan-300 transition-colors">
                                  {branch.name}
                                </h4>
                              </div>

                              {/* Reorder & Delete Actions */}
                              <div className="flex items-center gap-0.5 shrink-0 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                                <button
                                  disabled={isFirst}
                                  onClick={() => handleMoveBranch(day.dayKey, branch.id, 'up')}
                                  className="w-5 h-5 text-slate-400 hover:text-cyan-400 disabled:opacity-20 flex items-center justify-center transition-colors"
                                  title="Mover para cima na sequência"
                                >
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  disabled={isLast}
                                  onClick={() => handleMoveBranch(day.dayKey, branch.id, 'down')}
                                  className="w-5 h-5 text-slate-400 hover:text-cyan-400 disabled:opacity-20 flex items-center justify-center transition-colors"
                                  title="Mover para baixo na sequência"
                                >
                                  <ChevronDown size={13} />
                                </button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveBranch(day.dayKey, branch.id)}
                                  className="w-5 h-5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                  title={`Excluir filial ${branch.name} desta rota`}
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>

                            {/* High-Contrast City & Location Badge */}
                            <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-2.5 flex items-start gap-2 shadow-inner">
                              <MapPin size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">
                                  Cidade / Localização:
                                </span>
                                <p className="text-[11px] font-bold text-cyan-300 leading-tight break-words mt-0.5">
                                  {branch.location || branch.name}
                                </p>
                              </div>
                            </div>

                            {/* Pending Orders Badge */}
                            {pendingOrders > 0 && (
                              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-bold">
                                <PackageCheck size={12} className="shrink-0 text-amber-400" />
                                <span>{pendingOrders} {pendingOrders === 1 ? 'pedido pendente' : 'pedidos pendentes'}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Add Branch Footer (Fixed Flex Layout - Never Overflows) */}
                <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 w-full">
                    <div className="flex-1 min-w-0">
                      <Select 
                        value={selectedBranchToAdd[day.dayKey] || ''} 
                        onValueChange={(val) => {
                          if (val) {
                            handleAddBranch(day.dayKey, val);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500/50 w-full min-w-0">
                          <SelectValue placeholder="+ Incluir filial..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-60">
                          {unassignedBranches.length === 0 ? (
                            <div className="p-2 text-xs text-slate-500 text-center">Todas as filiais já incluídas</div>
                          ) : (
                            unassignedBranches.map(b => (
                              <SelectItem key={b.id} value={b.id} className="text-xs hover:bg-slate-800 focus:bg-slate-800">
                                {b.name} ({b.location})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={() => handleAddBranch(day.dayKey)}
                      size="sm"
                      className="h-9 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-md shadow-cyan-600/20"
                      title="Adicionar filial selecionada"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">Incluir</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
                    <button 
                      onClick={() => handleOpenManageBranches(day.dayKey)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} />
                      <span>Selecionar Múltiplas</span>
                    </button>

                    {route.branchIds.length > 0 && (
                      <button 
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja limpar todas as filiais da rota de ${day.dayName}?`)) {
                            clearRouteDay(day.dayKey);
                            toast.info(`Rota de ${day.dayName} limpa com sucesso.`);
                          }
                        }}
                        className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors font-medium flex items-center gap-1"
                        title="Limpar todas as filiais deste dia"
                      >
                        <RotateCcw size={10} />
                        <span>Limpar</span>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Manage Day Branches Modal (Multi-Select) */}
      <Dialog open={Boolean(managingDayBranches)} onOpenChange={(open) => !open && setManagingDayBranches(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="text-cyan-400" size={22} />
                <span>Selecionar Filiais - {managingDayBranches && DAYS_CONFIG.find(d => d.dayKey === managingDayBranches)?.dayName}</span>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-xs">
                {tempSelectedBranchIds.length} selecionadas
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Marque ou desmarque as filiais que farão parte da rota deste dia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col">
            {/* Search & Quick Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input 
                  placeholder="Buscar por nome ou cidade..." 
                  value={manageSearchTerm}
                  onChange={(e) => setManageSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllBranches} 
                  className="h-8 text-[11px] bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                >
                  Marcar Todas
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearAllTempBranches} 
                  className="h-8 text-[11px] bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* List of Branches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[380px] p-1 border border-slate-800/80 rounded-xl bg-slate-950/40">
              {branches
                .filter(b => {
                  if (!manageSearchTerm) return true;
                  const term = manageSearchTerm.toLowerCase();
                  return b.name.toLowerCase().includes(term) || b.location.toLowerCase().includes(term);
                })
                .map(branch => {
                  const isChecked = tempSelectedBranchIds.includes(branch.id);
                  const pending = getPendingOrdersCount(branch.id);

                  return (
                    <div 
                      key={branch.id} 
                      onClick={() => handleToggleTempBranch(branch.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked 
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 bg-cyan-500 text-slate-950 rounded flex items-center justify-center font-bold">
                            <Check size={14} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border border-slate-700 rounded bg-slate-900" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className={`text-xs font-bold truncate ${isChecked ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {branch.name}
                          </h5>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="shrink-0 text-slate-500" />
                          <span>{branch.location}</span>
                        </p>
                        {pending > 0 && (
                          <Badge className="mt-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0 font-bold">
                            {pending} pedidos pendentes
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-800 pt-3">
            <Button variant="ghost" onClick={() => setManagingDayBranches(null)} className="text-slate-400">
              Cancelar
            </Button>
            <Button onClick={handleSaveManagedBranches} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2">
              <CheckCircle2 size={16} />
              <span>Salvar Filiais da Rota ({tempSelectedBranchIds.length})</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Details Dialog */}
      <Dialog open={Boolean(editingDayDetails)} onOpenChange={(open) => !open && setEditingDayDetails(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="text-cyan-400" size={20} />
              <span>Configurar Veículo e Motorista</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {editingDayDetails && DAYS_CONFIG.find(d => d.dayKey === editingDayDetails)?.dayName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nome do Motorista / Transportador</label>
              <Input 
                placeholder="Ex: Carlos Silva"
                value={tempDriver}
                onChange={(e) => setTempDriver(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Placa do Veículo / Caminhão</label>
              <Input 
                placeholder="Ex: ABC-1234"
                value={tempPlate}
                onChange={(e) => setTempPlate(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Observações da Rota</label>
              <Input 
                placeholder="Ex: Saída às 06:00 do galpão central."
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500/50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditingDayDetails(null)} className="text-slate-400 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSaveDetails} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
              Salvar Detalhes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Weekly Route Summary Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-800 pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Printer className="text-cyan-400" size={22} />
              <span>Grade Semanal de Roteirização de Entregas</span>
            </DialogTitle>
            <CardDescription className="text-slate-400">
              Relatório consolidado das rotas de entrega por dia da semana (Segunda a Sábado).
            </CardDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS_CONFIG.map(d => {
                const route = getRouteForDay(d.dayKey);
                const assignedBranches = route.branchIds.map(bId => branches.find(b => b.id === bId)).filter(Boolean);

                return (
                  <div key={d.dayKey} className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h4 className="font-bold text-cyan-400 text-sm">{d.dayName}</h4>
                      <Badge className="bg-slate-800 text-slate-300 font-mono text-xs">{assignedBranches.length} filiais</Badge>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p><strong className="text-slate-300">Motorista:</strong> {route.driverName || 'Não informado'}</p>
                      <p><strong className="text-slate-300">Placa:</strong> {route.vehiclePlate || 'Não informada'}</p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sequência de Entrega:</p>
                      {assignedBranches.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">Sem filiais agendadas</p>
                      ) : (
                        assignedBranches.map((b, idx) => (
                          <div key={b?.id} className="text-xs text-slate-200 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                            <span className="font-mono text-cyan-400 font-bold">{idx + 1}º</span>
                            <span className="font-medium truncate">{b?.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-500">Impressão otimizada para despacho de mercadorias e motoristas.</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setShowPrintModal(false)} className="text-slate-400">
                Fechar
              </Button>
              <Button onClick={() => window.print()} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2">
                <Printer size={16} />
                <span>Imprimir Agora</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
