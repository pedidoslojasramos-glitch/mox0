import React, { useState, useEffect } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import ExportExcelModal from '../components/ExportExcelModal';
import Pagination from '../components/Pagination';
import { SearchableSelect } from '../components/SearchableSelect';
import { 
  Store, 
  Plus, 
  ShoppingCart, 
  History as HistoryIcon, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Minus,
  Trash2,
  ChevronLeft,
  FileCheck,
  Edit,
  Package,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  MessageSquare,
  FileDown,
  ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { generateBranchOrderPDF } from '../utils/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function BranchModule({ initialTab }: { initialTab?: string }) {
  const { 
    currentUser, 
    branches, 
    products, 
    branchOrders, 
    createBranchOrder, 
    globalSearch, 
    updateBranchOrderStatus,
    updateBranchOrderItems,
    deleteBranchOrder,
    checkBranchOrderLimits,
    settings,
    productClassifications
  } = useRamoxContext();
  const branch = branches.find(b => b.id === currentUser?.branchId);
  const myOrders = branchOrders.filter(o => o.branchId === currentUser?.branchId);

  const [isOrdering, setIsOrdering] = useState(initialTab === 'catalogue');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);

  const handleExportPDF = (orderItems: { productId: string, quantity: number }[], isDraft: boolean, orderObj?: any) => {
    try {
      generateBranchOrderPDF(
        orderItems,
        isDraft,
        branch,
        products,
        orderObj,
        orderNotes,
        priority,
        settings?.companyLogo
      );
      toast.success('Documento PDF exportado com sucesso!');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro de exportação PDF: ' + e.message);
    }
  };
  
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<{ productId: string, quantity: number }[]>([]);

  const startReview = (order: any) => {
    setReviewOrderId(order.id);
    setReviewItems([...order.items]);
  };

  const handleUpdateReviewQty = (productId: string, quantity: number) => {
    setReviewItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
    ));
  };

  const handleConfirmOrder = () => {
    if (reviewOrderId) {
      const originalOrder = branchOrders.find(o => o.id === reviewOrderId);
      const differenceItems: { productId: string, quantity: number }[] = [];
      const receivedItems: { productId: string, quantity: number }[] = [];

      reviewItems.forEach((item) => {
        const originalItem = originalOrder?.items.find((i: any) => i.productId === item.productId);
        const originalQty = originalItem?.quantity || 0;
        
        if (item.quantity < originalQty) {
          differenceItems.push({
            productId: item.productId,
            quantity: originalQty - item.quantity
          });
        }
        
        if (item.quantity > 0) {
          receivedItems.push({
            productId: item.productId,
            quantity: item.quantity
          });
        }
      });

      if (differenceItems.length > 0) {
        // Update original order with what was RECEIVED and mark delivered
        updateBranchOrderItems(reviewOrderId, receivedItems);
        updateBranchOrderStatus(reviewOrderId, 'delivered');
        
        // Create a NEW order with the MISSING items (divergence)
        if (currentUser?.branchId) {
          createBranchOrder(currentUser.branchId, differenceItems, 'discrepancy');
          toast.warning(`Divergência relatada! ${differenceItems.length} item(ns) faltante(s) foram enviados para nova análise.`);
        }
      } else if (receivedItems.length === 0 && (originalOrder?.items.length || 0) > 0) {
        // Special case: nothing received
        updateBranchOrderStatus(reviewOrderId, 'delivered'); // Or 'cancelled'? User said "receber com divergência"
        if (currentUser?.branchId && originalOrder) {
          createBranchOrder(currentUser.branchId, originalOrder.items, 'discrepancy');
          toast.error('Nenhum item recebido! Todo o pedido foi enviado para nova análise.');
        }
      } else {
        updateBranchOrderStatus(reviewOrderId, 'delivered');
        toast.success('Pedido conferido e dado como entregue sem divergências!');
      }
      setReviewOrderId(null);
    }
  };

  // Edit Order States
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderItems, setEditingOrderItems] = useState<{ productId: string, quantity: number }[]>([]);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<string>('all');

  const handleStartEditOrder = (order: any) => {
    setEditingOrderId(order.id);
    setEditingOrderItems(order.items.map((item: any) => ({ ...item })));
    setProductSearchInput('');
    setEditingCategory('all');
  };

  const handleUpdateEditQty = (productId: string, quantity: number) => {
    setEditingOrderItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const handleRemoveEditItem = (productId: string) => {
    setEditingOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleAddProductToEdit = (productId: string) => {
    if (editingOrderItems.some(item => item.productId === productId)) {
      toast.warning("Este produto já está incluído no pedido.");
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.currentStock <= 0) {
      toast.error(`Não é possível adicionar o produto "${product.name}" porque ele está com estoque zerado.`);
      return;
    }
    setEditingOrderItems(prev => [...prev, { productId, quantity: 1 }]);
    toast.success(`"${product.name}" adicionado ao pedido.`);
  };

  const handleSaveEditedOrder = () => {
    if (!currentUser?.branchId || !editingOrderId) return;
    if (editingOrderItems.length === 0) {
      toast.error("O pedido deve conter pelo menos 1 produto. Se deseja cancelar, utilize a opção de excluir o pedido.");
      return;
    }

    // Check limits
    const checkResult = checkBranchOrderLimits(currentUser.branchId, editingOrderItems, editingOrderId);
    if (!checkResult.allowed) {
      toast.error(checkResult.reason, { duration: 8000 });
      return;
    }

    updateBranchOrderItems(editingOrderId, editingOrderItems);
    setEditingOrderId(null);
    toast.success("Pedido atualizado com sucesso!");
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteBranchOrder(orderId);
    toast.success("Pedido cancelado e excluído com sucesso.");
    setEditingOrderId(null);
  };

  // Sync state if initialTab changes from parent
  useEffect(() => {
    if (initialTab === 'catalogue') {
      setIsOrdering(true);
    } else if (initialTab === 'orders') {
      setIsOrdering(false);
    }
  }, [initialTab]);

  const effectiveSearch = searchTerm || globalSearch;

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && product.currentStock <= 0) {
      toast.error(`O produto "${product.name}" está com estoque zerado e não pode ser solicitado.`);
      return;
    }
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
    toast.success('Item adicionado ao carrinho');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const clearItem = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const cartItemsCount = (Object.values(cart) as number[]).reduce((a, b) => a + b, 0);
  const cartTotal = (Object.entries(cart) as [string, number][]).reduce((acc, [id, qty]) => {
    const product = products.find(p => p.id === id);
    return acc + (product ? product.price * qty : 0);
  }, 0);

  const handleSubmitOrder = () => {
    if (cartItemsCount === 0) return;
    const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
    
    if (!currentUser?.branchId) {
      toast.error('Apenas usuários vinculados a uma filial podem realizar pedidos de abastecimento.');
      return;
    }

    // Include priority and notes in the submission if the backend/context supported it.
    // For now, we follow the current context signature which might only take branchId and items.
    const result = createBranchOrder(currentUser.branchId, items);
    if (result && !result.success) {
      toast.error(result.reason, {
        duration: 8000
      });
      return;
    }
    
    setCart({});
    setOrderNotes('');
    setPriority('normal');
    setIsCheckoutOpen(false);
    setIsOrdering(false);
    toast.success('Pedido enviado com sucesso! O estoque dos itens solicitados foi reservado.');
  };

  const categories = ['all', ...(productClassifications || [])];

  const [currentProductsPage, setCurrentProductsPage] = useState(1);
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                         p.code.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setCurrentProductsPage(1);
  }, [searchTerm, selectedCategory, globalSearch]);

  const paginatedProducts = filteredProducts.slice((currentProductsPage - 1) * 15, currentProductsPage * 15);

  const filteredOrders = myOrders.filter(o => 
    o.id.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    o.status.toLowerCase().includes(effectiveSearch.toLowerCase())
  );

  useEffect(() => {
    setCurrentOrdersPage(1);
  }, [searchTerm, globalSearch]);

  const reversedOrders = filteredOrders.slice().reverse();
  const paginatedOrders = reversedOrders.slice((currentOrdersPage - 1) * 15, currentOrdersPage * 15);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">{isOrdering ? 'Fazer Pedido de Abastecimento' : (branch?.name || 'Minha Filial')}</h2>
          <p className="text-slate-400 font-medium tracking-wide">{isOrdering ? 'Selecione os produtos para sua filial.' : 'Gerencie suas solicitações de abastecimento.'}</p>
        </div>
        {!isOrdering && (
          <div className="flex items-center gap-3">
            <ExportExcelModal
              title="Exportar Pedidos da Filial"
              description="Exporte o histórico de solicitações de abastecimento da sua filial."
              data={filteredOrders.map(o => {
                const total = o.items.reduce((acc, item) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return acc + (p ? p.price * item.quantity : 0);
                }, 0);
                return {
                  IDPedido: o.id.toUpperCase(),
                  DataSolicitacao: new Date(o.createdAt).toLocaleDateString('pt-BR'),
                  TotalItens: o.items.length,
                  ValorTotal: total,
                  Status: o.status === 'pending' ? 'Aguardando Aprovação' : o.status === 'approved' ? 'Em Separação / Trânsito' : o.status === 'delivered' ? 'Entregue' : o.status
                };
              })}
              defaultFilename="pedidos_filial"
              sheetName="MeusPedidos"
              columns={[
                { key: 'IDPedido', label: 'ID Pedido' },
                { key: 'DataSolicitacao', label: 'Data Solicitação' },
                { key: 'TotalItens', label: 'Qtd Itens' },
                { key: 'ValorTotal', label: 'Valor Total (R$)' },
                { key: 'Status', label: 'Status' },
              ]}
            />
            <Button 
              onClick={() => setIsOrdering(true)} 
              className="bg-cyan-500 hover:bg-cyan-400 text-white h-11 px-6 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] font-bold border-none"
            >
              <Plus size={18} className="mr-2" /> Novo Pedido
            </Button>
          </div>
        )}
      </div>

      {isOrdering ? (
        <div className="flex flex-col lg:h-[calc(100vh-180px)] lg:min-h-[580px] h-auto gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsOrdering(false)}
                className="rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 h-10 px-3 transition-colors"
              >
                <ChevronLeft size={18} className="mr-1" /> Voltar
              </Button>
              <div className="h-6 w-px bg-slate-800 hidden md:block" />
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Catálogo de Produtos</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Selecione os itens para abastecimento</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <Button 
                  size="sm" 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3 rounded-md transition-all"
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button 
                  size="sm" 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3 rounded-md transition-all"
                >
                  <ListIcon size={16} />
                </Button>
              </div>

              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <Input 
                  placeholder="Código ou Nome..." 
                  className="pl-10 h-10 bg-slate-950 border-slate-800 rounded-lg focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Categories Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap
                  ${selectedCategory === cat ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-slate-500 hover:text-slate-200'}
                `}
              >
                {cat === 'all' ? 'Ver Todos' : cat}
              </Button>
            ))}
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            <div className="flex-1 lg:overflow-y-auto pr-2 custom-scrollbar">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {paginatedProducts.map(product => {
                    const inCartQty = cart[product.id] || 0;
                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`group bg-slate-900 border rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all shadow-xl backdrop-blur-sm relative flex flex-col h-full
                          ${inCartQty > 0 ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : 'border-slate-800'}
                        `}
                      >
                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-950">
                          <img 
                            src={product.image || `https://picsum.photos/seed/${product.code}/300/225`} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-slate-950/90 backdrop-blur-md border-slate-800 text-[10px] font-bold py-0.5 min-w-[30px] flex items-center justify-center">
                              {product.unit}
                            </Badge>
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            {product.currentStock <= 0 ? (
                              <Badge className="bg-rose-500/95 hover:bg-rose-500/95 text-[10px] text-white border-none font-bold py-0.5 px-2">
                                Zerado
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-950/80 hover:bg-slate-950/80 text-[9px] text-slate-300 border-none font-medium py-0.5 px-2">
                                Est. Central: {product.currentStock}
                              </Badge>
                            )}
                          </div>
                          
                          {inCartQty > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/10 backdrop-blur-[2px]">
                              <Badge className="bg-cyan-500 text-white border-none shadow-xl shadow-cyan-500/40 text-lg px-4 py-1 h-auto font-black rounded-full">
                                {inCartQty}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-3 flex-1 flex flex-col">
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-mono text-cyan-500 font-bold uppercase tracking-tighter">{product.code}</p>
                            <h4 className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight uppercase min-h-[2.5rem]">{product.name}</h4>
                          </div>
                          
                          <div className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] text-slate-500 uppercase font-black">Preço Unit.</p>
                              <p className="text-sm font-black text-white">R$ {product.price.toFixed(2)}</p>
                            </div>
                            
                            <div className="flex items-center gap-1 w-full">
                              {inCartQty > 0 ? (
                                <div className="flex items-center justify-between w-full bg-slate-950 p-0.5 rounded-lg border border-indigo-500/10">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                    onClick={() => removeFromCart(product.id)}
                                  >
                                    <Minus size={12} />
                                  </Button>
                                  <span className="text-[11px] font-mono font-bold text-cyan-400">{inCartQty} {product.unit}</span>
                                  <Button 
                                    onClick={() => addToCart(product.id)}
                                    disabled={inCartQty >= product.currentStock}
                                    className="h-7 w-7 rounded-md bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg active:scale-90 border-none p-0 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Plus size={14} />
                                  </Button>
                                </div>
                              ) : product.currentStock <= 0 ? (
                                <Button 
                                  disabled
                                  className="w-full bg-slate-950 border border-slate-800/80 text-rose-500/60 h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                  Indisponível
                                </Button>
                              ) : (
                                <Button 
                                  onClick={() => addToCart(product.id)}
                                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-8 rounded-lg font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] border-none flex items-center justify-center gap-1.5"
                                >
                                  <Plus size={14} /> Incluir
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-slate-900/50 border-slate-800 rounded-xl overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest pl-6">Foto</TableHead>
                          <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Produto / Código</TableHead>
                          <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Categoria</TableHead>
                          <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest text-right">Preço Unit.</TableHead>
                          <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest text-center">Quantidade</TableHead>
                          <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest text-right pr-6">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {paginatedProducts.map(product => {
                        const inCartQty = cart[product.id] || 0;
                        return (
                          <TableRow key={product.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-all ${inCartQty > 0 ? 'bg-cyan-500/5' : ''}`}>
                            <TableCell className="pl-6">
                              <img src={product.image} className="w-10 h-10 rounded-lg object-cover border border-slate-800" referrerPolicy="no-referrer" />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200 text-xs">{product.name}</span>
                                {product.currentStock <= 0 && (
                                  <Badge className="bg-rose-500/95 hover:bg-rose-500/95 text-[8px] font-black uppercase text-white border-none py-0.5 px-1.5 shrink-0">
                                    Sem Estoque
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-tighter">{product.code}</span>
                                <span className="text-slate-700 text-[10px]">•</span>
                                <span className={`text-[10px] font-medium ${product.currentStock <= 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                                  Estoque central: {product.currentStock} {product.unit}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[8px] font-bold uppercase border-slate-800 text-slate-500">
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-slate-400 text-xs">
                              R$ {product.price.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-3">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-md text-slate-500 hover:text-white"
                                  disabled={inCartQty === 0}
                                  onClick={() => removeFromCart(product.id)}
                                >
                                  <Minus size={12} />
                                </Button>
                                <span className={`text-sm font-bold w-6 text-center ${inCartQty > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{inCartQty}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-md text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                                  disabled={product.currentStock <= 0 || inCartQty >= product.currentStock}
                                  onClick={() => addToCart(product.id)}
                                >
                                  <Plus size={12} />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6 font-bold text-white text-xs">
                              R$ {(product.price * inCartQty).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
              )}
              <Pagination
                currentPage={currentProductsPage}
                totalPages={Math.ceil(filteredProducts.length / 15)}
                onPageChange={setCurrentProductsPage}
                totalItems={filteredProducts.length}
                itemsPerPage={15}
              />
            </div>

            <Card className="w-full lg:w-96 shrink-0 border-slate-800 bg-slate-900 shadow-2xl rounded-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 lg:h-full min-h-[380px] lg:min-h-[500px]">
              <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <span className="font-black text-white text-sm tracking-tight">Meu Carrinho</span>
                    <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Itens Selecionados</p>
                  </div>
                </div>
                {cartItemsCount > 0 && (
                  <Badge className="bg-cyan-500 text-white border-none text-xs h-6 px-2.5 font-black shadow-lg shadow-cyan-500/20">{cartItemsCount}</Badge>
                )}
              </div>
              
              <div className="flex-1 min-h-[150px] lg:min-h-[220px] overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-950/30">
                {(Object.entries(cart) as [string, number][]).map(([id, qty]) => {
                  const product = products.find(p => p.id === id);
                  if (!product) return null;
                  return (
                    <motion.div 
                      key={id} 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/50 hover:border-cyan-500/30 transition-all shadow-sm group relative"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800 relative">
                        {product.image ? (
                          <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-800">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-200 text-[11px] break-words uppercase group-hover:text-cyan-400 transition-colors">{product.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[9px] text-slate-500 font-bold">
                            <span className="text-cyan-500">{qty}x</span> R$ {product.price.toFixed(2)}
                          </p>
                          <p className="text-[10px] font-black text-emerald-400">R$ {(product.price * qty).toFixed(2)}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        onClick={() => clearItem(id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </motion.div>
                  );
                })}
                {cartItemsCount === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 py-12 lg:py-20 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800/50 flex items-center justify-center">
                      <ShoppingCart size={24} className="opacity-10" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Carrinho Vazio</p>
                      <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase tracking-tighter">Selecione produtos para<br/>abastecer sua filial</p>
                    </div>
                  </div>
                )}
              </div>
 
              <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-4 shrink-0 backdrop-blur-xl">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase font-black tracking-[0.2em] px-1">
                    <span>Resumo Financeiro</span>
                    <span className="text-slate-400">{cartItemsCount} Itens</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] text-cyan-500 uppercase font-black tracking-widest mb-0.5">Valor do Pedido</p>
                        <p className="text-xl font-black text-white leading-none">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] font-black uppercase tracking-widest py-0.5 px-2">Aguardando Envio</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-white h-11 rounded-xl font-black shadow-[0_4px_30px_rgba(6,182,212,0.4)] border-none text-xs tracking-wider uppercase transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50"
                  disabled={cartItemsCount === 0}
                  onClick={() => {
                    setCheckoutStep(1);
                    setIsCheckoutOpen(true);
                  }}
                >
                  REVISAR E FINALIZAR
                </Button>
              </div>
            </Card>
          </div>

          {/* Floating summary bar for mobile devices to solve responsiveness */}
          {cartItemsCount > 0 && (
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-slate-900/90 border border-cyan-500/30 p-3 rounded-xl shadow-[0_8px_32px_rgba(6,182,212,0.35)] flex items-center justify-between backdrop-blur-md animate-in slide-in-from-bottom duration-300">
              <div>
                <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Solicitação em Andamento</p>
                <p className="text-sm font-black text-white">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'} | R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <Button 
                onClick={() => {
                  setCheckoutStep(1);
                  setIsCheckoutOpen(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-white h-9 px-4 rounded-lg font-bold text-xs uppercase tracking-wider border-none"
              >
                Conferir e Enviar
              </Button>
            </div>
          )}

          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-5xl w-[95vw] h-[85vh] max-h-[85vh] p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl flex flex-col">
              {/* Header block spanning full width */}
              <div className="px-6 py-4 bg-slate-900 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-tight">
                      Elaboração de Solicitação de Abastecimento
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {checkoutStep === 1 ? 'Passo 1 de 2: Conferência de Itens Selecionados' : 'Passo 2 de 2: Prioridade e Justificativa'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Export PDF available at any moment! */}
                  <Button
                    variant="outline"
                    onClick={() => handleExportPDF(Object.entries(cart).map(([id, qty]) => ({ productId: id, quantity: qty as number })), true)}
                    className="h-9 px-4 bg-slate-800/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 font-bold text-xs uppercase tracking-wider border-slate-705/50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown size={14} /> Exportar PDF
                  </Button>
                  <Badge className="bg-slate-800 text-slate-400 border-slate-700 font-mono text-[10px]">
                    {cartItemsCount} {cartItemsCount === 1 ? 'ITEM' : 'ITENS'}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 w-full bg-slate-900 shrink-0">
                <div 
                  className="h-1 bg-cyan-500 transition-all duration-300" 
                  style={{ width: checkoutStep === 1 ? '50%' : '100%' }}
                />
              </div>

              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                {checkoutStep === 1 ? (
                  // STEP 1: DEEP CONFERENCE
                  <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    <div className="p-6 pb-2 shrink-0">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-tight">
                        Confirme as quantidades e especificações de cada item antes de avançar para o lote logístico:
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                      {(Object.entries(cart) as [string, number][]).map(([id, qty]) => {
                        const product = products.find(p => p.id === id);
                        if (!product) return null;
                        return (
                          <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex-shrink-0">
                                {product.image ? (
                                  <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-800">
                                    <Package size={18} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">#{product.code}</span>
                                <h4 className="text-xs font-bold text-slate-100 uppercase break-words">{product.name}</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Unidade: {product.unit} | Preço: R$ {product.price.toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 justify-between sm:justify-end">
                              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                  onClick={() => removeFromCart(id)}
                                >
                                  <Minus size={14} />
                                </Button>
                                <span className="text-xs font-mono font-bold text-white px-2 w-8 text-center">{qty}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                                  onClick={() => addToCart(id)}
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>

                              <div className="text-right min-w-[80px]">
                                <span className="text-[10px] text-slate-500 block">Subtotal</span>
                                <span className="text-xs font-black text-emerald-400 font-mono">R$ {(product.price * qty).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-6 bg-slate-900 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Valor do Resumo</p>
                        <p className="text-2xl font-black text-cyan-400">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost" 
                          className="h-11 px-6 rounded-lg text-slate-400 font-bold text-xs uppercase border-none"
                          onClick={() => setIsCheckoutOpen(false)}
                        >
                          Fechar
                        </Button>
                        <Button
                          onClick={() => setCheckoutStep(2)}
                          className="bg-cyan-500 hover:bg-cyan-400 text-white h-11 px-8 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg border-none flex items-center gap-1.5 cursor-pointer"
                        >
                          Avançar para Envio <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // STEP 2: SHIPPING CONFIGS & SUBMIT
                  <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Step 2 Left: Quick recap summary */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 border-r border-white/5 bg-slate-900/10">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo dos Itens Confirmados</h3>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(Object.entries(cart) as [string, number][]).map(([id, qty]) => {
                          const product = products.find(p => p.id === id);
                          if (!product) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/40">
                              <span className="text-xs font-medium text-slate-300 uppercase break-words">{product.name}</span>
                              <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded font-mono">{qty} {product.unit}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner mt-4">
                        <p className="text-[10px] text-cyan-400 uppercase font-black mb-1">Carga Financeira do Pedido</p>
                        <p className="text-xl font-bold text-white">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">Concluído o passo de conferência de volume e lotes.</p>
                      </div>
                    </div>

                    {/* Step 2 Right: settings form */}
                    <div className="w-full md:w-96 p-6 space-y-6 flex flex-col justify-between bg-slate-950 h-full overflow-y-auto custom-scrollbar">
                      <div className="space-y-6">
                        <div>
                          <Label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">
                            <Clock size={12} className="text-cyan-500" /> Prioridade de Processamento
                          </Label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                            <Button 
                              size="sm"
                              variant={priority === 'normal' ? 'secondary' : 'ghost'}
                              onClick={() => setPriority('normal')}
                              className={`font-black text-[9px] uppercase rounded-lg h-10 transition-all border-none ${priority === 'normal' ? 'bg-slate-800 text-white shadow-xl' : 'text-slate-600 hover:text-slate-300'}`}
                            >
                              Normal
                            </Button>
                            <Button 
                              size="sm"
                              variant={priority === 'urgent' ? 'secondary' : 'ghost'}
                              onClick={() => setPriority('urgent')}
                              className={`font-black text-[9px] uppercase rounded-lg h-10 transition-all border-none ${priority === 'urgent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-600 hover:text-rose-400'}`}
                            >
                              Urgente
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">
                            <MessageSquare size={12} className="text-cyan-500" /> Observações da Solicitação
                          </Label>
                          <textarea 
                            placeholder="Adicione observações para separação, centro de distribuição ou logística aqui..."
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-850 rounded-xl p-4 text-xs text-slate-300 placeholder:text-slate-700 min-h-[140px] focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all resize-none shadow-inner"
                          />
                        </div>

                        <div className="flex items-start gap-3 bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10">
                          <AlertCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                          <p className="text-[9px] font-bold text-cyan-400/80 leading-relaxed uppercase tracking-tight">
                            Este pedido passará pela aprovação do Departamento de Compras e Abastecimento antes de ser despachado.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-white/5 shrink-0">
                        <Button 
                          className="w-full bg-cyan-500 hover:bg-cyan-400 text-white h-12 rounded-xl font-black shadow-[0_4px_24px_rgba(6,182,212,0.4)] border-none text-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                          onClick={handleSubmitOrder}
                        >
                          ENVIAR SOLICITAÇÃO REAL
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-slate-500 hover:text-white h-9 text-[10px] font-black uppercase tracking-[0.2em] transition-colors border-none"
                          onClick={() => setCheckoutStep(1)}
                        >
                          &lt; Voltar para Passo 1
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-6">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <HistoryIcon size={24} className="text-cyan-400" />
                  Histórico de Pedidos
                </CardTitle>
                <div className="relative w-full md:w-72 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <Input 
                    placeholder="Buscar pedidos..." 
                    className="pl-12 h-11 bg-slate-900/50 border-slate-800 rounded-md focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">ID</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Valor</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                        <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paginatedOrders.map(order => (
                      <TableRow key={order.id} className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <TableCell className="font-mono font-bold text-cyan-500">#{order.id.toUpperCase()}</TableCell>
                        <TableCell className="text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-white">R$ {order.totalValue?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge className={
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            order.status === 'discrepancy' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            order.status === 'shipped' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                            order.status === 'loading' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            order.status === 'invoiced' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            order.status === 'picked' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            order.status === 'picking' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            order.status === 'approved' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            order.status === 'pending' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          } variant="outline">
                            {
                              order.status === 'pending' ? 'Aguardando Aprovação' :
                              order.status === 'approved' ? 'Aprovado' :
                              order.status === 'picking' ? 'Em Separação' :
                              order.status === 'picked' ? 'Separado' :
                              order.status === 'invoiced' ? 'Faturado' :
                              order.status === 'loading' ? 'Em Carregamento' :
                              order.status === 'shipped' ? 'Em Trânsito' :
                              order.status === 'delivered' ? 'Entregue' :
                              order.status === 'discrepancy' ? 'Divergência Relatada' :
                              order.status
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800 h-8 font-bold text-[11px] gap-1 px-3 border border-slate-800"
                              onClick={() => handleExportPDF(order.items, false, order)}
                            >
                              <FileDown size={14} /> PDF
                            </Button>
                            {order.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 h-8 font-bold text-[11px] gap-1 px-3 border border-amber-500/20"
                                onClick={() => handleStartEditOrder(order)}
                              >
                                <Edit size={14} /> Editar
                              </Button>
                            )}
                            {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'discrepancy') && (
                              <Dialog open={reviewOrderId === order.id} onOpenChange={(open) => !open && setReviewOrderId(null)}>
                                <DialogTrigger
                                  render={
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 font-bold h-8 text-[11px]"
                                      onClick={() => startReview(order)}
                                    >
                                      <FileCheck size={14} className="mr-1.5" /> Conferir
                                    </Button>
                                  }
                                />
                              <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl w-[95vw] max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Conferência de Recebimento - Pedido #{order.id.toUpperCase()}</DialogTitle>
                                  <p className="text-sm text-slate-400">Verifique os itens recebidos. Se houver diferença, edite a quantidade e confirme.</p>
                                </DialogHeader>
                                <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                  {reviewItems.map((item, idx) => {
                                    const product = products.find(p => p.id === item.productId);
                                    const originalQty = order.items.find((i: any) => i.productId === item.productId)?.quantity || 0;
                                    const hasDiff = item.quantity !== originalQty;

                                    return (
                                      <div key={idx} className={`flex items-center gap-4 p-3 rounded-md border ${hasDiff ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/40 border-slate-700/30'}`}>
                                        <div className="flex-1">
                                          <p className="font-bold text-white">{product?.name}</p>
                                          <p className="text-xs text-slate-400 font-mono">{product?.code}</p>
                                        </div>
                                        <div className="w-32">
                                          <Label className="text-[10px] text-slate-500 uppercase mb-1 block">Qtd Recebida</Label>
                                          <div className="flex items-center gap-2">
                                            <Input 
                                              type="number" 
                                              value={item.quantity} 
                                              onChange={(e) => handleUpdateReviewQty(item.productId, Number(e.target.value))}
                                              className={`h-9 bg-slate-950 border-slate-800 text-center font-bold ${hasDiff ? 'text-red-400 border-red-500/50' : 'text-cyan-400'}`}
                                            />
                                            <span className="text-xs text-slate-500 font-bold">/ {originalQty}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <DialogFooter className="border-t border-slate-800 pt-6">
                                  <Button variant="ghost" onClick={() => setReviewOrderId(null)} className="text-slate-400">Cancelar</Button>
                                  <Button onClick={handleConfirmOrder} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold">
                                    Confirmar Recebimento
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                          <div className="flex flex-col items-center gap-4">
                            <HistoryIcon size={48} className="text-slate-800" />
                            <p className="text-lg font-medium">Nenhum pedido encontrado.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={currentOrdersPage}
                totalPages={Math.ceil(filteredOrders.length / 15)}
                onPageChange={setCurrentOrdersPage}
                totalItems={filteredOrders.length}
                itemsPerPage={15}
              />
            </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-none shadow-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white rounded-lg overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Store size={120} />
                </div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-bold">Informações da Filial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div>
                    <p className="text-[10px] text-cyan-200 uppercase font-bold tracking-widest mb-1">Responsável</p>
                    <p className="text-lg font-bold">{branch?.manager}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-200 uppercase font-bold tracking-widest mb-1">Localização</p>
                    <p className="text-lg font-bold">{branch?.location}</p>
                  </div>
                  <div className="pt-6 border-t border-cyan-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-cyan-100">Pedidos este mês</span>
                      <span className="text-3xl font-black">{myOrders.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl rounded-lg">
                <CardHeader className="border-b border-slate-800/50 pb-6">
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    Regras de Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">Limite de valor: <span className="text-white font-bold">R$ 5.000,00</span> por pedido.</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">Pedidos aprovados até as <span className="text-white font-bold">14h</span> são enviados no mesmo dia.</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={18} className="text-amber-400" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">Verifique a disponibilidade de estoque antes de solicitar.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      <Dialog open={editingOrderId !== null} onOpenChange={(open) => !open && setEditingOrderId(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-3xl w-[95vw] max-w-3xl flex flex-col max-h-[85vh]">
          <DialogHeader className="shrink-0 border-b border-slate-800 pb-4">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Edit size={18} className="text-amber-400 animate-pulse" />
              Editar Solicitação de Abastecimento #{editingOrderId?.toUpperCase()}
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Modifique as quantidades ou adicione novos produtos enquanto o pedido aguarda aprovação pelo Departamento de Compras e Abastecimento.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 custom-scrollbar">
            {editingOrderItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-950 rounded-xl border border-slate-850">
                <Package size={40} className="mx-auto text-slate-700 mb-3 animate-bounce" />
                <p className="text-sm font-medium">Nenhum produto adicionado a este pedido.</p>
                <p className="text-xs text-slate-600 mt-1">Adicione produtos abaixo ou cancele o pedido.</p>
              </div>
            ) : (
              <div className="space-y-2 font-medium">
                {editingOrderItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  const subtotal = product.price * item.quantity;

                  return (
                    <div 
                      key={item.productId} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image && (
                          <img 
                            src={product.image} 
                            className="w-10 h-10 rounded-md object-cover border border-slate-850 bg-slate-900 shrink-0" 
                            alt={product.name} 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-200 uppercase break-words">{product.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span className="text-cyan-500 font-bold">{product.code}</span>
                            <span>•</span>
                            <span>R$ {product.price.toFixed(2)} / {product.unit}</span>
                            <span>•</span>
                            <span className={product.currentStock <= 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                              Estoque Central: {product.currentStock}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-none pt-2 sm:pt-0 border-slate-900">
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Subtotal</p>
                          <p className="font-bold text-xs text-white font-mono">R$ {subtotal.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-850">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 rounded p-0 text-slate-400 hover:text-white"
                            onClick={() => handleUpdateEditQty(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="text-xs font-mono font-bold text-cyan-400 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 rounded p-0 text-slate-400 hover:text-white"
                            onClick={() => handleUpdateEditQty(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= product.currentStock}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>

                        <Button
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg border-none"
                          onClick={() => handleRemoveEditItem(item.productId)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section to add new products to the order */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mt-2 space-y-3">
              <Label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Adicionar Novo Produto ao Pedido
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <SearchableSelect
                    value=""
                    onChange={(val) => handleAddProductToEdit(val)}
                    placeholder="Selecione um produto para adicionar..."
                    searchPlaceholder="Digite nome ou código do produto..."
                    options={products
                      .filter(p => p.currentStock > 0 && !editingOrderItems.some(item => item.productId === p.id))
                      .filter(p => editingCategory === 'all' || p.category === editingCategory)
                      .map(p => ({
                        value: p.id,
                        label: p.name,
                        code: p.code,
                        sublabel: `Disponível: ${p.currentStock} ${p.unit}`,
                        category: p.category
                      }))}
                    emptyMessage="Nenhum produto disponível com esse filtro/busca"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={editingCategory} onValueChange={setEditingCategory}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-300">
                      <SelectValue placeholder="Filtrar Classificação..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-850 text-slate-300 whitespace-nowrap">
                      <SelectItem value="all">Todas Classificações</SelectItem>
                      {(productClassifications || []).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-800 pt-4 mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between whitespace-nowrap gap-4">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Novas Quantidades</span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {editingOrderItems.reduce((acc, i) => acc + i.quantity, 0)} Itens
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Valor Total</span>
                <span className="text-sm font-black text-white font-mono">
                  R$ {editingOrderItems.reduce((acc, item) => {
                    const p = products.find(prod => prod.id === item.productId);
                    return acc + (p ? p.price * item.quantity : 0);
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button 
                variant="ghost" 
                className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 font-bold text-xs h-10 px-4 border border-rose-500/15"
                onClick={() => {
                  handleDeleteOrder(editingOrderId!);
                }}
              >
                Excluir Pedido
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setEditingOrderId(null)} 
                className="text-slate-400 hover:text-white"
              >
                Descartar
              </Button>
              <Button 
                onClick={handleSaveEditedOrder} 
                className="bg-cyan-500 hover:bg-cyan-400 text-white font-black text-xs h-10 px-5 shadow-lg shadow-cyan-500/25 border-none"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
