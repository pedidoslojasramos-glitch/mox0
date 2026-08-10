import React, { useState } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
  PackageCheck,
  AlertCircle
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
    clearRouteDay 
  } = useRamoxContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchToAdd, setSelectedBranchToAdd] = useState<{ [dayKey: string]: string }>({});
  const [editingDayDetails, setEditingDayDetails] = useState<string | null>(null);
  const [tempDriver, setTempDriver] = useState('');
  const [tempPlate, setTempPlate] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

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
    return branchOrders.filter(o => o.branchId === branchId && (o.status === 'pending' || o.status === 'approved' || o.status === 'picking')).length;
  };

  // Add branch to route
  const handleAddBranch = (dayKey: string) => {
    const branchId = selectedBranchToAdd[dayKey];
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
              <p className="text-slate-400 font-medium">Roteirização semanal de entregas para as filiais (Segunda a Sábado).</p>
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
                {branchOrders.filter(o => o.status === 'pending' || o.status === 'approved' || o.status === 'picking').length} <span className="text-xs font-normal text-slate-400">pedidos</span>
              </h3>
            </div>
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
              <PackageCheck size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
        <Input 
          placeholder="Buscar filial ou cidade nas rotas..." 
          className="pl-11 h-11 bg-slate-900/80 border-slate-800 rounded-lg focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-500 shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 6 Columns Grid - Monday to Saturday */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
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
              className="bg-slate-900/70 border-slate-800 shadow-xl flex flex-col justify-between overflow-hidden relative group hover:border-slate-700/80 transition-all duration-300"
            >
              {/* Header */}
              <div>
                <div className={`p-4 border-b border-slate-800/80 bg-gradient-to-b ${day.headerGradient} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className={day.badgeText} />
                    <h3 className="font-bold text-white text-base tracking-tight">{day.dayName}</h3>
                  </div>
                  <Badge className={`${day.badgeBg} ${day.badgeText} border ${day.badgeBorder} font-mono font-bold px-2 py-0.5 text-xs`}>
                    {route.branchIds.length} {route.branchIds.length === 1 ? 'Loja' : 'Lojas'}
                  </Badge>
                </div>

                {/* Driver / Vehicle Subheader */}
                <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
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
                    className="h-6 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/80 font-bold"
                  >
                    Editar
                  </Button>
                </div>

                {/* Branch Cards List */}
                <div className="p-3 space-y-2.5 max-h-[420px] overflow-y-auto">
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

                      return (
                        <div 
                          key={branch.id} 
                          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-3 flex items-start justify-between gap-2 transition-all duration-200 group/item shadow-sm"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {index + 1}º
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-100 text-xs truncate group-hover/item:text-cyan-300 transition-colors">
                                {branch.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="shrink-0 text-slate-500" />
                                <span className="truncate">{branch.location}</span>
                              </p>
                              
                              {pendingOrders > 0 && (
                                <Badge className="mt-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0">
                                  {pendingOrders} {pendingOrders === 1 ? 'pedido pendente' : 'pedidos pendentes'}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveBranch(day.dayKey, branch.id)}
                            className="w-7 h-7 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0 transition-colors"
                            title={`Excluir filial ${branch.name} desta rota`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add Branch Footer */}
              <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Select 
                    value={selectedBranchToAdd[day.dayKey] || ''} 
                    onValueChange={(val) => setSelectedBranchToAdd(prev => ({ ...prev, [day.dayKey]: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500/50">
                      <SelectValue placeholder="Selecione a filial..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-60">
                      {unassignedBranches.length === 0 ? (
                        <div className="p-2 text-xs text-slate-500 text-center">Todas as filiais cadastradas nesta rota</div>
                      ) : (
                        unassignedBranches.map(b => (
                          <SelectItem key={b.id} value={b.id} className="text-xs hover:bg-slate-800 focus:bg-slate-800">
                            {b.name} ({b.location})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={() => handleAddBranch(day.dayKey)}
                    size="sm"
                    className="h-9 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shrink-0"
                    title="Adicionar filial a este dia"
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {route.branchIds.length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja limpar todas as filiais da rota de ${day.dayName}?`)) {
                        clearRouteDay(day.dayKey);
                        toast.info(`Rota de ${day.dayName} limpa com sucesso.`);
                      }
                    }}
                    className="w-full text-[10px] text-slate-500 hover:text-rose-400 transition-colors text-center py-1 font-medium flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={10} />
                    <span>Limpar rota deste dia</span>
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Route Details Dialog */}
      <Dialog open={Boolean(editingDayDetails)} onOpenChange={(open) => !open && setEditingDayDetails(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="text-cyan-400" size={20} />
              <span>Configurar Veículo e Motorista</span>
            </DialogTitle>
            <p className="text-xs text-slate-400">
              {editingDayDetails && DAYS_CONFIG.find(d => d.dayKey === editingDayDetails)?.dayName}
            </p>
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
