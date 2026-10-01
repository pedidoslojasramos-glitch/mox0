import React, { useState, useEffect } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import { toValidUUID, findProductHelper } from '../services/ramoxContext';
import ExportExcelModal from '../components/ExportExcelModal';
import Pagination from '../components/Pagination';
import { generateRomaneioPDF, generateBoxLabelPDF, generateManualPickingPDF, generateManualInventoryCountPDF } from '../utils/pdfGenerator';
import { RoutesModule } from './RoutesModule';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ClipboardList,
  Box,
  Search,
  Smartphone,
  Monitor,
  Plus,
  Minus,
  Printer,
  FileText,
  FileDown,
  List,
  LayoutGrid,
  XCircle,
  X,
  RotateCcw,
  Calendar,
  Filter,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function LogisticsModule({ initialTab }: { initialTab?: string }) {
  const { 
    branchOrders, 
    products, 
    updateBranchOrderStatus, 
    batchUpdateBranchOrderStatus,
    branches, 
    globalSearch, 
    setGlobalSearch,
    inventoryCounts, 
    completeInventoryCount,
    cancelInventoryCount,
    cancelAllPendingInventoryCounts,
    purchaseOrders,
    suppliers,
    updatePurchaseOrderStatus,
    settings
  } = useRamoxContext();
  const normalizedInitialTab = !initialTab || initialTab === 'pending' || initialTab === 'picking' ? 'picking_cities' : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedInitialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPickingOrder, setSelectedPickingOrder] = useState<any>(null);
  const [pickedQuantities, setPickedQuantities] = useState<Record<string, string>>({});
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'auto' | 'collector' | 'desktop'>('auto');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [labelOrderPrompt, setLabelOrderPrompt] = useState<any>(null);
  const [labelCount, setLabelCount] = useState<number>(1);
  const [readyViewMode, setReadyViewMode] = useState<'list' | 'grid'>('list');
  const [selectedPickingOrderIds, setSelectedPickingOrderIds] = useState<string[]>([]);
  
  // Filtros avançados para o Painel de Separação (Picking)
  const [pickingStatusFilter, setPickingStatusFilter] = useState<'active' | 'approved' | 'picking' | 'picked' | 'pending' | 'rejected' | 'all'>('active');
  const [pickingStartDateFilter, setPickingStartDateFilter] = useState('');
  const [pickingEndDateFilter, setPickingEndDateFilter] = useState('');
  const [pickingDatePreset, setPickingDatePreset] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'custom'>('all');
  const [pickingBranchFilter, setPickingBranchFilter] = useState<string>('all');

  // Modais de cancelamento direto de separação (sem devolver para aprovação)
  const [cancelDirectOrderPrompt, setCancelDirectOrderPrompt] = useState<any>(null);
  const [cancelDirectBatchPromptOpen, setCancelDirectBatchPromptOpen] = useState(false);
  const [directCancelReason, setDirectCancelReason] = useState('');

  const handlePrintRomaneioPDF = (order: any) => {
    const branch = findBranch(order.branchId);
    generateRomaneioPDF(
      order,
      branch,
      products,
      order.approvedBy || 'Administrador Central',
      settings?.companyLogo
    );
    toast.success(`Romaneio / PDF do Pedido #${order.id.toUpperCase()} gerado!`);
  };

  const handleGenerateBoxLabels = (order: any, count: number) => {
    const branch = findBranch(order.branchId);
    generateBoxLabelPDF(
      order,
      branch,
      count || 1,
      settings?.companyLogo
    );
    toast.success(`${count} etiqueta(s) A4 gerada(s) para o Pedido #${order.id.toUpperCase()}!`);
    setLabelOrderPrompt(null);
  };

  const handleManualPickingPDF = (order: any, openModal: boolean = true) => {
    const branch = findBranch(order.branchId);
    generateManualPickingPDF(
      order,
      branch,
      products,
      order.approvedBy || 'Administrador Central',
      settings?.companyLogo
    );
    if (order.status === 'approved') {
      updateBranchOrderStatus(order.id, 'picking');
    }
    toast.success(`Folha de Separação Manual (Picking) emitida para o Pedido #${order.id.toUpperCase()}!`);
    if (openModal) {
      setPickedQuantities({});
      setSelectedPickingOrder(order);
    }
  };

  const handleDownloadManualCountPDF = () => {
    if (pendingCounts.length === 0) {
      toast.info('Não há solicitações de contagem de inventário pendentes no momento.');
      return;
    }
    generateManualInventoryCountPDF(
      pendingCounts,
      products,
      'Equipe de Logística / Almoxarifado Central',
      settings?.companyLogo
    );
    toast.success(`Folha de Contagem Manual em PDF (${pendingCounts.length} itens) gerada com sucesso!`);
  };

  // Auto-detect mobile size or user agent (e.g. mobile phones or rugged data collectors)
  useEffect(() => {
    const checkViewport = () => {
      const isMobile = typeof window !== 'undefined' && (
        window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
      setIsMobileDevice(isMobile);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Sync state if initialTab changes from parent
  useEffect(() => {
    if (initialTab) {
      const norm = initialTab === 'pending' || initialTab === 'picking' ? 'picking_cities' : initialTab;
      setActiveTab(norm);
    }
  }, [initialTab]);

  // Hide sidebar when picking order is active, show when cleared
  useEffect(() => {
    if (selectedPickingOrder) {
      window.dispatchEvent(new CustomEvent('hide-sidebar'));
    } else {
      window.dispatchEvent(new CustomEvent('show-sidebar'));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('show-sidebar'));
    };
  }, [selectedPickingOrder]);

  // Hide sidebar when receiving order is active, show when cleared
  useEffect(() => {
    if (selectedPurchaseOrder) {
      window.dispatchEvent(new CustomEvent('hide-sidebar'));
    } else {
      window.dispatchEvent(new CustomEvent('show-sidebar'));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('show-sidebar'));
    };
  }, [selectedPurchaseOrder]);

  const effectiveSearch = (searchTerm || globalSearch || '').trim();

  const findProduct = (productIdOrCode?: string) => {
    const match = findProductHelper(products, productIdOrCode);
    if (match) return match;
    return {
      id: productIdOrCode || 'unknown',
      name: productIdOrCode ? `Produto #${productIdOrCode}` : 'Produto Não Identificado',
      code: productIdOrCode || 'N/A',
      unit: 'un',
      category: 'Geral',
      price: 0,
      currentStock: 0,
      minStock: 0,
      image: ''
    };
  };

  const findBranch = (branchId?: string) => {
    if (!branchId) {
      return {
        id: 'unknown',
        name: 'Filial Matriz / Central',
        location: 'Central de Distribuição',
        manager: 'Gerente Operacional'
      };
    }
    const clean = branchId.trim().toLowerCase();
    const match = branches.find(b => 
      b.id.toLowerCase() === clean || 
      toValidUUID(b.id) === toValidUUID(branchId) ||
      b.name.toLowerCase() === clean ||
      (b.code && b.code.toLowerCase() === clean)
    );
    if (match) return match;
    return {
      id: branchId,
      name: `Filial #${branchId}`,
      location: 'Unidade da Rede',
      manager: 'Gerente da Filial'
    };
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'routes': return 'Painel de Cadastro de Rotas';
      case 'picking_cities': return 'Fila de Separação (Picking)';
      case 'loading': return 'Carregamento / Expedição';
      case 'ready': return 'Pedidos Enviados / Histórico';
      case 'incoming': return 'Recebimento de Mercadorias';
      case 'counts': return 'Contagens de Inventário';
      default: return 'Módulo Logístico';
    }
  };

  const getDescription = () => {
    switch (activeTab) {
      case 'routes': return 'Roteirização semanal de entregas e cadastro de filiais por dia (Segunda a Sábado).';
      case 'picking_cities': return 'Selecione uma separação pendente e confira os itens para envio.';
      case 'loading': return 'Controle de carregamento e expedição por cidade / praça de entrega.';
      case 'ready': return 'Histórico de pedidos já despachados para as filiais.';
      case 'incoming': return 'Pedidos de compra aguardando recebimento físico.';
      case 'counts': return 'Verificações de estoque solicitadas pelo administrativo.';
      default: return 'Operação de separação e expedição de pedidos.';
    }
  };

  const filteredOrders = branchOrders.filter(order => {
    const branch = findBranch(order.branchId);
    if (!effectiveSearch) return true;
    const q = effectiveSearch.toLowerCase();

    const idMatch = (order.id || '').toLowerCase().includes(q);
    const branchNameMatch = branch?.name ? branch.name.toLowerCase().includes(q) : false;
    const branchLocMatch = branch?.location ? branch.location.toLowerCase().includes(q) : false;
    const branchCodeMatch = branch?.code ? branch.code.toLowerCase().includes(q) : false;
    const notesMatch = (order.notes || '').toLowerCase().includes(q);
    const itemsMatch = (order.items || []).some(item => {
      const p = findProduct(item.productId);
      return (p?.name && p.name.toLowerCase().includes(q)) || (p?.code && p.code.toLowerCase().includes(q));
    });

    return idMatch || branchNameMatch || branchLocMatch || branchCodeMatch || notesMatch || itemsMatch;
  });

  // Atalhos de período para o Painel de Separação
  const applyPickingDatePreset = (preset: string) => {
    setPickingDatePreset(preset as any);
    const now = new Date();
    const formatIsoDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      setPickingStartDateFilter('');
      setPickingEndDateFilter('');
    } else if (preset === 'today') {
      const todayStr = formatIsoDate(now);
      setPickingStartDateFilter(todayStr);
      setPickingEndDateFilter(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatIsoDate(yest);
      setPickingStartDateFilter(yestStr);
      setPickingEndDateFilter(yestStr);
    } else if (preset === '7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      setPickingStartDateFilter(formatIsoDate(start));
      setPickingEndDateFilter(formatIsoDate(now));
    } else if (preset === '30days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      setPickingStartDateFilter(formatIsoDate(start));
      setPickingEndDateFilter(formatIsoDate(now));
    } else if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setPickingStartDateFilter(formatIsoDate(start));
      setPickingEndDateFilter(formatIsoDate(now));
    }
  };

  const handleClearPickingFilters = () => {
    setPickingStatusFilter('active');
    setPickingStartDateFilter('');
    setPickingEndDateFilter('');
    setPickingDatePreset('all');
    setPickingBranchFilter('all');
    setSearchTerm('');
    if (setGlobalSearch) setGlobalSearch('');
    setCurrentPickingPage(1);
    setSelectedPickingOrderIds([]);
  };

  // Total de pedidos ativos na fila de separação (Aprovados + Em Separação)
  const totalActivePickingCount = filteredOrders.filter(o => {
    const s = (o.status || '').toLowerCase().trim();
    return s === 'approved' || s === 'picking';
  }).length;

  const pickingCitiesOrders = filteredOrders
    .filter(o => {
      const s = (o.status || '').toLowerCase().trim();

      // 1. Filtro de Status
      if (pickingStatusFilter === 'active') {
        if (s !== 'approved' && s !== 'picking') return false;
      } else if (pickingStatusFilter === 'approved') {
        if (s !== 'approved') return false;
      } else if (pickingStatusFilter === 'picking') {
        if (s !== 'picking') return false;
      } else if (pickingStatusFilter === 'picked') {
        if (s !== 'picked') return false;
      } else if (pickingStatusFilter === 'pending') {
        if (s !== 'pending') return false;
      } else if (pickingStatusFilter === 'rejected') {
        if (s !== 'rejected') return false;
      }
      // 'all' inclui qualquer status

      // 2. Filtro de Filial
      if (pickingBranchFilter !== 'all') {
        const match = o.branchId === pickingBranchFilter || 
                      toValidUUID(o.branchId) === toValidUUID(pickingBranchFilter);
        if (!match) return false;
      }

      // 3. Filtro de Período (Data Inicial e Final)
      if (pickingStartDateFilter || pickingEndDateFilter) {
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        if (isNaN(orderDate.getTime())) return false;

        if (pickingStartDateFilter) {
          const start = new Date(pickingStartDateFilter + 'T00:00:00');
          if (orderDate < start) return false;
        }
        if (pickingEndDateFilter) {
          const end = new Date(pickingEndDateFilter + 'T23:59:59.999');
          if (orderDate > end) return false;
        }
      }

      return true;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const loadingOrders = filteredOrders.filter(o => {
    const s = (o.status || '').toLowerCase().trim();
    return s === 'picked' || s === 'invoiced' || s === 'loading';
  });
  const finishedOrders = filteredOrders.filter(o => {
    const s = (o.status || '').toLowerCase().trim();
    return s === 'shipped' || s === 'delivered';
  });
  
  const pendingCounts = inventoryCounts.filter(c => c.status === 'pending');
  const incomingPurchases = purchaseOrders.filter(o => o.status === 'approved' || o.status === 'pending' || o.status === 'checked');

  const [currentPickingPage, setCurrentPickingPage] = useState(1);
  const [currentReadyPage, setCurrentReadyPage] = useState(1);
  const [currentIncomingPage, setCurrentIncomingPage] = useState(1);
  const [currentCountsPage, setCurrentCountsPage] = useState(1);

  useEffect(() => {
    setCurrentPickingPage(1);
    setCurrentReadyPage(1);
    setCurrentIncomingPage(1);
    setCurrentCountsPage(1);
    setSelectedPickingOrderIds([]);
  }, [searchTerm, globalSearch, activeTab, pickingStatusFilter, pickingStartDateFilter, pickingEndDateFilter, pickingBranchFilter]);

  const paginatedPickingOrders = pickingCitiesOrders.slice((currentPickingPage - 1) * 15, currentPickingPage * 15);
  const paginatedFinishedOrders = finishedOrders.slice((currentReadyPage - 1) * 15, currentReadyPage * 15);
  const paginatedIncomingPurchases = incomingPurchases.slice((currentIncomingPage - 1) * 15, currentIncomingPage * 15);
  const paginatedPendingCounts = pendingCounts.slice((currentCountsPage - 1) * 15, currentCountsPage * 15);

  const handleToggleSelectAllPicking = () => {
    if (paginatedPickingOrders.length === 0) return;
    const allPaginatedSelected = paginatedPickingOrders.every(o => selectedPickingOrderIds.includes(o.id));
    if (allPaginatedSelected) {
      setSelectedPickingOrderIds(prev => prev.filter(id => !paginatedPickingOrders.some(p => p.id === id)));
    } else {
      const idsToAdd = paginatedPickingOrders.map(o => o.id);
      setSelectedPickingOrderIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
    }
  };

  const handleToggleSelectPicking = (orderId: string) => {
    setSelectedPickingOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  const handleCancelSinglePicking = (order: any, returnToPending: boolean = false) => {
    if (returnToPending) {
      updateBranchOrderStatus(order.id, 'pending');
      toast.info(`Pedido #${order.id.toUpperCase()} devolvido para a fila de aprovação administrativa.`);
    } else {
      updateBranchOrderStatus(order.id, 'approved');
      toast.info(`Separação do Pedido #${order.id.toUpperCase()} cancelada/resetada. O pedido retornou para Aguardando Início (Aprovado).`);
    }
  };

  const handleBatchCancelPicking = (returnToPending: boolean = false) => {
    if (selectedPickingOrderIds.length === 0) return;
    const count = selectedPickingOrderIds.length;
    const targetStatus = returnToPending ? 'pending' : 'approved';
    batchUpdateBranchOrderStatus(selectedPickingOrderIds, targetStatus);
    if (returnToPending) {
      toast.info(`${count} pedido(s) devolvido(s) para a fila de aprovação.`);
    } else {
      toast.info(`${count} separação(ões) cancelada(s)/resetada(s). Pedidos retornaram para Aguardando Início (Aprovado).`);
    }
    setSelectedPickingOrderIds([]);
  };

  // Cancelar diretamente a separação de um pedido sem devolver para aprovação
  const handleConfirmDirectCancel = () => {
    if (!cancelDirectOrderPrompt) return;
    const orderId = cancelDirectOrderPrompt.id;
    updateBranchOrderStatus(orderId, 'rejected');
    toast.success(`Separação do Pedido #${orderId.toUpperCase()} cancelada diretamente com sucesso! Itens liberados no estoque central.`);
    setCancelDirectOrderPrompt(null);
    setDirectCancelReason('');
    if (selectedPickingOrder?.id === orderId) {
      setSelectedPickingOrder(null);
      setPickedQuantities({});
    }
  };

  // Cancelar diretamente em lote as separações selecionadas sem devolver para aprovação
  const handleConfirmBatchDirectCancel = () => {
    if (selectedPickingOrderIds.length === 0) return;
    const count = selectedPickingOrderIds.length;
    batchUpdateBranchOrderStatus(selectedPickingOrderIds, 'rejected');
    toast.success(`${count} separação(ões) cancelada(s) diretamente com sucesso! Itens estornados ao estoque sem devolução para aprovação.`);
    setSelectedPickingOrderIds([]);
    setCancelDirectBatchPromptOpen(false);
  };

  const handleBatchConfirmPicking = () => {
    if (selectedPickingOrderIds.length === 0) return;
    const count = selectedPickingOrderIds.length;
    batchUpdateBranchOrderStatus(selectedPickingOrderIds, 'picked');
    toast.success(`${count} separação(ões) confirmada(s) com sucesso!`);
    setSelectedPickingOrderIds([]);
  };

  const handleBatchPrintPickingPDF = () => {
    if (selectedPickingOrderIds.length === 0) return;
    const selectedOrders = branchOrders.filter(o => selectedPickingOrderIds.includes(o.id));
    if (selectedOrders.length === 0) return;

    const firstBranch = findBranch(selectedOrders[0].branchId);
    generateManualPickingPDF(
      selectedOrders,
      firstBranch,
      products,
      'Administrador Central',
      settings?.companyLogo
    );
    toast.success(`Folha de Separação Manual em Lote (${selectedOrders.length} pedidos) emitida com Checkpoints!`);
  };

  // Group approved orders by city
  const ordersByCity = pickingCitiesOrders.reduce((acc, order) => {
    const branch = findBranch(order.branchId);
    const city = (branch?.location || branch?.name || 'Central / Sem Cidade').trim();
    if (!acc[city]) acc[city] = [];
    acc[city].push(order);
    return acc;
  }, {} as Record<string, typeof branchOrders>);

  // Group loading orders by city
  const loadingOrdersByCity = loadingOrders.reduce((acc, order) => {
    const branch = findBranch(order.branchId);
    const city = (branch?.location || branch?.name || 'Central / Sem Cidade').trim();
    if (!acc[city]) acc[city] = [];
    acc[city].push(order);
    return acc;
  }, {} as Record<string, typeof branchOrders>);

  const handleStartLoadingForCity = (city: string, orders: any[]) => {
    const toLoad = orders.filter(o => o.status === 'picked' || o.status === 'invoiced');
    if (toLoad.length === 0) {
      toast.info(`Todos os pedidos da cidade ${city} já estão em carregamento ou foram despachados.`);
      return;
    }
    const ids = toLoad.map(o => o.id);
    batchUpdateBranchOrderStatus(ids, 'loading');
    toast.success(`Carregamento iniciado para ${ids.length} pedido(s) da praça ${city}!`);
  };

  const handleDispatchCityOrders = (city: string, orders: any[]) => {
    const toShip = orders.filter(o => o.status === 'loading' || o.status === 'picked' || o.status === 'invoiced');
    if (toShip.length === 0) {
      toast.info(`Nenhum pedido pendente de despacho para ${city}.`);
      return;
    }
    const ids = toShip.map(o => o.id);
    batchUpdateBranchOrderStatus(ids, 'shipped');
    toast.success(`Carga despachada com sucesso para a praça ${city} (${ids.length} pedido(s) em trânsito)!`);
  };

  const handleCityLoadingAction = (city: string, orders: any[]) => {
    const toLoad = orders.filter(o => o.status === 'picked' || o.status === 'invoiced');
    if (toLoad.length > 0) {
      handleStartLoadingForCity(city, orders);
    } else {
      handleDispatchCityOrders(city, orders);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">{getTitle()}</h2>
          <p className="text-slate-400 font-medium tracking-wide">{getDescription()}</p>
        </div>
        <div className="relative w-full md:w-96 group flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <Input 
              placeholder="Buscar por Pedido, Cidade, Filial ou Item..." 
              className="pl-12 pr-10 h-12 bg-slate-900/50 border-slate-800 rounded-lg focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {(searchTerm || effectiveSearch) && (
              <button 
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  if (setGlobalSearch) setGlobalSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 rounded-lg mb-8 backdrop-blur-md h-auto flex flex-wrap gap-1">
          <TabsTrigger value="routes" className="rounded-md px-5 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all font-bold flex items-center gap-2">
            <span>Cadastro de Rotas</span>
          </TabsTrigger>
          <TabsTrigger value="picking_cities" className="rounded-md px-5 py-2.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all font-bold">
            Separação ({totalActivePickingCount} Ativos)
          </TabsTrigger>
          <TabsTrigger value="loading" className="rounded-md px-5 py-2.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all font-bold">
            Carregamento ({loadingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-md px-5 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all font-bold">
            Enviados ({finishedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="rounded-md px-5 py-2.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white transition-all font-bold">
            Recebimento ({incomingPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="counts" className="rounded-md px-5 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all font-bold group border border-slate-800">
            Contagens ({pendingCounts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <RoutesModule />
        </TabsContent>

        <TabsContent value="picking_cities">
          <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 pb-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <span>Fila de Separações & Conferência</span>
                    <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                      {totalActivePickingCount} Em Fila Ativa
                    </Badge>
                    {(pickingStatusFilter !== 'active' || pickingStartDateFilter || pickingEndDateFilter || pickingBranchFilter !== 'all' || effectiveSearch) && (
                      <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                        {pickingCitiesOrders.length} Exibido(s)
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">
                    Gerencie pedidos em separação com filtros de status e período. Inicie conferências ou cancele separações diretamente sem retornar para a aprovação.
                  </p>
                </div>
                <ExportExcelModal
                  title="Exportar Lista de Separação (Picking)"
                  description="Exporte os pedidos em fila de separação para impressão ou conferência offline."
                  data={pickingCitiesOrders.map(o => {
                    const branch = findBranch(o.branchId);
                    const totalQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
                    return {
                      IDPedido: o.id.toUpperCase(),
                      FilialDestino: branch?.name || 'N/A',
                      Cidade: branch?.location || 'N/A',
                      TotalPecas: totalQty,
                      VariedadeItens: o.items.length,
                      DataAprovacao: o.createdAt ? new Date(o.createdAt).toLocaleDateString('pt-BR') : 'N/A',
                      Status: o.status === 'picking' ? 'Em Separação' : o.status === 'approved' ? 'Aguardando Início' : o.status === 'picked' ? 'Separado' : o.status === 'rejected' ? 'Cancelado' : o.status
                    };
                  })}
                  defaultFilename="fila_separacao_picking"
                  sheetName="Picking"
                  columns={[
                    { key: 'IDPedido', label: 'ID Pedido' },
                    { key: 'FilialDestino', label: 'Filial Destino' },
                    { key: 'Cidade', label: 'Cidade' },
                    { key: 'TotalPecas', label: 'Total Peças' },
                    { key: 'VariedadeItens', label: 'Total Itens' },
                    { key: 'DataAprovacao', label: 'Data Aprovação' },
                    { key: 'Status', label: 'Status' },
                  ]}
                />
              </div>

              {/* BARRA DE FILTROS: STATUS, FILIAL E PERÍODO */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-3 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Filtro de Status */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Filter size={11} /> Status da Separação
                    </Label>
                    <select
                      value={pickingStatusFilter}
                      onChange={(e) => setPickingStatusFilter(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-md h-8.5 text-slate-200 text-xs px-2.5 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all cursor-pointer font-medium"
                    >
                      <option value="active">Em Fila Ativa (Aprovados + Em Separação)</option>
                      <option value="approved">Aguardando Início (Aprovados)</option>
                      <option value="picking">Em Separação (Conferência em Andamento)</option>
                      <option value="picked">Já Separados (Concluídos)</option>
                      <option value="pending">Devolvidos p/ Aprovação (Pendente)</option>
                      <option value="rejected">Cancelados / Rejeitados Diretamente</option>
                      <option value="all">Ver Todos os Status</option>
                    </select>
                  </div>

                  {/* Filtro de Filial */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Box size={11} /> Filial Destino
                    </Label>
                    <select
                      value={pickingBranchFilter}
                      onChange={(e) => setPickingBranchFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-md h-8.5 text-slate-200 text-xs px-2.5 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all cursor-pointer font-medium"
                    >
                      <option value="all">Todas as Filiais ({branches.length})</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.code ? `[${b.code}] ` : ''}{b.name} - {b.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Data Inicial (De) */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={11} /> Período Inicial (De)
                    </Label>
                    <Input
                      type="date"
                      value={pickingStartDateFilter}
                      onChange={(e) => {
                        setPickingStartDateFilter(e.target.value);
                        setPickingDatePreset('custom');
                      }}
                      className="bg-slate-900 border-slate-800 text-slate-200 h-8.5 text-xs"
                    />
                  </div>

                  {/* Filtro Data Final (Até) */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={11} /> Período Final (Até)
                    </Label>
                    <Input
                      type="date"
                      value={pickingEndDateFilter}
                      onChange={(e) => {
                        setPickingEndDateFilter(e.target.value);
                        setPickingDatePreset('custom');
                      }}
                      className="bg-slate-900 border-slate-800 text-slate-200 h-8.5 text-xs"
                    />
                  </div>
                </div>

                {/* Atalhos rápidos de data e limpar filtros */}
                <div className="pt-2 border-t border-slate-850/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mr-1">Atalhos:</span>
                    {[
                      { id: 'today', label: 'Hoje' },
                      { id: 'yesterday', label: 'Ontem' },
                      { id: '7days', label: '7 Dias' },
                      { id: '30days', label: '30 Dias' },
                      { id: 'thisMonth', label: 'Este Mês' },
                      { id: 'all', label: 'Todo Período' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPickingDatePreset(p.id)}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-all ${
                          pickingDatePreset === p.id 
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-extrabold' 
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {(pickingStatusFilter !== 'active' || pickingStartDateFilter || pickingEndDateFilter || pickingBranchFilter !== 'all' || effectiveSearch) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearPickingFilters}
                      className="text-slate-400 hover:text-amber-400 border border-dashed border-slate-800 hover:border-amber-500/40 h-7 px-2.5 text-[11px] font-bold"
                    >
                      <XCircle size={12} className="mr-1 text-amber-500" /> Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedPickingOrderIds.length > 0 && (
                <div className="bg-amber-950/40 border-b border-amber-800/50 p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 text-xs">
                      {selectedPickingOrderIds.length} selecionado(s)
                    </Badge>
                    <span className="text-xs font-semibold text-amber-200">
                      Ações em lote para separações
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={handleBatchPrintPickingPDF}
                      variant="outline"
                      className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-800/60 font-bold h-8 px-3 text-xs"
                      title="Imprimir Folha de Separação Manual em Lote com Checkpoints"
                    >
                      <Printer size={14} className="mr-1.5 text-amber-400" />
                      Imprimir Separação ({selectedPickingOrderIds.length})
                    </Button>

                    <Button
                      onClick={() => handleBatchCancelPicking(false)}
                      variant="outline"
                      className="bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700 font-bold h-8 px-3 text-xs"
                      title="Resetar separação dos pedidos selecionados e retornar para Aguardando Início (Aprovado)"
                    >
                      <RotateCcw size={14} className="mr-1.5 text-amber-400" />
                      Resetar Separação ({selectedPickingOrderIds.length})
                    </Button>

                    {/* BOTÃO CANCELAR SEPARAÇÕES DIRETAMENTE EM LOTE */}
                    <Button
                      onClick={() => setCancelDirectBatchPromptOpen(true)}
                      variant="outline"
                      className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700/80 font-bold h-8 px-3 text-xs shadow-sm hover:shadow-rose-900/40"
                      title="Cancelar definitivamente as separações selecionadas liberando o estoque, sem devolver para a aprovação"
                    >
                      <Ban size={14} className="mr-1.5 text-rose-300" />
                      Cancelar Diretamente ({selectedPickingOrderIds.length})
                    </Button>

                    <Button
                      onClick={() => handleBatchCancelPicking(true)}
                      variant="outline"
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border-slate-800 font-bold h-8 px-3 text-xs"
                      title="Devolver pedidos selecionados para a fila de aprovação administrativa (Pendente)"
                    >
                      <XCircle size={14} className="mr-1.5 text-rose-400" />
                      Devolver p/ Aprovação ({selectedPickingOrderIds.length})
                    </Button>

                    <Button
                      onClick={handleBatchConfirmPicking}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-3 text-xs border-none"
                      title="Confirmar separação de todos os pedidos selecionados"
                    >
                      <CheckCircle2 size={14} className="mr-1.5" />
                      Confirmar Separações ({selectedPickingOrderIds.length})
                    </Button>

                    <Button
                      onClick={() => setSelectedPickingOrderIds([])}
                      variant="ghost"
                      className="text-slate-400 hover:text-white h-8 px-2 text-xs"
                    >
                      <X size={14} className="mr-1" /> Desmarcar
                    </Button>
                  </div>
                </div>
              )}

              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-800 hover:bg-transparent">
                      <TableHead className="w-12 pl-6">
                        <input
                          type="checkbox"
                          checked={
                            paginatedPickingOrders.length > 0 &&
                            paginatedPickingOrders.every(o => selectedPickingOrderIds.includes(o.id))
                          }
                          onChange={handleToggleSelectAllPicking}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                          title="Selecionar todos os pedidos desta página"
                        />
                      </TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">ID do Pedido</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Filial Destino</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cidade</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">Itens</TableHead>
                      <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest pr-6">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPickingOrders.map(order => {
                      const branch = findBranch(order.branchId);
                      const safeItems = Array.isArray(order.items) ? order.items : [];
                      const totalQty = safeItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
                      const isSelected = selectedPickingOrderIds.includes(order.id);
                      const isDistribution = order.orderType === 'distribution' || (order.notes && order.notes.toLowerCase().includes('distribuição'));
                      const isEpi = order.orderType === 'epi' || (order.notes && order.notes.toLowerCase().includes('epi'));

                      return (
                        <TableRow 
                          key={order.id} 
                          className={`group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                            isSelected ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <TableCell className="pl-6 w-12 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectPicking(order.id)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                            />
                          </TableCell>
                          <TableCell className="font-mono font-bold text-cyan-400">#{order.id.toUpperCase()}</TableCell>
                          <TableCell className="py-2.5 px-3">
                            <div className="flex flex-col gap-1">
                              <div className="font-bold text-slate-200 text-xs break-words flex items-center gap-1.5 flex-wrap">
                                <span>{branch.name}</span>
                                {isDistribution && (
                                  <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] px-1.5 py-0 font-bold whitespace-nowrap">
                                    📦 Distribuição
                                  </Badge>
                                )}
                                {isEpi && (
                                  <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0 font-bold whitespace-nowrap">
                                    🛡️ EPI
                                  </Badge>
                                )}
                              </div>
                              {safeItems.length > 0 && (
                                <div className="text-[11px] text-slate-400 line-clamp-1 truncate max-w-[280px]" title={safeItems.map(it => `${findProduct(it.productId).name} (${it.quantity} un)`).join(', ')}>
                                  {safeItems.map(it => `${findProduct(it.productId).name} (${it.quantity})`).join(', ')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            <div className="text-slate-400 text-xs font-semibold break-words">{branch.location}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            {order.status === 'picking' ? (
                              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">Em Separação</Badge>
                            ) : order.status === 'approved' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">Aprovado</Badge>
                            ) : order.status === 'picked' ? (
                              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">Separado</Badge>
                            ) : order.status === 'rejected' ? (
                              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">Cancelado</Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-300">
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-200">{totalQty} {totalQty === 1 ? 'UN' : 'UNs'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({safeItems.length} {safeItems.length === 1 ? 'item' : 'itens'})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 py-4">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                              {/* Separação Automática / Digital */}
                              {(order.status === 'approved' || order.status === 'picking') && (
                                <Button 
                                  onClick={() => {
                                    if (order.status === 'approved') {
                                      updateBranchOrderStatus(order.id, 'picking');
                                    }
                                    setPickedQuantities({});
                                    setSelectedPickingOrder(order);
                                  }}
                                  className="bg-amber-500 hover:bg-amber-400 text-white font-bold h-8.5 px-3 rounded-md shadow-md shadow-amber-500/10 border-none transition-all text-xs"
                                  title="Iniciar separação automática pelo sistema com checklist digital"
                                >
                                  <ClipboardList size={13} className="mr-1.5" /> Iniciar
                                </Button>
                              )}

                              {/* Separação Manual (PDF) */}
                              <Button 
                                onClick={() => handleManualPickingPDF(order)}
                                variant="outline"
                                className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700 font-bold h-8.5 px-2.5 rounded-md transition-all text-xs"
                                title="Emitir PDF do pedido para separação física manual"
                              >
                                <Printer size={13} className="mr-1" /> PDF
                              </Button>

                              {/* Confirmar Separação direta (Manual) */}
                              {order.status === 'picking' && (
                                <Button 
                                  onClick={() => {
                                    updateBranchOrderStatus(order.id, 'picked');
                                    toast.success(`Separação do Pedido #${order.id.toUpperCase()} confirmada com sucesso!`);
                                    setLabelOrderPrompt(order);
                                    setLabelCount(1);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8.5 px-3 rounded-md shadow-md shadow-emerald-500/10 border-none transition-all text-xs"
                                  title="Confirmar que a separação física foi concluída"
                                >
                                  <CheckCircle2 size={13} className="mr-1.5" /> Confirmar
                                </Button>
                              )}

                              {/* Resetar Separação / Voltar para Aguardando Início */}
                              {order.status === 'picking' && (
                                <Button 
                                  onClick={() => handleCancelSinglePicking(order, false)}
                                  variant="outline"
                                  className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60 font-bold h-8.5 px-2.5 rounded-md transition-all text-xs"
                                  title="Resetar separação em andamento e retornar para Aguardando Início (Aprovado)"
                                >
                                  <RotateCcw size={13} className="mr-1 text-amber-400" /> Resetar
                                </Button>
                              )}

                              {/* BOTÃO CANCELAR SEPARAÇÃO DIRETAMENTE (SEM DEVOLVER PARA APROVAÇÃO) */}
                              {(order.status === 'approved' || order.status === 'picking') && (
                                <Button 
                                  onClick={() => {
                                    setCancelDirectOrderPrompt(order);
                                    setDirectCancelReason('');
                                  }}
                                  variant="outline"
                                  className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700/80 font-bold h-8.5 px-2.5 rounded-md transition-all text-xs shadow-sm hover:shadow-rose-900/40"
                                  title="Cancelar separação e encerrar o pedido diretamente liberando o estoque, sem devolver para a fila de aprovação"
                                >
                                  <Ban size={13} className="mr-1.5 text-rose-300" /> Cancelar Diretamente
                                </Button>
                              )}

                              {/* Devolver para Aprovação Administrativa */}
                              {(order.status === 'approved' || order.status === 'picking') && (
                                <Button 
                                  onClick={() => handleCancelSinglePicking(order, true)}
                                  variant="outline"
                                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border-slate-800 font-medium h-8.5 px-2 rounded-md transition-all text-xs"
                                  title="Cancelar e devolver pedido para a fila de aprovação administrativa (Pendente)"
                                >
                                  <XCircle size={13} className="mr-1" /> Devolver p/ Aprovação
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {pickingCitiesOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                          {effectiveSearch || pickingStatusFilter !== 'active' || pickingStartDateFilter || pickingEndDateFilter || pickingBranchFilter !== 'all' ? (
                            <div className="flex flex-col items-center gap-3">
                              <Search size={40} className="text-amber-500/60" />
                              <p className="text-base font-bold text-amber-300">Nenhum pedido encontrado para os filtros selecionados.</p>
                              <p className="text-xs text-slate-400 max-w-md">
                                {effectiveSearch ? `Termo de busca: "${effectiveSearch}". ` : ''}
                                Verifique as datas selecionadas, filial ou status selecionado.
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleClearPickingFilters}
                                className="bg-slate-900 border-amber-500/30 text-amber-300 hover:bg-slate-800 text-xs font-bold mt-1"
                              >
                                <RotateCcw size={13} className="mr-1.5" /> Limpar Filtros e Ver Ativos
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4">
                              <Box size={48} className="text-slate-700" />
                              <p className="text-lg font-medium text-slate-300">Nenhuma separação pendente no momento.</p>
                              <p className="text-sm text-slate-500">Novos pedidos aparecem aqui imediatamente após serem aprovados no Administrativo.</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={currentPickingPage}
                totalPages={Math.ceil(pickingCitiesOrders.length / 15)}
                onPageChange={setCurrentPickingPage}
                totalItems={pickingCitiesOrders.length}
                itemsPerPage={15}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loading">
          <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                <span>Carregamento & Expedição por Praça (Cidade)</span>
                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">{Object.keys(loadingOrdersByCity).length} Cidades</Badge>
              </CardTitle>
              <p className="text-sm text-slate-400 font-medium">Inicie o carregamento e despache as mercadorias agrupadas por rota e cidade destinatária.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {(Object.entries(loadingOrdersByCity) as [string, any[]][]).map(([city, cityOrders]) => {
                const ordersToLoad = cityOrders.filter((o: any) => o.status === 'picked' || o.status === 'invoiced');
                const ordersInLoading = cityOrders.filter((o: any) => o.status === 'loading');
                const hasOrdersToLoad = ordersToLoad.length > 0;
                const totalItems = cityOrders.reduce((sum: number, o: any) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);
                const totalOrders = cityOrders.length;
                
                return (
                  <div key={city} className="bg-slate-950/40 rounded-xl border border-slate-800 p-6 space-y-4 hover:border-slate-700/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <Truck className="text-cyan-400 animate-pulse" size={24} />
                          <h3 className="font-extrabold text-white text-xl tracking-wide">{city.toUpperCase()}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'} • {totalItems} volumes para embarque.
                          {ordersInLoading.length > 0 && <span className="text-cyan-400 ml-2 font-bold">({ordersInLoading.length} em carregamento)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {hasOrdersToLoad && (
                          <Button
                            onClick={() => handleStartLoadingForCity(city, cityOrders)}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black h-11 px-5 rounded-lg transition-all border-none shadow-lg shadow-cyan-500/20"
                            title="Mover pedidos aguardando para Carregando no Veículo"
                          >
                            <ArrowRight size={16} className="mr-2" /> Iniciar Carregamento ({ordersToLoad.length})
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDispatchCityOrders(city, cityOrders)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white font-black h-11 px-5 rounded-lg transition-all border-none shadow-lg shadow-emerald-500/20"
                          title="Despachar pedidos desta praça em trânsito"
                        >
                          <CheckCircle2 size={16} className="mr-2" /> Despachar Carga ({ordersInLoading.length > 0 ? ordersInLoading.length : totalOrders})
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {cityOrders.map((order: any) => {
                        const branch = findBranch(order.branchId);
                        const isCurrentlyLoading = order.status === 'loading';
                        return (
                          <div key={order.id} className="bg-slate-900/40 rounded-lg p-4 border border-slate-800/80 flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">ID do Pedido</span>
                                <span className="font-mono font-bold text-cyan-400">#{order.id.toUpperCase()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Filial Destinatária</span>
                                <span className="font-bold text-slate-200 text-sm">{branch?.name}</span>
                              </div>
                            </div>

                            <div className="bg-slate-950/30 p-2.5 text-xs rounded border border-slate-850/40 divide-y divide-slate-850/20">
                              {order.items.map((item: any, sIdx: number) => {
                                const p = products.find(prod => prod.id === item.productId);
                                return (
                                  <div key={sIdx} className="flex justify-between py-1.5 first:pt-0 last:pb-0 font-medium">
                                    <span className="text-slate-400 break-words pr-2">{p?.name}</span>
                                    <span className="text-white font-bold">{item.quantity} {p?.unit || 'un'}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Situação</span>
                                {isCurrentlyLoading ? (
                                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold animate-pulse">Carregando no Veículo...</Badge>
                                ) : (
                                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">Aguardando Carregamento</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintRomaneioPDF(order)}
                                  className="bg-slate-950 hover:bg-slate-900 text-cyan-400 border-slate-800 text-[11px] font-bold h-8 px-2"
                                  title="Imprimir Romaneio / PDF do Pedido"
                                >
                                  <FileText size={12} className="mr-1" /> Romaneio PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setLabelOrderPrompt(order);
                                    setLabelCount(1);
                                  }}
                                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 text-[11px] font-bold h-8 px-2"
                                  title="Imprimir Etiqueta de Identificação de Caixa (A4)"
                                >
                                  <Printer size={12} className="mr-1" /> Etiqueta Caixa
                                </Button>
                              </div>

                              {/* Individual Order Loading Actions */}
                              <div className="flex items-center gap-2 pt-1">
                                {!isCurrentlyLoading ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        updateBranchOrderStatus(order.id, 'loading');
                                        toast.info(`Pedido #${order.id.toUpperCase()} agora está em Carregamento.`);
                                      }}
                                      className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-bold h-8"
                                    >
                                      <ArrowRight size={12} className="mr-1" /> Iniciar Carregamento
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        updateBranchOrderStatus(order.id, 'shipped');
                                        toast.success(`Pedido #${order.id.toUpperCase()} despachado!`);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8 px-3"
                                      title="Despachar direto para trânsito"
                                    >
                                      <CheckCircle2 size={12} className="mr-1" /> Despachar
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        updateBranchOrderStatus(order.id, 'shipped');
                                        toast.success(`Pedido #${order.id.toUpperCase()} despachado com sucesso!`);
                                      }}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8"
                                    >
                                      <CheckCircle2 size={12} className="mr-1" /> Despachar Carga
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        updateBranchOrderStatus(order.id, 'picked');
                                        toast.info(`Carregamento desfeito para o Pedido #${order.id.toUpperCase()}.`);
                                      }}
                                      className="text-slate-400 hover:text-slate-200 text-xs h-8 px-2"
                                      title="Desfazer carregamento"
                                    >
                                      Desfazer
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {Object.keys(loadingOrdersByCity).length === 0 && (
                <EmptyState message="Nenhum pedido aguardando carregamento ou faturamento." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ready" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <span>Histórico de Pedidos Enviados</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {finishedOrders.length} Enviado(s)
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-400 font-medium">
                  Relação completa em lista dos pedidos despachados, faturados ou entregues para as filiais.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ExportExcelModal
                  title="Exportar Lista de Pedidos Enviados"
                  description="Exporte o histórico completo de pedidos enviados em planilha Excel."
                  data={finishedOrders.map(o => {
                    const branch = findBranch(o.branchId);
                    const totalQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
                    return {
                      IDPedido: o.id.toUpperCase(),
                      Filial: branch?.name || o.branchId,
                      Cidade: branch?.location || '',
                      DataEmissao: new Date(o.createdAt).toLocaleDateString('pt-BR'),
                      QtdItens: o.items.length,
                      TotalPecas: totalQty,
                      ValorTotal: o.totalValue || 0,
                      Status: o.status === 'delivered' ? 'Entregue' : 'Em Trânsito / Despachado',
                      AprovadoPor: o.approvedBy || 'Admin'
                    };
                  })}
                  defaultFilename="pedidos_enviados_logistica.xlsx"
                />

                {/* Switch visualizacao: Lista (padrao) vs Grade */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={readyViewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setReadyViewMode('list')}
                    className={`h-8 px-3 text-xs font-bold ${
                      readyViewMode === 'list'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <List size={14} className="mr-1.5" /> Lista
                  </Button>
                  <Button
                    size="sm"
                    variant={readyViewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setReadyViewMode('grid')}
                    className={`h-8 px-3 text-xs font-bold ${
                      readyViewMode === 'grid'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <LayoutGrid size={14} className="mr-1.5" /> Grade
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 sm:p-6">
              {finishedOrders.length === 0 ? (
                <div className="p-6">
                  <EmptyState message="Nenhum pedido enviado recentemente." />
                </div>
              ) : readyViewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/80">
                      <TableRow className="border-slate-800">
                        <TableHead className="font-bold text-slate-300">CÓD. PEDIDO</TableHead>
                        <TableHead className="font-bold text-slate-300">FILIAL / DESTINO</TableHead>
                        <TableHead className="font-bold text-slate-300">DATA</TableHead>
                        <TableHead className="font-bold text-slate-300 text-center">ITENS / VOL</TableHead>
                        <TableHead className="font-bold text-slate-300 text-right">VALOR TOTAL</TableHead>
                        <TableHead className="font-bold text-slate-300 text-center">SITUAÇÃO</TableHead>
                        <TableHead className="font-bold text-slate-300 text-right">DOCUMENTOS & ETIQUETAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFinishedOrders.map((order) => {
                        const branch = findBranch(order.branchId);
                        const totalPecas = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
                        return (
                          <TableRow key={order.id} className="border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                            <TableCell className="font-black text-cyan-400">
                              #{order.id.toUpperCase()}
                            </TableCell>
                            <TableCell className="py-2.5 px-3">
                              <div className="font-bold text-white text-xs break-words">{branch?.name || order.branchId}</div>
                              <div className="text-xs text-slate-400 break-words">{branch?.location || 'Filial Lojas Ramos'}</div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-300 font-medium whitespace-nowrap">
                              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 font-bold">
                                {order.items.length} prod / {totalPecas} un.
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-black text-emerald-400 whitespace-nowrap">
                              R$ {(order.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              {order.status === 'delivered' ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                  Entregue na Filial
                                </Badge>
                              ) : (
                                <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                                  Despachado / Em Trânsito
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintRomaneioPDF(order)}
                                  className="bg-slate-950 hover:bg-slate-900 text-cyan-400 border-slate-800 text-xs font-bold h-8 px-2.5"
                                  title="Imprimir Romaneio em PDF"
                                >
                                  <FileText size={13} className="mr-1" /> Romaneio PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setLabelOrderPrompt(order);
                                    setLabelCount(1);
                                  }}
                                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold h-8 px-2.5"
                                  title="Imprimir Etiqueta de Identificação de Caixa (A4)"
                                >
                                  <Printer size={13} className="mr-1" /> Etiqueta Caixa
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {paginatedFinishedOrders.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      icon={<CheckCircle2 className={order.status === 'delivered' ? "text-emerald-500" : "text-orange-500"} />}
                      onPrintPDF={() => handlePrintRomaneioPDF(order)}
                      onPrintLabel={() => {
                        setLabelOrderPrompt(order);
                        setLabelCount(1);
                      }}
                    />
                  ))}
                </div>
              )}
              <Pagination
                currentPage={currentReadyPage}
                totalPages={Math.ceil(finishedOrders.length / 15)}
                onPageChange={setCurrentReadyPage}
                totalItems={finishedOrders.length}
                itemsPerPage={15}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counts">
          <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <ClipboardList size={22} className="text-cyan-400" />
                  <span>Contagens de Inventário Pendentes</span>
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                    {pendingCounts.length} Pendente(s)
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  Verificações de estoque solicitadas pela equipe administrativa para conferência física no Almoxarifado / CD.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleDownloadManualCountPDF}
                  disabled={pendingCounts.length === 0}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-10 px-4 rounded-lg shadow-lg shadow-cyan-500/20 border-none flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Baixar folha oficial para contagem física manual em PDF com checkpoints e campos para anotação a caneta"
                >
                  <FileDown size={16} />
                  <span>Baixar PDF Contagem Manual ({pendingCounts.length})</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingCounts.length === 0}
                  onClick={() => {
                    cancelAllPendingInventoryCounts();
                    toast.info('Todas as contagens pendentes foram canceladas com sucesso.');
                  }}
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold text-xs h-10 px-3.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Cancelar todas as solicitações de contagem pendentes"
                >
                  <XCircle size={15} />
                  <span>Cancelar Todas</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-6">Produto / Descrição</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Código</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Solicitado em</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">Estoque Sistema</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center w-48">Qtd Contada (Física)</TableHead>
                      <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPendingCounts.map(count => {
                      const product = findProduct(count.productId);
                      return (
                        <TableRow key={count.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <TableCell className="pl-6 py-3">
                            <span className="font-bold text-slate-200 text-xs">{product?.name}</span>
                            <span className="text-[11px] text-slate-500 block">{product?.category}</span>
                          </TableCell>
                          <TableCell className="font-mono text-cyan-400 font-bold text-xs">
                            #{product?.code || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 font-medium">
                            {new Date(count.requestedAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-slate-700 bg-slate-950 text-slate-300 font-bold text-xs">
                              {count.warehouseQuantityAtRequest} {product?.unit || 'un'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="h-9 w-28 bg-slate-950 border-slate-700 text-center font-bold text-white text-xs rounded-lg focus:border-cyan-500"
                                id={`count-input-${count.id}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm"
                                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold h-9 px-4 rounded-lg shadow-md transition-all text-xs"
                                onClick={() => {
                                  const input = document.getElementById(`count-input-${count.id}`) as HTMLInputElement;
                                  if (input && input.value !== '') {
                                    completeInventoryCount(count.id, Number(input.value));
                                    toast.success(`Contagem de "${product?.name}" finalizada com sucesso!`);
                                  } else {
                                    toast.error('Informe a quantidade contada no estoque.');
                                  }
                                }}
                              >
                                <CheckCircle2 size={14} className="mr-1.5" /> Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold h-9 px-3 rounded-lg text-xs flex items-center gap-1 transition-all"
                                onClick={() => {
                                  cancelInventoryCount(count.id);
                                  toast.info(`Contagem de "${product?.name}" cancelada com sucesso.`);
                                }}
                                title="Cancelar esta solicitação de contagem"
                              >
                                <XCircle size={14} /> Cancelar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {pendingCounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16 text-slate-500 font-medium">
                          <div className="flex flex-col items-center gap-3">
                            <ClipboardList size={40} className="text-slate-700" />
                            <p className="text-base text-slate-300 font-bold">Nenhuma solicitação de contagem pendente no momento.</p>
                            <p className="text-xs text-slate-500">As solicitações emitidas pelo setor administrativo aparecerão aqui para conferência física.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={currentCountsPage}
                totalPages={Math.ceil(pendingCounts.length / 15)}
                onPageChange={setCurrentCountsPage}
                totalItems={pendingCounts.length}
                itemsPerPage={15}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming">
          <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <CardTitle className="text-2xl font-bold text-white">Recebimento de Compras (Aguardando)</CardTitle>
              <p className="text-sm text-slate-400 font-medium tracking-wide">Confira os itens que chegaram dos fornecedores.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Pedido</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Fornecedor</TableHead>
                      <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Itens</TableHead>
                      <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedIncomingPurchases.map(order => {
                      const supplier = suppliers.find(s => s.id === order.supplierId);
                      return (
                        <TableRow key={order.id} className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <TableCell className="font-mono font-bold text-cyan-500 text-xs whitespace-nowrap py-2.5 px-3">#{order.id.toUpperCase()}</TableCell>
                          <TableCell className="py-2.5 px-3">
                            <div className="font-bold text-slate-200 text-xs break-words">{supplier?.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1.5">
                              {order.items.map((item, idx) => {
                                const product = products.find(p => p.id === item.productId);
                                return (
                                  <div key={idx} className="text-slate-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                                    {product?.name}: <span className="font-bold text-slate-200">{item.quantity} {product?.unit}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-400 text-white h-9 px-4 rounded-md font-bold shadow-lg shadow-amber-500/20 border-none"
                              onClick={() => {
                                setSelectedPurchaseOrder(order);
                                // Prepopulate received quantities with the expected quantities as default
                                const initialReceived: Record<string, string> = {};
                                order.items.forEach((item: any) => {
                                  initialReceived[item.productId] = String(item.quantity);
                                });
                                setReceivedQuantities(initialReceived);
                              }}
                            >
                              <ClipboardList size={16} className="mr-2" /> Iniciar Conferência
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {incomingPurchases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-slate-500">
                          <div className="flex flex-col items-center gap-4">
                            <Package size={48} className="text-slate-800" />
                            <p className="text-lg font-medium">Nenhum recebimento pendente no momento.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={currentIncomingPage}
                totalPages={Math.ceil(incomingPurchases.length / 15)}
                onPageChange={setCurrentIncomingPage}
                totalItems={incomingPurchases.length}
                itemsPerPage={15}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPickingOrder} onOpenChange={(open) => !open && setSelectedPickingOrder(null)}>
        <DialogContent className="w-full h-full sm:h-[90vh] max-h-screen sm:max-h-[90vh] sm:max-w-[95vw] md:max-w-4xl bg-slate-950 border-slate-800 text-white flex flex-col p-0 rounded-none sm:rounded-xl overflow-hidden shadow-2xl">
          {selectedPickingOrder && (() => {
            const currentOrderAndState = branchOrders.find(o => o.id === selectedPickingOrder.id) || selectedPickingOrder;
            const branch = findBranch(currentOrderAndState.branchId);
            const isCollectorModeActive = viewMode === 'collector' || (viewMode === 'auto' && isMobileDevice);

            return (
              <>
                <DialogHeader className="p-4 sm:p-6 border-b border-slate-800/80 bg-slate-900/50">
                  <div className="flex flex-col gap-4">
                    {/* Header Top: Title + Mode Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PROCESSO DE SEPARAÇÃO ATIVO</span>
                          {isCollectorModeActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] py-0 px-2 flex items-center gap-1 animate-pulse">
                              <Smartphone size={10} /> MODO COLETOR ATIVO
                            </Badge>
                          ) : (
                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[9px] py-0 px-2 flex items-center gap-1">
                              <Monitor size={10} /> MODO COMPUTADOR
                            </Badge>
                          )}
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                          <Package className="text-amber-500 animate-pulse" size={20} /> Pedido #{currentOrderAndState.id.toUpperCase()}
                        </DialogTitle>
                      </div>

                      {/* Header Right: Device View Mode Manual Toggle */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800/60 self-start sm:self-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewMode('desktop')}
                          className={`text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-md font-bold transition-all border-none ${
                            viewMode === 'desktop'
                              ? 'bg-slate-800 text-cyan-400 shadow'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          <Monitor size={12} className="mr-1" /> Desktop
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewMode('collector')}
                          className={`text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-md font-bold transition-all border-none ${
                            viewMode === 'collector'
                              ? 'bg-slate-800 text-emerald-400 shadow'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          <Smartphone size={12} className="mr-1" /> Coletor / Celular
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewMode('auto')}
                          className={`text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-md font-bold transition-all border-none ${
                            viewMode === 'auto'
                              ? 'bg-slate-800/50 text-amber-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          Auto
                        </Button>
                      </div>
                    </div>

                    {/* Header bottom: branch info */}
                    <div className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-900/60 text-xs text-slate-350">
                      <div>
                        <span className="font-semibold text-slate-500 uppercase mr-1.5">Filial:</span>
                        <strong className="text-white font-bold">{branch?.name}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 uppercase mr-1.5">Cidade:</span>
                        <strong className="text-cyan-400 font-bold">{branch?.location}</strong>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                  {/* Instructions banner with express pick option & PDF manual pick option */}
                  <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 text-sm text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-amber-500/10 text-amber-500 flex-shrink-0">
                        <Clock size={18} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">Digite a quantidade separada em cada linha ou alterne para a separação física manual emitindo o PDF do pedido.</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-stretch md:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualPickingPDF(currentOrderAndState, false)}
                        className="bg-slate-950 hover:bg-slate-900 text-cyan-400 border-slate-800 font-extrabold text-xs whitespace-nowrap h-9"
                        title="Emitir PDF do pedido para separação física manual"
                      >
                        <Printer size={14} className="mr-1.5" /> PDF Separação
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const allPicked: Record<string, string> = {};
                          currentOrderAndState.items.forEach((item: any) => {
                            allPicked[item.productId] = String(item.quantity);
                          });
                          setPickedQuantities(allPicked);
                          toast.success("Todos os itens marcados como separados!");
                        }}
                        className="bg-slate-950 hover:bg-slate-900 text-emerald-400 border-slate-800 font-extrabold text-xs whitespace-nowrap h-9"
                      >
                        <ClipboardList size={14} className="mr-1.5" /> Separar Tudo
                      </Button>
                    </div>
                  </div>

                  {isCollectorModeActive ? (
                    /* 📱 MOBILE / RUN-TIME COLETOR OPTIMIZED VIEW */
                    <div className="space-y-4">
                      {currentOrderAndState.items.map((item: any, idx: number) => {
                        const product = findProduct(item.productId);
                        const pickedQtyVal = pickedQuantities[item.productId] ?? '';
                        const parsedQty = Number(pickedQtyVal);
                        const isFilled = pickedQtyVal !== '' && parsedQty > 0;
                        const isFullyPicked = isFilled && parsedQty === item.quantity;
                        const isDiscrepancy = isFilled && parsedQty !== item.quantity;

                        return (
                          <div 
                            key={idx} 
                            className={`rounded-xl border transition-all p-4 flex flex-col gap-3.5 ${
                              isFullyPicked 
                                ? 'bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                                : isDiscrepancy 
                                  ? 'bg-amber-950/20 border-amber-500/80' 
                                  : 'bg-slate-900/60 border-slate-850/80'
                            }`}
                          >
                            {/* Card Header: Photo + SKU + Name */}
                            <div className="flex items-start gap-3">
                              <div className="w-14 h-14 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {product?.image ? (
                                  <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package className="text-slate-600" size={24} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`font-mono text-[10px] font-black block tracking-wider ${isFullyPicked ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  CÓD: {product?.code}
                                </span>
                                <h4 className={`text-sm sm:text-base font-extrabold leading-tight ${isFullyPicked ? 'text-emerald-200' : 'text-slate-100'}`}>
                                  {product?.name}
                                </h4>
                                <span className="text-xs font-semibold text-slate-400 mt-1 block">
                                  Unidade: <strong className="text-slate-200 uppercase">{product?.unit || 'UN'}</strong>
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {isFullyPicked ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-black text-[9px] px-2 py-0.5">✔ SEPARADO</Badge>
                                ) : isDiscrepancy ? (
                                  <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/35 font-black text-[9px] px-2 py-0.5">⚠ DIFERENÇA</Badge>
                                ) : (
                                  <Badge className="bg-slate-800 text-slate-400 border border-slate-700 font-extrabold text-[9px] px-2 py-0.5">PENDENTE</Badge>
                                )}
                              </div>
                            </div>

                            {/* Card Body: Interactive controls */}
                            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850/80 flex items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">QTD REMESSA</span>
                                <span className="text-xl font-black text-cyan-400">
                                  {item.quantity} <span className="text-xs font-medium text-slate-500 uppercase">{product?.unit || 'un'}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-right mr-1">DIGITAR</span>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  placeholder="0"
                                  value={pickedQtyVal}
                                  onChange={(e) => {
                                    setPickedQuantities(prev => ({
                                      ...prev,
                                      [item.productId]: e.target.value
                                    }));
                                  }}
                                  className={`w-20 text-center font-black text-base border h-10 rounded-md p-1 transition-colors ${
                                    isFullyPicked 
                                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 focus:ring-emerald-500 focus:border-emerald-500' 
                                      : isDiscrepancy 
                                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 focus:ring-amber-500 focus:border-amber-500'
                                        : 'bg-slate-900 border-slate-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Card Actions: Large tactile click targets */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                  const newVal = Math.max(0, parsedQty - 1);
                                  setPickedQuantities(prev => ({
                                    ...prev,
                                    [item.productId]: newVal === 0 ? '' : String(newVal)
                                  }));
                                }}
                                className="flex-1 bg-slate-900 border-slate-800 h-11 text-slate-400 hover:text-white"
                              >
                                <Minus size={14} className="mr-1" /> -1
                              </Button>

                              <Button
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                  const newVal = parsedQty + 1;
                                  setPickedQuantities(prev => ({
                                    ...prev,
                                    [item.productId]: String(newVal)
                                  }));
                                }}
                                className="flex-1 bg-slate-900 border-slate-800 h-11 text-slate-200 hover:text-white"
                              >
                                <Plus size={14} className="mr-1" /> +1
                              </Button>

                              <Button
                                size="lg"
                                onClick={() => {
                                  setPickedQuantities(prev => ({
                                    ...prev,
                                    [item.productId]: prev[item.productId] === String(item.quantity) ? '' : String(item.quantity)
                                  }));
                                }}
                                className={`flex-1 h-11 font-black text-xs border-none ${
                                  isFullyPicked 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80'
                                }`}
                              >
                                <CheckCircle2 size={14} className="mr-1.5" /> Max ({item.quantity})
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* 💻 DESKTOP LAYOUT WITH TRADITIONAL HIGH RES GRID TABLE */
                    <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden overflow-x-auto w-full">
                      <Table>
                        <TableHeader className="bg-slate-950/40">
                          <TableRow className="border-b border-slate-800">
                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest w-16">Foto</TableHead>
                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest w-30">Código / SKU</TableHead>
                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Descrição do Produto</TableHead>
                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">Unidade</TableHead>
                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-right">Qtd Solicitada</TableHead>
                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-right pr-6">Qtd Separada</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentOrderAndState.items.map((item: any, idx: number) => {
                            const product = findProduct(item.productId);
                            const pickedQtyVal = pickedQuantities[item.productId] ?? '';
                            const isFilled = pickedQtyVal !== '' && Number(pickedQtyVal) > 0;
                            const isFullyPicked = isFilled && Number(pickedQtyVal) === item.quantity;
                            
                            return (
                              <TableRow 
                                key={idx} 
                                className={`border-b border-slate-800/40 transition-all ${
                                  isFilled 
                                    ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500 hover:bg-emerald-950/30' 
                                    : 'hover:bg-slate-800/25'
                                }`}
                              >
                                <TableCell>
                                  <div className="w-12 h-12 bg-slate-950 rounded-md border border-slate-800 overflow-hidden flex items-center justify-center">
                                    {product?.image ? (
                                      <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Package className="text-slate-600" size={18} />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className={`font-mono font-bold text-xs transition-colors py-2 px-3 ${isFilled ? 'text-emerald-400' : 'text-cyan-500'}`}>
                                  {product?.code}
                                </TableCell>
                                <TableCell className={`font-bold text-xs break-words transition-colors py-2 px-3 ${isFilled ? 'text-emerald-300' : 'text-slate-200'}`}>
                                  {product?.name}
                                </TableCell>
                                <TableCell className="text-center text-slate-400 font-semibold text-xs uppercase">
                                  {product?.unit || 'un'}
                                </TableCell>
                                <TableCell className="text-right text-lg font-black text-white pr-4">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex items-center justify-end gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={pickedQtyVal}
                                      onChange={(e) => {
                                        setPickedQuantities(prev => ({
                                          ...prev,
                                          [item.productId]: e.target.value
                                        }));
                                      }}
                                      className={`w-24 text-right font-black border h-10 rounded-md px-3 transition-colors ${
                                        isFilled 
                                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 focus:ring-emerald-500 focus:border-emerald-500 font-extrabold' 
                                          : 'bg-slate-950 border-slate-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                      }`}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setPickedQuantities(prev => ({
                                          ...prev,
                                          [item.productId]: prev[item.productId] === String(item.quantity) ? '' : String(item.quantity)
                                        }));
                                      }}
                                      className={`h-10 w-10 p-0 rounded-md transition-all ${
                                        isFullyPicked 
                                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                                      }`}
                                      title={isFullyPicked ? "Desmarcar" : "Separar total"}
                                    >
                                      <CheckCircle2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 bg-slate-900/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      variant="ghost" 
                      className="text-slate-400 hover:text-white border-none bg-transparent hover:bg-slate-800/30 font-bold text-xs"
                      onClick={() => setSelectedPickingOrder(null)}
                    >
                      Voltar depois / Pausar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60 font-bold h-10 px-3.5 rounded-lg transition-all text-xs"
                      onClick={() => {
                        handleCancelSinglePicking(currentOrderAndState, false);
                        setSelectedPickingOrder(null);
                        setPickedQuantities({});
                      }}
                      title="Cancelar conferência e retornar pedido para Aguardando Início (Aprovado)"
                    >
                      <RotateCcw size={15} className="mr-1.5 text-amber-400" /> Resetar p/ Aguardando
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-rose-950 hover:bg-rose-900 text-rose-200 border-rose-700/80 font-bold h-10 px-3.5 rounded-lg transition-all text-xs shadow-sm"
                      onClick={() => {
                        setCancelDirectOrderPrompt(currentOrderAndState);
                        setDirectCancelReason('');
                      }}
                      title="Cancelar separação e encerrar o pedido diretamente liberando o estoque, sem devolver para a aprovação"
                    >
                      <Ban size={15} className="mr-1.5 text-rose-300" /> Cancelar Diretamente
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border-slate-800 font-bold h-10 px-3.5 rounded-lg transition-all text-xs"
                      onClick={() => {
                        handleCancelSinglePicking(currentOrderAndState, true);
                        setSelectedPickingOrder(null);
                        setPickedQuantities({});
                      }}
                      title="Devolver pedido para a fila de aprovação administrativa (Pendente)"
                    >
                      <XCircle size={15} className="mr-1.5 text-rose-400" /> Devolver p/ Aprovação
                    </Button>
                  </div>
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-black h-12 px-6 sm:px-8 rounded-lg shadow-lg shadow-emerald-500/20 border-none transition-all"
                    onClick={() => {
                      updateBranchOrderStatus(currentOrderAndState.id, 'picked');
                      toast.success(`Pedido #${currentOrderAndState.id.toUpperCase()} separado com sucesso! Aguarda faturamento.`);
                      const targetOrder = currentOrderAndState;
                      setSelectedPickingOrder(null);
                      setLabelOrderPrompt(targetOrder);
                      setLabelCount(1);
                    }}
                  >
                    <CheckCircle2 size={18} className="mr-2" /> Finalizar Separação
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPurchaseOrder} onOpenChange={(open) => !open && setSelectedPurchaseOrder(null)}>
        <DialogContent className="w-full h-full sm:h-[90vh] max-h-screen sm:max-h-[90vh] sm:max-w-[95vw] md:max-w-4xl bg-slate-950 border-slate-800 text-white flex flex-col p-0 rounded-none sm:rounded-xl overflow-hidden shadow-2xl">
          {selectedPurchaseOrder && (() => {
            const currentOrder = purchaseOrders.find(o => o.id === selectedPurchaseOrder.id) || selectedPurchaseOrder;
            const supplier = suppliers.find(s => s.id === currentOrder.supplierId);
            const isCollectorModeActive = viewMode === 'collector' || (viewMode === 'auto' && isMobileDevice);

            return (
              <>
                <DialogHeader className="p-4 sm:p-6 border-b border-slate-800/80 bg-slate-900/50">
                  <div className="flex flex-col gap-4">
                    {/* Header Top: Title + Mode Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CONFERÊNCIA DE MERCADORIA ATIVA</span>
                          {isCollectorModeActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] py-0 px-2 flex items-center gap-1 animate-pulse">
                              <Smartphone size={10} /> MODO COLETOR ATIVO
                            </Badge>
                          ) : (
                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[9px] py-0 px-2 flex items-center gap-1">
                              <Monitor size={10} /> MODO COMPUTADOR
                            </Badge>
                          )}
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                          <Package className="text-emerald-500 animate-pulse" size={20} /> Recebimento #{currentOrder.id.toUpperCase()}
                        </DialogTitle>
                      </div>

                      {/* Header Right: Device View Mode Manual Toggle */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800/60 self-start sm:self-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewMode('desktop')}
                          className={`text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-md font-bold transition-all border-none ${
                            viewMode === 'desktop'
                              ? 'bg-slate-800 text-cyan-400 shadow'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          <Monitor size={12} className="mr-1" /> Desktop
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewMode('collector')}
                          className={`text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-md font-bold transition-all border-none ${
                            viewMode === 'collector'
                              ? 'bg-slate-800 text-emerald-400 shadow'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          <Smartphone size={12} className="mr-1" /> Coletor / Celular
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewMode('auto')}
                          className={`text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-md font-bold transition-all border-none ${
                            viewMode === 'auto'
                              ? 'bg-slate-800/50 text-amber-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          Auto
                        </Button>
                      </div>
                    </div>

                    {/* Header bottom: supplier info */}
                    <div className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-900/60 text-xs text-slate-350">
                      <div>
                        <span className="font-semibold text-slate-500 uppercase mr-1.5">Fornecedor:</span>
                        <strong className="text-white font-bold">{supplier?.name}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 uppercase mr-1.5">Total de Itens:</span>
                        <strong className="text-cyan-400 font-bold">{currentOrder.items.length}</strong>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                  {/* Instructions banner with express count option */}
                  <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 text-sm text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                        <Clock size={18} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">Confirme a quantidade recebida em cada campo para habilitar a validação do produto.</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const allReceived: Record<string, string> = {};
                        currentOrder.items.forEach((item: any) => {
                          allReceived[item.productId] = String(item.quantity);
                        });
                        setReceivedQuantities(allReceived);
                        toast.success("Todos os itens preenchidos com o total faturado!");
                      }}
                      className="bg-slate-950 hover:bg-slate-900 text-cyan-400 border-slate-800 font-extrabold text-xs whitespace-nowrap self-stretch md:self-auto h-9"
                    >
                      <ClipboardList size={14} className="mr-1.5" /> Receber Tudo
                    </Button>
                  </div>

                  {isCollectorModeActive ? (
                    /* 📱 MOBILE / RUN-TIME COLETOR OPTIMIZED VIEW */
                    <div className="space-y-4">
                      {currentOrder.items.map((item: any, idx: number) => {
                        const product = products.find(p => p.id === item.productId);
                        const receivedQtyVal = receivedQuantities[item.productId] ?? '';
                        const parsedQty = Number(receivedQtyVal);
                        const isFilled = receivedQtyVal !== '' && parsedQty > 0;
                        const isFullyReceived = isFilled && parsedQty === item.quantity;
                        const isDiscrepancy = isFilled && parsedQty !== item.quantity;

                        return (
                          <div 
                            key={idx} 
                            className={`rounded-xl border transition-all p-4 flex flex-col gap-3.5 ${
                              isFullyReceived 
                                ? 'bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                                : isDiscrepancy 
                                  ? 'bg-amber-950/20 border-amber-500/80' 
                                  : 'bg-slate-900/60 border-slate-850/80'
                            }`}
                          >
                            {/* Card Header: Photo + SKU + Name */}
                            <div className="flex items-start gap-3">
                              <div className="w-14 h-14 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {product?.image ? (
                                  <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package className="text-slate-600" size={24} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`font-mono text-[10px] font-black block tracking-wider ${isFullyReceived ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  CÓD: {product?.code}
                                </span>
                                <h4 className={`text-sm sm:text-base font-extrabold leading-tight ${isFullyReceived ? 'text-emerald-200' : 'text-slate-100'}`}>
                                  {product?.name}
                                </h4>
                                <span className="text-xs font-semibold text-slate-400 mt-1 block">
                                  Unidade: <strong className="text-slate-200 uppercase">{product?.unit || 'UN'}</strong>
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {isFullyReceived ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-black text-[9px] px-2 py-0.5">✔ OK</Badge>
                                ) : isDiscrepancy ? (
                                  <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/35 font-black text-[9px] px-2 py-0.5">⚠ DIFERENÇA</Badge>
                                ) : (
                                  <Badge className="bg-slate-800 text-slate-400 border border-slate-700 font-extrabold text-[9px] px-2 py-0.5">PENDENTE</Badge>
                                )}
                              </div>
                            </div>

                            {/* Card Body: Interactive controls */}
                            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850/80 flex items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">QTD REMESSA</span>
                                <span className="text-xl font-black text-cyan-400">
                                  {item.quantity} <span className="text-xs font-medium text-slate-500 uppercase">{product?.unit || 'un'}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-right mr-1">DIGITAR</span>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  placeholder="0"
                                  value={receivedQtyVal}
                                  onChange={(e) => {
                                    setReceivedQuantities(prev => ({
                                      ...prev,
                                      [item.productId]: e.target.value
                                    }));
                                  }}
                                  className={`w-20 text-center font-black text-base border h-10 rounded-md p-1 transition-colors ${
                                    isFullyReceived 
                                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 focus:ring-emerald-500 focus:border-emerald-500' 
                                      : isDiscrepancy
                                        ? 'bg-amber-950/50 border-amber-500 text-amber-300 focus:ring-amber-500 focus:border-amber-500'
                                        : 'bg-slate-900 border-slate-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                  }`}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setReceivedQuantities(prev => ({
                                      ...prev,
                                      [item.productId]: prev[item.productId] === String(item.quantity) ? '' : String(item.quantity)
                                    }));
                                  }}
                                  className={`h-10 w-10 p-0 rounded-md transition-all ${
                                    isFullyReceived 
                                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                  title={isFullyReceived ? "Desmarcar" : "Receber total"}
                                >
                                  <CheckCircle2 size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* 💻 DESKTOP TABLE VIEW */
                    <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-900/20 shadow-inner">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-850 bg-slate-950/40 hover:bg-transparent">
                            <TableHead className="w-16 pl-6"></TableHead>
                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest py-4">Produto</TableHead>
                            <TableHead className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">Qtd Pedida</TableHead>
                            <TableHead className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                            <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest pr-6">Qtd Recebida</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentOrder.items.map((item: any, idx: number) => {
                            const product = products.find(p => p.id === item.productId);
                            const receivedQtyVal = receivedQuantities[item.productId] ?? '';
                            const parsedQty = Number(receivedQtyVal);
                            const isFilled = receivedQtyVal !== '' && parsedQty > 0;
                            const isFullyReceived = isFilled && parsedQty === item.quantity;
                            const isDiscrepancy = isFilled && parsedQty !== item.quantity;

                            return (
                              <TableRow 
                                key={idx} 
                                className={`border-b border-slate-850 hover:bg-slate-850/10 transition-colors ${
                                  isFullyReceived ? 'bg-emerald-950/5' : isDiscrepancy ? 'bg-amber-950/5' : ''
                                }`}
                              >
                                <TableCell className="pl-6">
                                  <div className="w-10 h-10 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                                    {product?.image ? (
                                      <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Package className="text-slate-600" size={20} />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <div>
                                    <span className="font-mono text-[9px] font-extrabold text-slate-500 block uppercase tracking-wider">CÓD: {product?.code}</span>
                                    <span className="font-bold text-sm text-slate-200 block">{product?.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-bold font-mono text-cyan-400 text-base">
                                  {item.quantity} <span className="text-[10px] font-medium text-slate-500 uppercase">{product?.unit || 'un'}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {isFullyReceived ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-black text-[9px] px-2 py-0.5">✔ CONFERIDO</Badge>
                                  ) : isDiscrepancy ? (
                                    <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/35 font-black text-[9px] px-2 py-0.5">⚠ DIFERENÇA</Badge>
                                  ) : (
                                    <Badge className="bg-slate-800 text-slate-400 border border-slate-700 font-extrabold text-[9px] px-2 py-0.5">PENDENTE</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex items-center justify-end gap-2">
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      placeholder="0"
                                      value={receivedQtyVal}
                                      onChange={(e) => {
                                        setReceivedQuantities(prev => ({
                                          ...prev,
                                          [item.productId]: e.target.value
                                        }));
                                      }}
                                      className={`w-24 text-center font-black text-sm border h-10 p-1 transition-colors ${
                                        isFullyReceived 
                                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 focus:ring-emerald-500 focus:border-emerald-500' 
                                          : isDiscrepancy
                                            ? 'bg-amber-950/50 border-amber-500 text-amber-300 focus:ring-amber-500 focus:border-amber-500'
                                            : 'bg-slate-900 border-slate-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                      }`}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setReceivedQuantities(prev => ({
                                          ...prev,
                                          [item.productId]: prev[item.productId] === String(item.quantity) ? '' : String(item.quantity)
                                        }));
                                      }}
                                      className={`h-10 w-10 p-0 rounded-md transition-all ${
                                        isFullyReceived 
                                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                                      }`}
                                      title={isFullyReceived ? "Desmarcar" : "Receber total"}
                                    >
                                      <CheckCircle2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between gap-4">
                  <Button 
                    variant="ghost" 
                    className="text-slate-400 hover:text-white border-none bg-transparent hover:bg-slate-800/30 font-bold"
                    onClick={() => setSelectedPurchaseOrder(null)}
                  >
                    Voltar depois / Pausar
                  </Button>
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-black h-12 px-6 sm:px-8 rounded-lg shadow-lg shadow-emerald-500/20 border-none transition-all"
                    onClick={() => {
                      updatePurchaseOrderStatus(currentOrder.id, 'checked');
                      toast.success(`Recebimento do Pedido de Compra #${currentOrder.id.toUpperCase()} finalizado com sucesso!`);
                      setSelectedPurchaseOrder(null);
                    }}
                  >
                    <CheckCircle2 size={18} className="mr-2" /> Finalizar Recebimento
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação e emissão de Etiqueta de Identificação de Caixas */}
      <Dialog open={!!labelOrderPrompt} onOpenChange={(open) => !open && setLabelOrderPrompt(null)}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-white p-6 shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Printer className="text-amber-400" size={22} /> Imprimir Etiqueta de Identificação?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                Deseja imprimir a etiqueta de identificação em folha A4 para colar nas caixas do <span className="text-cyan-400 font-bold">Pedido #{labelOrderPrompt?.id?.toUpperCase()}</span>?
              </p>
              {labelOrderPrompt && (() => {
                const br = findBranch(labelOrderPrompt.branchId);
                let city = br?.location || br?.name || '';
                if (br?.location) {
                  const parts = br.location.split(/[-–,]/);
                  if (parts.length > 1) city = parts[parts.length - 1].trim();
                }
                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <span>Filial: <strong className="text-white">{br?.name}</strong></span>
                    <span>Cidade: <strong className="text-amber-400 uppercase font-black">{city}</strong></span>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-count-input" className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Quantidade de caixas / etiquetas a emitir (1 folha A4 por caixa):
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setLabelCount(prev => Math.max(1, prev - 1))}
                  className="h-10 w-10 bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                >
                  <Minus size={16} />
                </Button>
                <Input
                  id="label-count-input"
                  type="number"
                  min="1"
                  max="100"
                  value={labelCount}
                  onChange={(e) => setLabelCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 text-center font-black text-lg bg-slate-900 border-slate-800 text-amber-400 focus:ring-amber-500 w-28"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setLabelCount(prev => prev + 1)}
                  className="h-10 w-10 bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLabelOrderPrompt(null)}
              className="text-slate-400 hover:text-white border-none"
            >
              Não, apenas concluir
            </Button>
            <Button
              type="button"
              onClick={() => handleGenerateBoxLabels(labelOrderPrompt, labelCount)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 shadow-lg shadow-amber-500/20"
            >
              <Printer size={16} className="mr-2" /> Sim, Gerar {labelCount} Etiqueta(s) PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação: Cancelar Separação Diretamente (Pedido Individual) */}
      <Dialog open={!!cancelDirectOrderPrompt} onOpenChange={(open) => !open && setCancelDirectOrderPrompt(null)}>
        <DialogContent className="max-w-md bg-slate-950 border-rose-900/60 text-white p-6 shadow-2xl rounded-xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-1">
              <Ban size={24} />
            </div>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              Cancelar Separação Diretamente
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Esta ação encerra a separação e cancela o pedido diretamente, estornando os produtos para o estoque sem precisar devolver para a fila de aprovação.
            </DialogDescription>
          </DialogHeader>

          {cancelDirectOrderPrompt && (() => {
            const branch = findBranch(cancelDirectOrderPrompt.branchId);
            const totalItems = (cancelDirectOrderPrompt.items || []).reduce((s: number, i: any) => s + i.quantity, 0);
            return (
              <div className="space-y-4 my-2">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Pedido:</span>
                    <span className="font-mono font-bold text-cyan-400">#{cancelDirectOrderPrompt.id.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Filial Destino:</span>
                    <span className="font-bold text-slate-200">{branch?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cidade:</span>
                    <span className="text-slate-300">{branch?.location || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total de Peças:</span>
                    <span className="font-bold text-amber-300">{totalItems} UN(s) ({(cancelDirectOrderPrompt.items || []).length} itens)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status Atual:</span>
                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                      {cancelDirectOrderPrompt.status === 'picking' ? 'Em Separação' : 'Aguardando Início'}
                    </Badge>
                  </div>
                </div>

                <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-3 text-xs text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-200">
                    <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />
                    Estorno automático de estoque
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-300/90">
                    Todos os {totalItems} item(ns) reservados para este pedido serão liberados de volta ao estoque central imediatamente. O pedido ficará registrado com status Cancelado/Rejeitado.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-400">Motivo do cancelamento (opcional):</Label>
                  <Input
                    placeholder="Ex: Produto com avaria, cancelamento solicitado pela filial..."
                    value={directCancelReason}
                    onChange={(e) => setDirectCancelReason(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-xs text-slate-200 h-9"
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <Button
              variant="ghost"
              onClick={() => {
                setCancelDirectOrderPrompt(null);
                setDirectCancelReason('');
              }}
              className="text-slate-400 hover:text-white text-xs h-9"
            >
              Voltar / Fechar
            </Button>
            <Button
              onClick={handleConfirmDirectCancel}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 px-4 shadow-lg shadow-rose-600/20 border-none"
            >
              <Ban size={14} className="mr-1.5" /> Confirmar Cancelamento Direto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação: Cancelar Separações em Lote Diretamente */}
      <Dialog open={cancelDirectBatchPromptOpen} onOpenChange={setCancelDirectBatchPromptOpen}>
        <DialogContent className="max-w-md bg-slate-950 border-rose-900/60 text-white p-6 shadow-2xl rounded-xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-1">
              <Ban size={24} />
            </div>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              Cancelar {selectedPickingOrderIds.length} Separações Diretamente
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Deseja realmente cancelar em lote as separações selecionadas sem devolver para a fila de aprovação?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-3.5 text-xs text-rose-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-200">
                <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
                Estorno de estoque em lote
              </div>
              <p className="text-[11px] leading-relaxed text-rose-300/90">
                Os {selectedPickingOrderIds.length} pedidos selecionados serão alterados para o status Cancelado/Rejeitado e todas as quantidades reservadas voltarão ao estoque disponível central imediatamente.
              </p>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <Button
              variant="ghost"
              onClick={() => setCancelDirectBatchPromptOpen(false)}
              className="text-slate-400 hover:text-white text-xs h-9"
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirmBatchDirectCancel}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 px-4 shadow-lg shadow-rose-600/20 border-none"
            >
              <Ban size={14} className="mr-1.5" /> Confirmar Cancelamento em Lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({ order, onAction, actionLabel, icon, showItems = false, onPrintPDF, onPrintLabel }: any) {
  const { branches, products } = useRamoxContext();
  const cleanId = (order.branchId || '').trim().toLowerCase();
  const branch = branches.find(b => 
    b.id.toLowerCase() === cleanId || 
    toValidUUID(b.id) === toValidUUID(order.branchId) ||
    b.name.toLowerCase() === cleanId
  );

  return (
    <Card className="border-slate-800 bg-slate-900/50 shadow-xl hover:border-slate-700 transition-all group overflow-hidden flex flex-col justify-between">
      <CardHeader className="pb-4 border-b border-slate-800/50">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shadow-inner border border-slate-700/30">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg text-white font-bold">Pedido #{order.id.toUpperCase()}</CardTitle>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{branch?.name}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 px-3 py-1 rounded-lg capitalize font-bold">
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
          <span className="text-slate-500">Itens: <span className="text-cyan-400">{order.items.length}</span></span>
          <span className="text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {showItems && (
          <div className="bg-slate-800/40 rounded-lg p-4 space-y-3 border border-slate-700/30">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lista de Picking</p>
            {order.items.map((item: any, i: number) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <div key={i} className="flex justify-between items-center text-sm border-b border-slate-700/30 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-slate-900 overflow-hidden border border-slate-800">
                      {product?.image ? (
                        <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Package size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">{product?.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{product?.code}</span>
                    </div>
                  </div>
                  <span className="font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">{item.quantity} {product?.unit}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          {(onPrintPDF || onPrintLabel) && (
            <div className="grid grid-cols-2 gap-2">
              {onPrintPDF && (
                <Button 
                  onClick={onPrintPDF}
                  variant="outline"
                  className="bg-slate-950 hover:bg-slate-900 text-cyan-400 border-slate-800 text-xs font-bold h-9"
                >
                  <FileText size={14} className="mr-1.5" /> Romaneio PDF
                </Button>
              )}
              {onPrintLabel && (
                <Button 
                  onClick={onPrintLabel}
                  variant="outline"
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold h-9"
                >
                  <Printer size={14} className="mr-1.5" /> Etiqueta Caixa
                </Button>
              )}
            </div>
          )}
          {onAction && (
            <Button 
              onClick={onAction} 
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-white h-11 rounded-lg font-bold shadow-lg shadow-cyan-500/10 transition-all group-hover:scale-[1.01]"
            >
              {actionLabel} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full py-24 flex flex-col items-center justify-center bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-800 gap-4">
      <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center shadow-inner border border-slate-800">
        <Package className="text-slate-700" size={32} />
      </div>
      <p className="text-slate-500 font-medium text-lg">{message}</p>
    </div>
  );
}
