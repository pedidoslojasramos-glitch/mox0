import React, { useState, useEffect } from 'react';
import { useRamoxContext } from './services/RamoxContextComponent';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Store, 
  Users, 
  ShoppingCart, 
  LogOut,
  Menu,
  X,
  Bell,
  Settings as SettingsIcon,
  Search,
  CheckCircle2,
  ClipboardList,
  Share2,
  Clock,
  Box,
  Plus,
  History as HistoryIcon,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  FileText,
  ChevronDown,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// Modules
import AdminModule from './modules/AdminModule';
import LogisticsModule from './modules/LogisticsModule';
import BranchModule from './modules/BranchModule';
import SettingsModule from './modules/SettingsModule';
import OutboundModule from './modules/OutboundModule';
import LimitsModule from './modules/LimitsModule';
import Login from './components/Login';
import Vignette from './components/Vignette';

export default function App() {
  const { 
    currentUser, 
    logout, 
    settings, 
    globalSearch, 
    setGlobalSearch,
    branchOrders = [],
    purchaseOrders = [],
    inventoryCounts = []
  } = useRamoxContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showVignette, setShowVignette] = useState<boolean>(false);

  const [lastLoggedInUserId, setLastLoggedInUserId] = useState<string | null>(null);
  const [showLoginPendingAlert, setShowLoginPendingAlert] = useState<boolean>(false);

  // Calculate pending process statistics across the system
  const pickingCount = branchOrders.filter(o => o.status === 'approved' || o.status === 'picking').length;
  const faturamentoCount = branchOrders.filter(o => o.status === 'picked').length;
  const approvalCount = branchOrders.filter(o => o.status === 'pending' || o.status === 'discrepancy').length;
  const receivingCount = purchaseOrders.filter(o => o.status === 'approved').length;
  const contagensCount = inventoryCounts.filter(c => c.status === 'pending').length;

  // Calculate pending process statistics for the branch user
  const myOrders = currentUser ? branchOrders.filter(o => o.branchId === currentUser.branchId) : [];
  const branchPendingApprovalCount = myOrders.filter(o => o.status === 'pending').length;
  const branchShippedCount = myOrders.filter(o => o.status === 'shipped').length;

  // Define total pending based on the user's role
  const getRoleBasedPendingTotal = () => {
    if (!currentUser) return 0;
    if (currentUser.role === 'admin') {
      return pickingCount + faturamentoCount + approvalCount + receivingCount + contagensCount;
    } else if (currentUser.role === 'logistics') {
      return pickingCount + receivingCount + contagensCount;
    } else if (currentUser.role === 'branch') {
      return branchPendingApprovalCount + branchShippedCount;
    }
    return 0;
  };

  const totalPending = getRoleBasedPendingTotal();

  const getPendingCountLabel = (count: number, singular: string, plural: string) => {
    const formattedCount = count < 10 ? `0${count}` : `${count}`;
    return `${formattedCount} ${count === 1 ? singular : plural}`;
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.id !== lastLoggedInUserId) {
        setLastLoggedInUserId(currentUser.id);
        const isEnabled = settings?.vignetteEnabled !== false;
        if (isEnabled) {
          setShowVignette(true);
        }
        setShowLoginPendingAlert(true);
      }
    } else {
      setLastLoggedInUserId(null);
      setShowVignette(false);
      setShowLoginPendingAlert(false);
    }
  }, [currentUser, settings?.vignetteEnabled, lastLoggedInUserId]);

  useEffect(() => {
    (window as any).triggerMoxVignette = () => {
      setShowVignette(true);
    };
    return () => {
      delete (window as any).triggerMoxVignette;
    };
  }, []);

  useEffect(() => {
    const handleHide = () => setIsSidebarOpen(false);
    const handleShow = () => setIsSidebarOpen(true);
    window.addEventListener('hide-sidebar', handleHide);
    window.addEventListener('show-sidebar', handleShow);
    
    // Auto-hide the sidebar on initial mount if running on a mobile screen
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    return () => {
      window.removeEventListener('hide-sidebar', handleHide);
      window.removeEventListener('show-sidebar', handleShow);
    };
  }, []);

  useEffect(() => {
    const handleHide = () => setIsSidebarOpen(false);
    const handleShow = () => setIsSidebarOpen(true);
    window.addEventListener('hide-sidebar', handleHide);
    window.addEventListener('show-sidebar', handleShow);
    return () => {
      window.removeEventListener('hide-sidebar', handleHide);
      window.removeEventListener('show-sidebar', handleShow);
    };
  }, []);

  useEffect(() => {
    // Auto-collapse sidebar on mobile/tablet screens when active tab changes
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const handleVignetteComplete = () => {
    setShowVignette(false);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <Login />
        <Toaster position="top-right" />
      </div>
    );
  }

  const menuSections = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, roles: ['admin', 'logistics', 'branch'] },
    
    { 
      id: 'admin', 
      label: 'Administrativo', 
      icon: Users, 
      roles: ['admin'],
      children: [
        { id: 'admin_products', label: 'Produtos', icon: Package, roles: ['admin'] },
        { id: 'admin_suppliers', label: 'Fornecedores', icon: Users, roles: ['admin'] },
        { id: 'admin_purchases', label: 'Pedidos de Compra', icon: ShoppingCart, roles: ['admin'] },
        { id: 'admin_approval', label: 'Aprovação Pedidos', icon: CheckCircle2, roles: ['admin'] },
        { id: 'admin_invoicing', label: 'Faturamento', icon: FileText, roles: ['admin'] },
        { id: 'admin_inventory', label: 'Estoque Central', icon: ClipboardList, roles: ['admin'] },
        { id: 'admin_distribution', label: 'Distribuição', icon: Share2, roles: ['admin'] },
        { id: 'admin_limits', label: 'Limites e Cotas', icon: Sliders, roles: ['admin'] },
      ]
    },
    
    {
      id: 'outbound',
      label: 'Saídas',
      icon: HistoryIcon,
      roles: ['admin', 'branch'],
      children: [
        { id: 'outbound_history', label: 'Histórico Saídas', icon: HistoryIcon, roles: ['admin', 'branch'] },
        { id: 'outbound_insights', label: 'Insights de Fluxo', icon: TrendingUp, roles: ['admin'] },
      ]
    },

    { 
      id: 'logistics', 
      label: 'Logística', 
      icon: Truck, 
      roles: ['admin', 'logistics'],
      children: [
        { id: 'logistics_picking_cities', label: 'Separação (Cidade)', icon: Box, roles: ['admin', 'logistics'] },
        { id: 'logistics_loading', label: 'Carregamento', icon: Truck, roles: ['admin', 'logistics'] },
        { id: 'logistics_ready', label: 'Enviados', icon: CheckCircle2, roles: ['admin', 'logistics'] },
        { id: 'logistics_incoming', label: 'Recebimento', icon: Package, roles: ['admin', 'logistics'] },
        { id: 'logistics_counts', label: 'Contagens', icon: ClipboardList, roles: ['admin', 'logistics'] },
      ]
    },

    { 
      id: 'branch', 
      label: 'Minha Filial', 
      icon: Store, 
      roles: ['admin', 'branch'],
      children: [
        { id: 'branch_orders', label: 'Meus Pedidos', icon: HistoryIcon, roles: ['admin', 'branch'] },
        { id: 'branch_catalogue', label: 'Fazer Pedido', icon: Plus, roles: ['admin', 'branch'] },
      ]
    },
    
    { id: 'settings', label: 'Configurações', icon: SettingsIcon, roles: ['admin'] },
  ];

  const filteredMenu = menuSections.filter(section => section.roles.includes(currentUser.role));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'limits':
        return <LimitsModule />;
      case 'settings':
        return <SettingsModule />;
      case 'admin':
        return <AdminModule />;
      case 'logistics':
        return <LogisticsModule />;
      case 'branch':
        return <BranchModule />;
      default:
        if (activeTab.startsWith('admin_')) {
          return <AdminModule initialTab={activeTab.replace('admin_', '')} />;
        }
        if (activeTab.startsWith('outbound_')) {
          const subTab = activeTab.replace('outbound_', '');
          const tabMap: Record<string, string> = { history: 'history', insights: 'insights' };
          return <OutboundModule initialTab={tabMap[subTab] || subTab} />;
        }
        if (activeTab.startsWith('logistics_')) {
          return <LogisticsModule initialTab={activeTab.replace('logistics_', '')} />;
        }
        if (activeTab.startsWith('branch_')) {
          return <BranchModule initialTab={activeTab.replace('branch_', '')} />;
        }
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex">
      {/* Sidebar mobile backdrop overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 z-50 lg:relative shadow-2xl"
          >
            <div className="p-8 flex flex-col gap-4 relative">
              {/* Close button inside sidebar on mobile */}
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
                id="close-sidebar-mobile-btn"
                title="Fechar Menu"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col gap-4">
                {settings?.companyLogo ? (
                  <div className="w-full h-24 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner p-3">
                    <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    R
                  </div>
                )}
              <div>
                <h1 className="font-bold text-3xl tracking-tight text-white">MOX</h1>
                <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-[0.1em] mt-1">Gestão de Almoxarifado</p>
              </div>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
              {filteredMenu.map((section) => {
                const hasChildren = section.children && section.children.length > 0;
                const isExpanded = expandedSections.includes(section.id);
                const isActive = activeTab === section.id || (section.children?.some(child => child.id === activeTab));

                return (
                  <div key={section.id} className="space-y-1">
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleSection(section.id);
                        } else {
                          setActiveTab(section.id);
                        }
                      }}
                      className={`sidebar-item w-full flex items-center justify-between group ${isActive && !hasChildren ? 'active' : ''} ${isActive && hasChildren ? 'text-white bg-slate-800/50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <section.icon size={20} className={isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'} />
                        <span className="font-medium">{section.label}</span>
                      </div>
                      {hasChildren && (
                        isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />
                      )}
                    </button>

                    <AnimatePresence>
                      {hasChildren && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-1"
                        >
                          {section.children.filter(child => child.roles.includes(currentUser.role)).map((child) => (
                            <button
                              key={child.id}
                              onClick={() => setActiveTab(child.id)}
                              className={`sidebar-item w-full ml-4 w-[calc(100%-1rem)] py-2 text-sm ${activeTab === child.id ? 'active text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                              <child.icon size={16} />
                              {child.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <div className="bg-slate-800/50 rounded-lg p-4 flex items-center gap-3 border border-slate-700/50">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/30">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="text-slate-500 hover:text-red-400 hover:bg-red-400/10">
                  <LogOut size={18} />
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <Menu size={20} />
            </Button>
            <div className="hidden md:flex items-center bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 w-80 focus-within:border-cyan-500/50 transition-all">
              <Search size={16} className="text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="Pesquisar no MOX..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-200 placeholder:text-slate-600"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLoginPendingAlert(true)}
              className="relative text-slate-400 hover:text-white hover:bg-slate-800"
              id="mox-bell-notification-btn"
              title="Processos Pendentes"
            >
              <Bell size={20} />
              {totalPending > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce font-mono">
                  {totalPending}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              )}
            </Button>
            <div className="h-8 w-px bg-slate-800 mx-2"></div>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
              {currentUser.role === 'admin' ? 'Acesso Total' : 'Acesso Restrito'}
            </Badge>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Toaster position="top-right" richColors />
      <AnimatePresence>
        {showVignette && (
          <Vignette onComplete={handleVignetteComplete} />
        )}
      </AnimatePresence>

      {/* Dynamic Pending Processes Alert Modal */}
      <AnimatePresence>
        {showLoginPendingAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-cyan-500/5"
              id="pending-processes-alert-modal"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <Bell size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Alerta de Processos Pendentes</h3>
                    <p className="text-xs text-slate-400">Resumo de processos operacionais</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoginPendingAlert(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Fechar"
                  id="close-pending-alert-modal-btn"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-slate-300">
                  Olá, <strong className="text-cyan-400">{currentUser?.name}</strong>! Foram detectados os seguintes processos aguardando tratamento no sistema:
                </p>

                <div className="space-y-3">
                  {/* ADMIN and LOGISTICS rows */}
                  {['admin', 'logistics'].includes(currentUser?.role) && (
                    <>
                      {/* Separações / Picking */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pickingCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800/40 text-slate-500'}`}>
                            <Box size={20} />
                          </div>
                          <div>
                            <p className={`font-mono text-sm font-black tracking-wide ${pickingCount > 0 ? 'text-amber-500' : 'text-slate-450'}`}>
                              {getPendingCountLabel(pickingCount, 'SEPARAÇÃO PENDENTE', 'SEPARAÇÕES PENDENTES')}
                            </p>
                            <p className="text-xs text-slate-500">Pedidos prontos para a área de separação física</p>
                          </div>
                        </div>
                        {pickingCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab('logistics_picking_cities');
                              setShowLoginPendingAlert(false);
                            }}
                            className="h-8 hover:bg-amber-500 hover:text-white border border-amber-500/20 text-xs gap-1 opacity-90 hover:opacity-100 transition-all font-bold text-amber-500"
                          >
                            Separar <ChevronRight size={14} />
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ADMIN ONLY rows */}
                  {currentUser?.role === 'admin' && (
                    <>
                      {/* Faturamentos */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${faturamentoCount > 0 ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-800/40 text-slate-500'}`}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className={`font-mono text-sm font-black tracking-wide ${faturamentoCount > 0 ? 'text-purple-500' : 'text-slate-450'}`}>
                              {getPendingCountLabel(faturamentoCount, 'FATURAMENTO PENDENTE', 'FATURAMENTOS PENDENTES')}
                            </p>
                            <p className="text-xs text-slate-500">Pedidos separados aguardando Nota Fiscal de saída</p>
                          </div>
                        </div>
                        {faturamentoCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab('admin_invoicing');
                              setShowLoginPendingAlert(false);
                            }}
                            className="h-8 hover:bg-purple-500 hover:text-white border border-purple-500/20 text-xs gap-1 opacity-90 hover:opacity-100 transition-all font-bold text-purple-500"
                          >
                            Faturar <ChevronRight size={14} />
                          </Button>
                        )}
                      </div>

                      {/* Aprovações */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-rose-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${approvalCount > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800/40 text-slate-500'}`}>
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <p className={`font-mono text-sm font-black tracking-wide ${approvalCount > 0 ? 'text-rose-500' : 'text-slate-450'}`}>
                              {getPendingCountLabel(approvalCount, 'APROVAÇÃO PENDENTE', 'APROVAÇÕES PENDENTES')}
                            </p>
                            <p className="text-xs text-slate-500">Pedidos de filiais aguardando auditoria e aprovação</p>
                          </div>
                        </div>
                        {approvalCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab('admin_approval');
                              setShowLoginPendingAlert(false);
                            }}
                            className="h-8 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs gap-1 opacity-90 hover:opacity-100 transition-all font-bold text-rose-500"
                          >
                            Aprovar <ChevronRight size={14} />
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ADMIN and LOGISTICS rows (receiving & counts) */}
                  {['admin', 'logistics'].includes(currentUser?.role) && (
                    <>
                      {/* Recebimentos */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${receivingCount > 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800/40 text-slate-500'}`}>
                            <ShoppingCart size={20} />
                          </div>
                          <div>
                            <p className={`font-mono text-sm font-black tracking-wide ${receivingCount > 0 ? 'text-cyan-400' : 'text-slate-450'}`}>
                              {getPendingCountLabel(receivingCount, 'RECEBIMENTO PENDENTE', 'RECEBIMENTOS PENDENTES')}
                            </p>
                            <p className="text-xs text-slate-500">Pedidos de compra aprovados pendentes de recebimento</p>
                          </div>
                        </div>
                        {receivingCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab('logistics_incoming');
                              setShowLoginPendingAlert(false);
                            }}
                            className="h-8 hover:bg-cyan-500 hover:text-white border border-cyan-500/20 text-xs gap-1 opacity-90 hover:opacity-100 transition-all font-bold text-cyan-500"
                          >
                            Receber <ChevronRight size={14} />
                          </Button>
                        )}
                      </div>

                      {/* Contagens de Estoque */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${contagensCount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/40 text-slate-500'}`}>
                            <ClipboardList size={20} />
                          </div>
                          <div>
                            <p className={`font-mono text-sm font-black tracking-wide ${contagensCount > 0 ? 'text-emerald-500' : 'text-slate-450'}`}>
                              {getPendingCountLabel(contagensCount, 'CONTAGEM PENDENTE', 'CONTAGENS PENDENTES')}
                            </p>
                            <p className="text-xs text-slate-500">Contagens cíclicas de inventário requisitadas</p>
                          </div>
                        </div>
                        {contagensCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab('logistics_counts');
                              setShowLoginPendingAlert(false);
                            }}
                            className="h-8 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-xs gap-1 opacity-90 hover:opacity-100 transition-all font-bold text-emerald-500"
                          >
                            Contar <ChevronRight size={14} />
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {/* BRANCH ONLY rows */}
                  {currentUser?.role === 'branch' && (
                    <>
                      {/* Pedidos Enviados Aguardando Conferência de Entrega */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${branchShippedCount > 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800/40 text-slate-500'}`}>
                            <Truck size={20} />
                          </div>
                          <div>
                            <p className={`font-mono text-sm font-black tracking-wide ${branchShippedCount > 0 ? 'text-cyan-400' : 'text-slate-450'}`}>
                              {getPendingCountLabel(branchShippedCount, 'CARGA EM TRÂNSITO PENDENTE', 'CARGAS EM TRÂNSITO PENDENTES')}
                            </p>
                            <p className="text-xs text-slate-500">Pedidos enviados que aguardam conferência física e recebimento na unidade</p>
                          </div>
                        </div>
                        {branchShippedCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab('branch_orders');
                              setShowLoginPendingAlert(false);
                            }}
                            className="h-8 hover:bg-cyan-500 hover:text-white border border-cyan-500/20 text-xs gap-1 opacity-90 hover:opacity-100 transition-all font-bold text-cyan-500"
                          >
                            Conferir Carga <ChevronRight size={14} />
                          </Button>
                        )}
                      </div>

                      {/* Pedidos do estabelecimento Aguardando Aprovação */}
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${branchPendingApprovalCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800/40 text-slate-500'}`}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className={`font-mono text-sm font-black tracking-wide ${branchPendingApprovalCount > 0 ? 'text-amber-500' : 'text-slate-450'}`}>
                              {getPendingCountLabel(branchPendingApprovalCount, 'PEDIDO AGUARDANDO APROVAÇÃO', 'PEDIDOS AGUARDANDO APROVAÇÃO')}
                            </p>
                            <p className="text-xs text-slate-500">Seus novos pedidos de reposição aguardando verificação da gerência</p>
                          </div>
                        </div>
                        {branchPendingApprovalCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab('branch_orders');
                              setShowLoginPendingAlert(false);
                            }}
                            className="h-8 hover:bg-amber-500 hover:text-white border border-amber-500/20 text-xs gap-1 opacity-90 hover:opacity-100 transition-all font-bold text-amber-500"
                          >
                            Ver Pedidos <ChevronRight size={14} />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {totalPending === 0 && (
                  <div className="py-6 text-center text-slate-500">
                    <p className="text-emerald-500 font-bold mb-1">✓ Excelente!</p>
                    <p className="text-xs">Não há processos pendentes no momento. Tudo atualizado!</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end">
                <Button
                  onClick={() => setShowLoginPendingAlert(false)}
                  className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold px-6"
                  id="dismiss-pending-alert-modal-btn"
                >
                  Entendido
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardOverview() {
  const { products, branchOrders, purchaseOrders, distributions } = useRamoxContext();
  
  const lowStock = products.filter(p => p.currentStock <= p.minStock);
  const pendingBranchOrders = branchOrders.filter(o => o.status === 'pending');
  const pendingPurchaseOrders = purchaseOrders.filter(o => o.status === 'pending');
  const volumeTotalSaida = distributions.reduce((acc, d) => 
    acc + d.items.reduce((sum, item) => {
      const itemQty = (item as any).quantity ?? item.quantityPerBranch?.reduce((qSum, q) => qSum + (q.quantity || 0), 0) ?? 0;
      return sum + itemQty;
    }, 0), 0
  );

  const stats = [
    { label: 'Volume Enviado', value: `${volumeTotalSaida} un`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', icon: ArrowUpRight },
    { label: 'Estoque Baixo', value: lowStock.length, color: 'text-rose-400', bg: 'bg-rose-500/10', iconColor: 'text-rose-500', icon: Package },
    { label: 'Pedidos Filiais', value: pendingBranchOrders.length, color: 'text-amber-400', bg: 'bg-amber-500/10', iconColor: 'text-amber-500', icon: HistoryIcon },
    { label: 'Pedidos Compra', value: pendingPurchaseOrders.length, color: 'text-cyan-400', bg: 'bg-cyan-500/10', iconColor: 'text-cyan-500', icon: ShoppingCart },
  ];

  // Simple forecast logic for outbound volume
  const currentDaysInMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedVolume = (volumeTotalSaida / currentDaysInMonth) * daysInMonth;

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-white tracking-tight">Bem-vindo ao MOX</h2>
            <p className="text-slate-400 font-medium">Visão geral das operações de hoje e projeções de fluxo.</p>
          </div>
          <Card className="bg-slate-900 border-slate-800 px-6 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Previsão Mensal (Volume)</p>
              <p className="text-xl font-black text-white">{projectedVolume.toFixed(0)} un</p>
            </div>
          </Card>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-slate-800 bg-slate-900/50 shadow-xl hover:border-slate-700 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <h3 className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</h3>
                </div>
                <div className={`w-14 h-14 rounded-lg ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={stat.iconColor} size={28} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-800 bg-slate-900/50 shadow-xl">
          <CardHeader className="border-b border-slate-800/50 pb-4">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {lowStock.length > 0 ? (
              <div className="space-y-3">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Cód: {p.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-400">{p.currentStock} {p.unit}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Mín: {p.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                <CheckCircle2 size={40} className="text-emerald-500/20" />
                <p>Nenhum alerta de estoque no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 shadow-xl">
          <CardHeader className="border-b border-slate-800/50 pb-4">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              Últimos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {branchOrders.length > 0 ? (
              <div className="space-y-3">
                {branchOrders.slice(-5).reverse().map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">Pedido #{o.id.toUpperCase()}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize bg-slate-700 text-slate-300 border-none px-3">
                      {o.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                <ShoppingCart size={40} className="text-cyan-500/20" />
                <p>Nenhum pedido realizado ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
