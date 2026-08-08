import React, { useState } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import ExportExcelModal from '../components/ExportExcelModal';
import ImportExcelModal from '../components/ImportExcelModal';
import { Pagination } from '../components/Pagination';
import { SearchableSelect } from '../components/SearchableSelect';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Truck, 
  Package,
  ShoppingCart,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Share2,
  FileCheck,
  Minus,
  AlertCircle,
  Printer,
  Copy,
  Building2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Filter,
  Check,
  ShieldCheck,
  User
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { generateRomaneioPDF, generatePurchaseOrderPDF, generateBoxLabelPDF, generateEpiTermPDF, generateDistributionRomaneioPDF, generateDistributionReceiptPDF } from '../utils/pdfGenerator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import LimitsModule from './LimitsModule';

export default function AdminModule({ initialTab }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'products');

  // Sync state if initialTab changes from parent
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const getTitle = () => {
    switch (activeTab) {
      case 'products': return 'Gestão de Produtos';
      case 'inventory': return 'Estoque Central & Insights';
      case 'suppliers': return 'Gestão de Fornecedores';
      case 'purchases': return 'Pedidos de Compra';
      case 'distribution': return 'Distribuição de Mercadorias';
      case 'approval': return 'Aprovação de Pedidos (Filiais)';
      case 'invoicing': return 'Faturamento de Pedidos';
      case 'limits': return 'Controle de Limites e Cotas';
      default: return 'Módulo Administrativo';
    }
  };

  const getDescription = () => {
    switch (activeTab) {
      case 'products': return 'Cadastre e gerencie o catálogo de produtos do sistema.';
      case 'inventory': return 'Acompanhe a movimentação e saúde do estoque total.';
      case 'suppliers': return 'Controle seus parceiros e fornecedores de mercadorias.';
      case 'purchases': return 'Emita e acompanhe pedidos de compra para reposição.';
      case 'distribution': return 'Distribua mercadorias do estoque central para as filiais.';
      case 'approval': return 'Analise, edite e aprove os pedidos realizados pelas filiais.';
      case 'invoicing': return 'Realize o faturamento dos pedidos conferidos pela logística.';
      case 'limits': return 'Configure cotas de limites mensais por produto e verbas por pedido.';
      default: return 'Gestão de cadastros, fornecedores e compras.';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">{getTitle()}</h2>
          <p className="text-slate-400 font-medium tracking-wide">{getDescription()}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!initialTab && (
          <TabsList className="flex flex-wrap gap-4 bg-transparent border-none p-0 mb-10 h-auto">
            <TabsTrigger 
              value="products" 
              className="flex-none rounded-md px-8 py-3 bg-cyan-500/10 text-cyan-400 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] font-bold transition-all hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 data-[state=active]:border-cyan-500"
            >
              Produtos
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="flex-none rounded-md px-8 py-3 bg-cyan-500/10 text-cyan-400 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] font-bold transition-all hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 data-[state=active]:border-cyan-500"
            >
              Estoque & Insights
            </TabsTrigger>
            <TabsTrigger 
              value="suppliers" 
              className="flex-none rounded-md px-8 py-3 bg-cyan-500/10 text-cyan-400 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] font-bold transition-all hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 data-[state=active]:border-cyan-500"
            >
              Fornecedores
            </TabsTrigger>
            <TabsTrigger 
              value="purchases" 
              className="flex-none rounded-md px-8 py-3 bg-cyan-500/10 text-cyan-400 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] font-bold transition-all hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 data-[state=active]:border-cyan-500"
            >
              Pedidos de Compra
            </TabsTrigger>
            <TabsTrigger 
              value="distribution" 
              className="flex-none rounded-md px-8 py-3 bg-cyan-500/10 text-cyan-400 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] font-bold transition-all hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 data-[state=active]:border-cyan-500"
            >
              Distribuição
            </TabsTrigger>
            <TabsTrigger 
              value="approval" 
              className="flex-none rounded-md px-8 py-3 bg-amber-500/10 text-amber-400 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(245,158,11,0.4)] font-bold transition-all hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/20 data-[state=active]:border-amber-500"
            >
              Aprovação
            </TabsTrigger>
            <TabsTrigger 
              value="invoicing" 
              className="flex-none rounded-md px-8 py-3 bg-emerald-500/10 text-emerald-400 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(16,185,129,0.4)] font-bold transition-all hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 data-[state=active]:border-emerald-500"
            >
              Faturamento
            </TabsTrigger>
            <TabsTrigger 
              value="limits" 
              className="flex-none rounded-md px-8 py-3 bg-cyan-500/10 text-cyan-400 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.4)] font-bold transition-all hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 data-[state=active]:border-cyan-500"
            >
              Limites e Cotas
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>

        <TabsContent value="suppliers">
          <SuppliersTab />
        </TabsContent>

        <TabsContent value="purchases">
          <PurchasesTab />
        </TabsContent>

        <TabsContent value="distribution">
          <DistributionTab />
        </TabsContent>

        <TabsContent value="approval">
          <ApprovalTab />
        </TabsContent>

        <TabsContent value="invoicing">
          <InvoicingTab />
        </TabsContent>

        <TabsContent value="limits">
          <LimitsModule hideHeader={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InventoryTab() {
  const { products, globalSearch, requestInventoryCount, requestGeneralInventoryCount, inventoryCounts, productClassifications } = useRamoxContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalItems = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.price), 0);
  const lowStockItems = products.filter(p => p.currentStock <= p.minStock);
  const outOfStock = products.filter(p => p.currentStock === 0);

  const effectiveSearch = searchTerm || globalSearch;
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(effectiveSearch.toLowerCase()) || 
                          p.code.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch, selectedCategory]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * 15, currentPage * 15);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-slate-400">Visão geral da saúde do seu estoque.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportExcelModal
            title="Exportar Análise de Estoque Central"
            description="Exporte a relação de estoque com valores, saldo e alertas de reposição."
            data={filteredProducts.map(p => ({
              Codigo: p.code,
              Nome: p.name,
              Categoria: p.category,
              PrecoUnitario: p.price,
              EstoqueAtual: p.currentStock,
              EstoqueMinimo: p.minStock,
              ValorTotalEstoque: p.currentStock * p.price,
              StatusEstoque: p.currentStock === 0 ? 'Sem Estoque' : p.currentStock <= p.minStock ? 'Estoque Crítico' : 'Normal'
            }))}
            defaultFilename="estoque_central"
            sheetName="Estoque"
            columns={[
              { key: 'Codigo', label: 'Código' },
              { key: 'Nome', label: 'Nome do Produto' },
              { key: 'Categoria', label: 'Categoria' },
              { key: 'PrecoUnitario', label: 'Preço Unit. (R$)' },
              { key: 'EstoqueAtual', label: 'Estoque Atual' },
              { key: 'EstoqueMinimo', label: 'Estoque Mínimo' },
              { key: 'ValorTotalEstoque', label: 'Valor Em Estoque (R$)' },
              { key: 'StatusEstoque', label: 'Situação' },
            ]}
          />
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-6 rounded-lg shadow-lg font-bold transition-all hover:scale-[1.02] border-none"
            onClick={() => {
              requestGeneralInventoryCount();
              toast.success('Contagem geral solicitada para todos os produtos!');
            }}
          >
            <ClipboardList size={18} className="mr-2" /> Solicitar Contagem Geral
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-800 bg-slate-900/40 shadow-xl backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Total em Peças</p>
            <h3 className="text-3xl font-bold text-white mt-2">{totalItems?.toLocaleString() || '0'}</h3>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/40 shadow-xl backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Valor em Estoque</p>
            <h3 className="text-3xl font-bold text-white mt-2">R$ {totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</h3>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/40 shadow-xl backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Abaixo do Mínimo</p>
            <h3 className="text-3xl font-bold text-white mt-2">{lowStockItems.length} itens</h3>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/40 shadow-xl backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Sem Estoque</p>
            <h3 className="text-3xl font-bold text-white mt-2">{outOfStock.length} itens</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <Button className="bg-cyan-500 hover:bg-cyan-500 text-white h-9 px-5 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.2)] font-bold border-none cursor-default w-fit">
              Análise de Disponibilidade
            </Button>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full md:w-auto">
              <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Buscar no estoque..." 
                  className="pl-10 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 bg-slate-50 border-slate-200 text-slate-700">
                  <SelectValue placeholder="Classificação..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-750">
                  <SelectItem value="all">Todas Classificações</SelectItem>
                  {(productClassifications || []).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Nível Visual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sugestão de Compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((p) => {
                const stockPercentage = Math.min(100, (p.currentStock / (p.minStock * 2)) * 100);
                const isCritical = p.currentStock <= p.minStock;
                
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider bg-slate-50">
                        {p.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      {p.currentStock} {p.unit}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {p.minStock} {p.unit}
                    </TableCell>
                    <TableCell className="w-48">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                          <span>Capacidade</span>
                          <span>{Math.round(stockPercentage)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isCritical ? 'bg-red-500' : 'bg-brand-500'}`}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isCritical ? (
                        <Badge variant="destructive" className="animate-pulse">Crítico</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100">Saudável</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isCritical ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                            <Plus size={12} /> Comprar {p.minStock * 2 - p.currentStock} {p.unit}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold uppercase border-slate-200 hover:bg-slate-50"
                            onClick={() => {
                              requestInventoryCount(p.id);
                              toast.success(`Contagem solicitada para: ${p.name}`);
                            }}
                          >
                            Solicitar Contagem
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-slate-400">Estoque em conformidade</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600"
                            onClick={() => {
                              requestInventoryCount(p.id);
                              toast.success(`Contagem solicitada para: ${p.name}`);
                            }}
                          >
                            Solicitar Contagem
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                    Nenhum produto encontrado na análise de estoque.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
         </div>
         <Pagination
           currentPage={currentPage}
           totalPages={Math.ceil(filteredProducts.length / 15)}
           onPageChange={setCurrentPage}
           totalItems={filteredProducts.length}
           itemsPerPage={15}
         />
        </CardContent>
      </Card>
    </div>
  );
}

function ProductsTab() {
  const { products, addProduct, deleteProduct, globalSearch, productClassifications } = useRamoxContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    category: '',
    unit: 'un',
    price: 0,
    currentStock: 0,
    minStock: 0,
    image: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (!newProduct.name.trim() || !newProduct.code.trim() || !newProduct.category) {
      toast.error('Preencha todos os campos obrigatórios (Nome, Código e Categoria)');
      return;
    }
    addProduct(newProduct);
    setIsAddOpen(false);
    toast.success('Produto cadastrado com sucesso!');
    setNewProduct({ name: '', code: '', category: '', unit: 'un', price: 0, currentStock: 0, minStock: 0, image: '' });
  };

  const effectiveSearch = searchTerm || globalSearch;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(effectiveSearch.toLowerCase()) || 
                          p.code.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                          p.category.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch, selectedCategory]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * 15, currentPage * 15);

  return (
    <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/50">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <Input 
              placeholder="Buscar produtos..." 
              className="pl-12 h-11 bg-slate-950/50 border-slate-800 rounded-md focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-950/50 border-slate-800 h-11 text-slate-300">
              <SelectValue placeholder="Classificação..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
              <SelectItem value="all" className="focus:bg-slate-800 focus:text-white cursor-pointer">Todas Classificações</SelectItem>
              {(productClassifications || []).map(c => (
                <SelectItem key={c} value={c} className="focus:bg-slate-800 focus:text-white cursor-pointer">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ImportExcelModal type="products" triggerText="Importar Excel" />
          <ExportExcelModal
            title="Exportar Catálogo de Produtos"
            description="Faça o download do catálogo de produtos cadastrados em formato de planilha Excel."
            data={filteredProducts.map(p => ({
              Codigo: p.code,
              Nome: p.name,
              Categoria: p.category,
              Unidade: p.unit,
              Preco: p.price,
              EstoqueAtual: p.currentStock,
              EstoqueMinimo: p.minStock
            }))}
            defaultFilename="catalogo_produtos"
            sheetName="Produtos"
            columns={[
              { key: 'Codigo', label: 'Código' },
              { key: 'Nome', label: 'Nome do Produto' },
              { key: 'Categoria', label: 'Categoria' },
              { key: 'Unidade', label: 'Unidade' },
              { key: 'Preco', label: 'Preço (R$)' },
              { key: 'EstoqueAtual', label: 'Estoque Atual' },
              { key: 'EstoqueMinimo', label: 'Estoque Mínimo' },
            ]}
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger
              render={
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-white h-11 px-6 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] font-bold border-none">
                  <Plus size={18} className="mr-2" /> Novo Produto
                </Button>
              }
            />
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white rounded-md shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Cadastrar Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Nome</Label>
                  <Input className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Código</Label>
                  <Input className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50" value={newProduct.code} onChange={e => setNewProduct({...newProduct, code: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Categoria</Label>
                  <Select value={newProduct.category} onValueChange={v => setNewProduct({...newProduct, category: v})}>
                    <SelectTrigger className="h-12 rounded-md bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {(productClassifications || []).map(c => (
                        <SelectItem key={c} value={c} className="focus:bg-slate-700 text-white">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Unidade</Label>
                  <Select value={newProduct.unit} onValueChange={v => setNewProduct({...newProduct, unit: v})}>
                    <SelectTrigger className="h-12 rounded-md bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="un">Unidade (un)</SelectItem>
                      <SelectItem value="kg">Quilo (kg)</SelectItem>
                      <SelectItem value="cx">Caixa (cx)</SelectItem>
                      <SelectItem value="lt">Litro (lt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Preço Unit.</Label>
                  <Input type="number" className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Estoque Inicial</Label>
                  <Input type="number" className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50" value={newProduct.currentStock} onChange={e => setNewProduct({...newProduct, currentStock: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Estoque Mín.</Label>
                  <Input type="number" className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50" value={newProduct.minStock} onChange={e => setNewProduct({...newProduct, minStock: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Foto do Produto</Label>
                <div className="flex items-center gap-6">
                  {newProduct.image && (
                    <img src={newProduct.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-700 shadow-lg" referrerPolicy="no-referrer" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="flex-1 h-12 bg-slate-800 border-slate-700 text-slate-400" />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-6 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="h-12 px-8 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 font-bold">Cancelar</Button>
              <Button onClick={handleAdd} className="bg-cyan-500 hover:bg-cyan-400 text-white h-12 px-10 rounded-md font-bold shadow-lg shadow-cyan-500/20 border-none">Salvar Produto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Produto</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Categoria</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Estoque</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Preço</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((p) => (
              <TableRow key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <TableCell className="py-2.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 shadow-inner">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs break-words">{p.name}</div>
                      <div className="text-[11px] font-mono text-cyan-500/70">{p.code}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-3">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-800/50 border-slate-700 text-slate-400 break-words block text-center">
                    {p.category}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-bold text-white text-xs md:text-sm">{p.currentStock}</span> <span className="text-slate-500 text-xs">{p.unit}</span>
                </TableCell>
                <TableCell className="font-bold text-white text-xs md:text-sm whitespace-nowrap">R$ {p.price?.toFixed(2) || '0.00'}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {p.currentStock <= p.minStock ? (
                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">Estoque Baixo</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Normal</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10" title="Editar"><Edit size={15} /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" 
                      title="Excluir Produto"
                      onClick={() => {
                        deleteProduct(p.id);
                        toast.success(`Produto "${p.name}" excluído com sucesso!`);
                      }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
       </div>
       <Pagination
         currentPage={currentPage}
         totalPages={Math.ceil(filteredProducts.length / 15)}
         onPageChange={setCurrentPage}
         totalItems={filteredProducts.length}
         itemsPerPage={15}
       />
      </CardContent>
    </Card>
  );
}

function SuppliersTab() {
  const { suppliers, addSupplier, deleteSupplier, globalSearch } = useRamoxContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', code: '', cnpj: '', contact: '' });

  const handleAdd = () => {
    addSupplier(newSupplier);
    setIsAddOpen(false);
    toast.success('Fornecedor cadastrado!');
    setNewSupplier({ name: '', code: '', cnpj: '', contact: '' });
  };

  const effectiveSearch = searchTerm || globalSearch;

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(effectiveSearch.toLowerCase()) || 
    s.code.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    s.cnpj.includes(effectiveSearch)
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch]);

  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * 15, currentPage * 15);

  return (
    <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/50">
        <div className="flex flex-col gap-1">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <Input 
              placeholder="Buscar fornecedores..." 
              className="pl-12 h-11 bg-slate-950/50 border-slate-800 rounded-md focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportExcelModal
            title="Exportar Fornecedores"
            description="Exporte a lista completa de fornecedores e parceiros cadastrados."
            data={filteredSuppliers.map(s => ({
              Codigo: s.code,
              NomeRazaoSocial: s.name,
              CNPJ: s.cnpj,
              Contato: s.contact
            }))}
            defaultFilename="fornecedores"
            sheetName="Fornecedores"
            columns={[
              { key: 'Codigo', label: 'Código' },
              { key: 'NomeRazaoSocial', label: 'Nome / Razão Social' },
              { key: 'CNPJ', label: 'CNPJ' },
              { key: 'Contato', label: 'Contato' },
            ]}
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger
              render={
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-white h-11 px-6 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] font-bold border-none">
                  <Plus size={18} className="mr-2" /> Novo Fornecedor
                </Button>
              }
            />
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white rounded-md shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Cadastrar Fornecedor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Nome / Razão Social</Label>
                  <Input 
                    className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                    value={newSupplier.name} 
                    onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Código</Label>
                  <Input 
                    className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                    value={newSupplier.code} 
                    placeholder="Ex: FORN001" 
                    onChange={e => setNewSupplier({...newSupplier, code: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">CNPJ</Label>
                <Input 
                  className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                  value={newSupplier.cnpj} 
                  onChange={e => setNewSupplier({...newSupplier, cnpj: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">Contato (E-mail/Tel)</Label>
                <Input 
                  className="h-12 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                  value={newSupplier.contact} 
                  onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter className="pt-6 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="h-12 px-8 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 font-bold">Cancelar</Button>
              <Button onClick={handleAdd} className="bg-cyan-500 hover:bg-cyan-400 text-white h-12 px-10 rounded-md font-bold shadow-lg shadow-cyan-500/20 border-none">Salvar Fornecedor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Código</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Fornecedor</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">CNPJ</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Contato</TableHead>
              <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSuppliers.map((s) => (
              <TableRow key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <TableCell className="font-mono text-xs font-bold text-cyan-500/70 whitespace-nowrap py-2.5 px-3">{s.code}</TableCell>
                <TableCell className="py-2.5 px-3">
                  <div className="font-bold text-slate-200 text-xs break-words">{s.name}</div>
                </TableCell>
                <TableCell className="text-slate-400 font-mono text-xs whitespace-nowrap py-2.5 px-3">{s.cnpj}</TableCell>
                <TableCell className="text-slate-400 font-medium text-xs py-2.5 px-3">
                  <div className="break-words">{s.contact}</div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10" title="Editar"><Edit size={15} /></Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" 
                      title="Excluir Fornecedor"
                      onClick={() => {
                        deleteSupplier(s.id);
                        toast.success(`Fornecedor "${s.name}" excluído com sucesso!`);
                      }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
       </div>
       <Pagination
         currentPage={currentPage}
         totalPages={Math.ceil(filteredSuppliers.length / 15)}
         onPageChange={setCurrentPage}
         totalItems={filteredSuppliers.length}
         itemsPerPage={15}
       />
      </CardContent>
    </Card>
  );
}

function DistributionTab() {
  const { products, branches, createDistribution, distributions, productClassifications, settings } = useRamoxContext();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [distributionType, setDistributionType] = useState<'general' | 'epi'>('general');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState(false);
  const [viewingDistribution, setViewingDistribution] = useState<any | null>(null);
  const [printingEpiTerm, setPrintingEpiTerm] = useState<any | null>(null);

  // Submenu Tab: 'overview' (Painel Geral) vs 'tracking' (Acompanhamento por Filial)
  const [subTab, setSubTab] = useState<'overview' | 'tracking'>('overview');
  const [overviewPage, setOverviewPage] = useState(1);
  const [trackingPage, setTrackingPage] = useState(1);

  // Tracking Submenu Filters
  const [trackingBranchFilter, setTrackingBranchFilter] = useState<string>('all');
  const [trackingTypeFilter, setTrackingTypeFilter] = useState<'all' | 'general' | 'epi'>('all');
  const [trackingSearch, setTrackingSearch] = useState<string>('');

  // Modals for Printing Romaneio & Comprovante
  const [printingRomaneio, setPrintingRomaneio] = useState<{ distribution: any; selectedBranchId: string } | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<{ distribution: any; selectedBranchId: string } | null>(null);

  // 1. Selected Branches for this bulk distribution
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [branchSearch, setBranchSearch] = useState('');
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  // Recipient names per branch for EPI distribution: recipients[branchId] = recipientName
  const [recipients, setRecipients] = useState<Record<string, string>>({});

  // 2. Selected Products and Active Product view
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  // 3. Template quantity per product (for copy-to-all button)
  const [templateQuantities, setTemplateQuantities] = useState<Record<string, number>>({});

  // 4. Quantity allocations per product per branch: allocations[productId][branchId] = quantity
  const [allocations, setAllocations] = useState<Record<string, Record<string, number>>>({});

  // Catalog Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');

  // Open modal & initialize with all branches and specific distribution type
  const handleOpenNewDistribution = (type: 'general' | 'epi' = 'general') => {
    const allIds = branches.map(b => b.id);
    setDistributionType(type);
    setSelectedBranchIds(allIds);
    setSelectedProducts([]);
    setActiveProductId(null);
    setTemplateQuantities({});
    setAllocations({});
    setRecipients({});
    setBranchSearch('');
    setIsBranchesModalOpen(false);
    setIsCatalogOpen(false);
    setIsBranchDropdownOpen(false);
    setIsTypeDropdownOpen(false);
    setIsAddOpen(true);
  };

  // Branch Selector Helpers
  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranchIds(prev => 
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSelectAllBranches = () => {
    setSelectedBranchIds(branches.map(b => b.id));
  };

  const handleDeselectAllBranches = () => {
    setSelectedBranchIds([]);
  };

  // Helper to copy first branch recipient to all branches (EPI mode)
  const handleCopyRecipientToAll = (sourceBranchId: string) => {
    const name = recipients[sourceBranchId] || '';
    if (!name.trim()) {
      toast.error('Informe o nome da pessoa na filial de origem primeiro.');
      return;
    }
    const updated: Record<string, string> = {};
    selectedBranchIds.forEach(id => {
      updated[id] = name;
    });
    setRecipients(updated);
    toast.success(`Nome "${name}" aplicado para todas as filiais!`);
  };

  // Helper to prefill manager names
  const handleUseBranchManagers = () => {
    const updated: Record<string, string> = {};
    selectedBranchIds.forEach(id => {
      const b = branches.find(item => item.id === id);
      if (b && b.manager) {
        updated[id] = b.manager;
      }
    });
    setRecipients(prev => ({ ...prev, ...updated }));
    toast.success('Nomes dos gerentes das filiais preenchidos.');
  };

  // Product Selector Helpers
  const handleToggleProductInCatalog = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      const updated = selectedProducts.filter(id => id !== productId);
      setSelectedProducts(updated);
      if (activeProductId === productId) {
        setActiveProductId(updated.length > 0 ? updated[0] : null);
      }
    } else {
      const updated = [...selectedProducts, productId];
      setSelectedProducts(updated);
      setActiveProductId(productId);
    }
  };

  const handleRemoveProduct = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = selectedProducts.filter(id => id !== productId);
    setSelectedProducts(updated);
    if (activeProductId === productId) {
      setActiveProductId(updated.length > 0 ? updated[0] : null);
    }
  };

  // Copy Template Quantity to All Selected Branches
  const handleCopyTemplateToAllBranches = (productId: string) => {
    const qty = templateQuantities[productId] ?? 0;
    if (qty < 0) {
      toast.error('Informe uma quantidade válida.');
      return;
    }
    if (selectedBranchIds.length === 0) {
      toast.error('Nenhuma filial selecionada para aplicar.');
      return;
    }

    setAllocations(prev => {
      const currentProductAllocations = { ...(prev[productId] || {}) };
      selectedBranchIds.forEach(branchId => {
        currentProductAllocations[branchId] = qty;
      });
      return {
        ...prev,
        [productId]: currentProductAllocations
      };
    });

    toast.success(`Quantidade ${qty} copiada para as ${selectedBranchIds.length} filiais selecionadas!`);
  };

  // Manual Quantity Change per Branch
  const handleQuantityChange = (productId: string, branchId: string, quantity: number) => {
    setAllocations(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [branchId]: Math.max(0, quantity)
      }
    }));
  };

  // Submit Distribution
  const handleCreate = () => {
    if (selectedBranchIds.length === 0) {
      toast.error('Selecione pelo menos uma filial no dropdown de filiais.');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Inclua pelo menos um produto na distribuição através do catálogo.');
      return;
    }

    // Check if EPI distribution has recipient names
    if (distributionType === 'epi') {
      const missingRecipients = selectedBranchIds.filter(bId => {
        const hasAllocatedItems = selectedProducts.some(pId => (allocations[pId]?.[bId] || 0) > 0);
        return hasAllocatedItems && (!recipients[bId] || !recipients[bId].trim());
      });

      if (missingRecipients.length > 0) {
        toast.error('Informe o nome da pessoa que irá receber o EPI para todas as filiais com itens alocados.');
        return;
      }
    }

    const items = selectedProducts.map(productId => {
      const quantityPerBranch = selectedBranchIds.map(branchId => ({
        branchId,
        quantity: allocations[productId]?.[branchId] || 0,
        recipientName: distributionType === 'epi' ? (recipients[branchId] || '') : undefined
      })).filter(q => q.quantity > 0);

      return {
        productId,
        quantityPerBranch
      };
    }).filter(item => item.quantityPerBranch.length > 0);

    if (items.length === 0) {
      toast.error('Informe quantidades maiores que zero para pelo menos uma filial.');
      return;
    }

    createDistribution(items, distributionType, recipients);
    setIsAddOpen(false);
    toast.success(distributionType === 'epi' 
      ? 'Distribuição de EPIs registrada! Termos de recebimento prontos para emissão.' 
      : 'Distribuição em massa realizada com sucesso!'
    );
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) || 
    (b.location && b.location.toLowerCase().includes(branchSearch.toLowerCase()))
  );

  // Product filtering based on distribution type
  const filteredCatalogProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          p.code.toLowerCase().includes(catalogSearch.toLowerCase());
    
    // If distribution type is EPI, only show products in category EPI or EPIs
    if (distributionType === 'epi') {
      const isEpiCategory = p.category.toLowerCase().includes('epi');
      return matchesSearch && isEpiCategory;
    }

    const matchesCat = catalogCategory === 'all' || p.category === catalogCategory;
    return matchesSearch && matchesCat;
  });

  const activeProduct = products.find(p => p.id === activeProductId);

  // Computed tracking items for history per branch
  const branchHistoryItems = React.useMemo(() => {
    const list: Array<{
      dist: any;
      branchId: string;
      branchName: string;
      branchCode: string;
      branchManager: string;
      recipientName: string;
      products: Array<{ product: any; quantity: number }>;
      totalVariety: number;
      totalQty: number;
      createdAt: string;
    }> = [];

    distributions.forEach((d) => {
      const bIds = Array.from(
        new Set(d.items.flatMap((i: any) => i.quantityPerBranch.filter((q: any) => q.quantity > 0).map((q: any) => q.branchId)))
      ) as string[];

      bIds.forEach((bId) => {
        const branch = branches.find((b) => b.id === bId);
        const recipientName = d.recipients?.[bId] || branch?.manager || 'Gerente / Responsável';

        const branchProds: Array<{ product: any; quantity: number }> = [];
        let totalQty = 0;

        d.items.forEach((item: any) => {
          const qInfo = item.quantityPerBranch?.find((q: any) => q.branchId === bId);
          if (qInfo && qInfo.quantity > 0) {
            const prod = products.find((p) => p.id === item.productId);
            branchProds.push({ product: prod, quantity: qInfo.quantity });
            totalQty += qInfo.quantity;
          }
        });

        if (branchProds.length > 0) {
          list.push({
            dist: d,
            branchId: bId,
            branchName: branch?.name || `Filial #${bId}`,
            branchCode: branch?.code || `FL-${bId}`,
            branchManager: branch?.manager || 'Não atribuído',
            recipientName,
            products: branchProds,
            totalVariety: branchProds.length,
            totalQty,
            createdAt: d.createdAt
          });
        }
      });
    });

    return list.reverse();
  }, [distributions, branches, products]);

  // Filtered branch history items
  const filteredBranchHistory = branchHistoryItems.filter((item) => {
    const matchesBranch = trackingBranchFilter === 'all' || item.branchId === trackingBranchFilter;
    const matchesType = trackingTypeFilter === 'all' || item.dist.type === trackingTypeFilter;

    const query = trackingSearch.toLowerCase().trim();
    const matchesSearch = !query ||
      item.dist.id.toLowerCase().includes(query) ||
      item.branchName.toLowerCase().includes(query) ||
      item.branchCode.toLowerCase().includes(query) ||
      item.recipientName.toLowerCase().includes(query) ||
      item.products.some(p => p.product?.name?.toLowerCase().includes(query) || p.product?.code?.toLowerCase().includes(query));

    return matchesBranch && matchesType && matchesSearch;
  });

  React.useEffect(() => {
    setTrackingPage(1);
  }, [trackingBranchFilter, trackingTypeFilter, trackingSearch]);

  const reversedDistributions = distributions.slice().reverse();
  const paginatedDistributions = reversedDistributions.slice((overviewPage - 1) * 15, overviewPage * 15);
  const paginatedBranchHistory = filteredBranchHistory.slice((trackingPage - 1) * 15, trackingPage * 15);

  const handlePrintDocument = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Error triggering browser print:', err);
      toast.error('Não foi possível acionar a impressão direta. Utilize a opção "Exportar PDF".');
    }
  };

  return (
    <div className="space-y-6">
      {/* NAVEGAÇÃO DE SUBMENU DE DISTRIBUIÇÃO EM MASSA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('overview')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              subTab === 'overview'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers size={16} />
            <span>Painel Geral de Lançamentos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('tracking')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              subTab === 'tracking'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Truck size={16} />
            <span>Acompanhamento por Filial</span>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px] font-bold">
              Romaneios & Comprovantes
            </Badge>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium px-2 hidden md:block">
          {subTab === 'overview'
            ? 'Visão consolidada de distribuições em lote'
            : 'Histórico individualizado por filial com romaneio e comprovante de entrega'}
        </div>
      </div>

      {/* VISÃO 1: PAINEL GERAL DE LANÇAMENTOS (OVERVIEW) */}
      {subTab === 'overview' && (
        <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Painel de Distribuição em Massa</h3>
              <p className="text-sm text-slate-400 font-medium tracking-wide">Distribua lotes de mercadorias gerais ou EPIs com emissão de termo de entrega para as 40 filiais.</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportExcelModal
                title="Exportar Registros de Distribuição"
                description="Exporte os lançamentos de distribuição de estoque para as filiais."
                data={distributions.map(d => ({
                  IDDistribuição: d.id.toUpperCase(),
                  Tipo: d.type === 'epi' ? 'EPIs' : 'Geral',
                  Data: new Date(d.createdAt).toLocaleDateString('pt-BR'),
                  TotalItens: d.items.length,
                  TotalFiliaisAtendidas: new Set(d.items.flatMap(i => i.quantityPerBranch.map(q => q.branchId))).size
                }))}
                defaultFilename="distribuicao_mercadorias"
                sheetName="Distribuicao"
                columns={[
                  { key: 'IDDistribuição', label: 'ID Distribuição' },
                  { key: 'Tipo', label: 'Tipo de Distribuição' },
                  { key: 'Data', label: 'Data de Lançamento' },
                  { key: 'TotalItens', label: 'Variedade de Produtos' },
                  { key: 'TotalFiliaisAtendidas', label: 'Filiais Atendidas' },
                ]}
              />

              {/* DROPDOWN DE TIPO DE DISTRIBUIÇÃO */}
              <div className="relative">
                <Button 
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-white h-11 px-6 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] font-bold border-none flex items-center gap-2"
                >
                  <Share2 size={18} /> 
                  <span>Nova Distribuição em Massa</span>
                  <ChevronDown size={16} className={`transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isTypeDropdownOpen && (
                  <div className="absolute right-0 top-13 z-50 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => handleOpenNewDistribution('general')}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-800 flex items-start gap-3 transition-colors text-slate-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">Distribuição Geral</p>
                        <p className="text-[11px] text-slate-400">Mercadorias, estoque e insumos operacionais.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenNewDistribution('epi')}
                      className="w-full text-left p-3 rounded-lg hover:bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 transition-colors text-slate-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                          Distribuição de EPIs
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px]">Com Termo</Badge>
                        </p>
                        <p className="text-[11px] text-slate-400">Equipamentos de Proteção com documento de assinatura.</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">ID / Tipo</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Itens Distribuídos</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Filiais Atendidas</TableHead>
                    <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDistributions.map((d) => {
                    const totalBranches = new Set();
                    d.items.forEach(item => item.quantityPerBranch.forEach(q => totalBranches.add(q.branchId)));
                    const isEpi = d.type === 'epi';

                    return (
                      <TableRow key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-cyan-500">#{d.id.toUpperCase()}</span>
                            {isEpi ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-[10px] w-fit gap-1">
                                <ShieldCheck size={12} /> EPIs (Com Termo)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-400 border-slate-700 text-[10px] w-fit">
                                📦 Mercadorias
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 font-medium">{new Date(d.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {d.items.map(item => {
                              const product = products.find(p => p.id === item.productId);
                              const totalQty = item.quantityPerBranch.reduce((acc, q) => acc + q.quantity, 0);
                              return (
                                <Badge key={item.productId} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300 gap-1">
                                  <span>{product?.name || 'Produto'}</span>
                                  <span className="text-cyan-400 font-bold">({totalQty} {product?.unit || 'un'})</span>
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                            {totalBranches.size} Filiais
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEpi && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-1.5"
                                onClick={() => setPrintingEpiTerm({ distribution: d, selectedBranchId: 'all' })}
                              >
                                <FileText size={14} /> Termo EPI
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                              onClick={() => setViewingDistribution(d)}
                            >
                              <Eye size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {distributions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-slate-500 font-medium">
                        Nenhum registro de distribuição em massa efetuado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              currentPage={overviewPage}
              totalPages={Math.ceil(distributions.length / 15)}
              onPageChange={setOverviewPage}
              totalItems={distributions.length}
              itemsPerPage={15}
            />
          </CardContent>
        </Card>
      )}

      {/* VISÃO 2: SUBMENU DE ACOMPANHAMENTO POR FILIAL (TRACKING) */}
      {subTab === 'tracking' && (
        <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Truck className="text-cyan-400" size={24} />
                Acompanhamento de Distribuições por Filial
              </h3>
              <p className="text-sm text-slate-400 font-medium tracking-wide">
                Consulte o histórico individualizado por filial com acesso ao Romaneio de Envio e Comprovante de Entrega.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ExportExcelModal
                title="Exportar Histórico de Distribuições por Filial"
                description="Relatório detalhado das entregas de mercadorias e EPIs por sucursal."
                data={filteredBranchHistory.map(item => ({
                  IDDistribuição: item.dist.id.toUpperCase(),
                  Filial: item.branchName,
                  CodigoFilial: item.branchCode,
                  GerenteRecebedor: item.recipientName,
                  Tipo: item.dist.type === 'epi' ? 'EPIs (Com Termo)' : 'Geral',
                  DataEnvio: new Date(item.createdAt).toLocaleDateString('pt-BR'),
                  VariedadeProdutos: item.totalVariety,
                  TotalUnidades: item.totalQty,
                  ProdutosResumo: item.products.map(p => `${p.product?.name || 'Item'} (${p.quantity} un)`).join(', ')
                }))}
                defaultFilename="acompanhamento_distribuicao_filiais"
                sheetName="Acompanhamento"
                columns={[
                  { key: 'IDDistribuição', label: 'ID Lote' },
                  { key: 'Filial', label: 'Filial Destino' },
                  { key: 'CodigoFilial', label: 'Código' },
                  { key: 'GerenteRecebedor', label: 'Recebedor' },
                  { key: 'Tipo', label: 'Tipo' },
                  { key: 'DataEnvio', label: 'Data Lançamento' },
                  { key: 'VariedadeProdutos', label: 'Variedades' },
                  { key: 'TotalUnidades', label: 'Total Qtd' },
                  { key: 'ProdutosResumo', label: 'Itens Entregues' },
                ]}
              />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* BARRA DE FILTROS DO ACOMPANHAMENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {/* Filtro de Filial */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-cyan-400" />
                  Filial (40 Unidades)
                </label>
                <SearchableSelect
                  value={trackingBranchFilter}
                  onChange={setTrackingBranchFilter}
                  placeholder="Todas as 40 Filiais"
                  searchPlaceholder="Digite nome ou código da filial..."
                  options={[
                    { value: 'all', label: 'Todas as 40 Filiais' },
                    ...branches.map(b => ({
                      value: b.id,
                      label: b.name,
                      code: b.code,
                      sublabel: b.location
                    }))
                  ]}
                />
              </div>

              {/* Filtro de Tipo */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={13} className="text-cyan-400" />
                  Modalidade
                </label>
                <select
                  value={trackingTypeFilter}
                  onChange={(e) => setTrackingTypeFilter(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="general">📦 Mercadorias Gerais</option>
                  <option value="epi">🛡️ EPIs (Com Termo)</option>
                </select>
              </div>

              {/* Campo de Pesquisa */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search size={13} className="text-cyan-400" />
                  Pesquisar por Lote, Produto ou Filial
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                  <Input
                    value={trackingSearch}
                    onChange={(e) => setTrackingSearch(e.target.value)}
                    placeholder="Digite o ID #DIST-..., nome da loja ou produto..."
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-xs h-9 rounded-lg"
                  />
                  {trackingSearch && (
                    <button
                      type="button"
                      onClick={() => setTrackingSearch('')}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TABELA DE REGISTROS POR FILIAL */}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 bg-slate-950/80 hover:bg-transparent">
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Protocolo / Data</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Filial Destino</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Itens Entregues</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">Volume Total</TableHead>
                    <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Documentos de Acompanhamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBranchHistory.map((item, index) => {
                    const isEpi = item.dist.type === 'epi';

                    return (
                      <TableRow key={`${item.dist.id}-${item.branchId}-${index}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-cyan-400">#{item.dist.id.toUpperCase()}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                            {isEpi ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-[9px] w-fit gap-1">
                                <ShieldCheck size={10} /> EPIs
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-400 border-slate-700 text-[9px] w-fit">
                                📦 Geral
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white text-sm flex items-center gap-1.5">
                              <Building2 size={14} className="text-cyan-400 shrink-0" />
                              {item.branchName}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <User size={12} className="text-slate-500" />
                              Recebedor: <strong className="text-slate-300">{item.recipientName}</strong>
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {item.products.map(({ product, quantity }) => (
                              <Badge key={product?.id || Math.random()} variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-300 gap-1 text-[11px]">
                                <span className="font-medium">{product?.name || 'Produto'}</span>
                                <strong className="text-cyan-400 font-bold">({quantity} {product?.unit || 'un'})</strong>
                              </Badge>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold">
                              {item.totalQty} un.
                            </Badge>
                            <span className="text-[10px] text-slate-500 mt-0.5">({item.totalVariety} variações)</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* BOTAO ROMANEIO DE ENVIO */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPrintingRomaneio({ distribution: item.dist, selectedBranchId: item.branchId })}
                              className="h-8 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs gap-1.5 shadow-sm"
                            >
                              <Truck size={14} className="text-cyan-400" />
                              <span>Romaneio</span>
                            </Button>

                            {/* BOTAO COMPROVANTE DA FILIAL */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPrintingReceipt({ distribution: item.dist, selectedBranchId: item.branchId })}
                              className="h-8 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs gap-1.5 shadow-sm"
                            >
                              <FileText size={14} className="text-emerald-400" />
                              <span>Comprovante</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {filteredBranchHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-slate-500 font-medium">
                        Nenhum registro de distribuição por filial encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              currentPage={trackingPage}
              totalPages={Math.ceil(filteredBranchHistory.length / 15)}
              onPageChange={setTrackingPage}
              totalItems={filteredBranchHistory.length}
              itemsPerPage={15}
            />
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: CRIAR DISTRIBUIÇÃO EM MASSA (GERAL OU EPI) */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[1100px] bg-slate-900 border-slate-800 text-white rounded-xl shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
          <DialogHeader className="p-6 bg-slate-950 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  {distributionType === 'epi' ? (
                    <>
                      <ShieldCheck className="text-emerald-400" size={26} />
                      Criar Distribuição de EPIs (Equipamentos de Proteção)
                    </>
                  ) : (
                    <>
                      <Share2 className="text-cyan-400" size={26} />
                      Criar Distribuição Geral em Massa
                    </>
                  )}
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-1">
                  {distributionType === 'epi' 
                    ? 'Selecione as filiais, informe o recebedor de cada local e escolha os EPIs para gerar o termo de recebimento.' 
                    : 'Selecione as filiais participantes, inclua produtos do catálogo e configure as quantidades.'}
                </p>
              </div>

              {/* TABS DE ALTERNÂNCIA DE TIPO DENTRO DA MODAL */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDistributionType('general')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    distributionType === 'general' 
                      ? 'bg-cyan-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Package size={14} /> Distribuição Geral
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionType('epi')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    distributionType === 'epi' 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck size={14} /> Distribuição de EPIs
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* INFORMATIVO DO TIPO EPI QUANDO SELECIONADO */}
            {distributionType === 'epi' && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-emerald-200/90 space-y-1">
                  <p className="font-bold text-emerald-300">Modo de Distribuição de EPIs Ativo</p>
                  <p>• O catálogo exibirá exclusivamente produtos pertencentes à categoria <strong>EPIs</strong>.</p>
                  <p>• Informe o nome do beneficiário/colaborador recebedor em cada filial para gerar automaticamente o <strong>Termo de Recebimento de EPI</strong> assinado.</p>
                </div>
              </div>
            )}

            {/* ETAPA 1: BOTÕES "FILIAIS" E "CATÁLOGO DE PRODUTOS" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
              {/* BOTÃO FILIAIS */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2"><Building2 size={16} /> 1. Filiais Participantes</span>
                  <span className="text-slate-400 font-normal">({selectedBranchIds.length} de {branches.length})</span>
                </Label>

                <Button
                  type="button"
                  onClick={() => setIsBranchesModalOpen(true)}
                  className="w-full h-14 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-cyan-500/60 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-between px-5 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all">
                      <Building2 size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-bold text-white leading-tight">Filiais</p>
                      <p className="text-xs text-slate-400">
                        {selectedBranchIds.length === 0 
                          ? 'Nenhuma filial selecionada' 
                          : selectedBranchIds.length === branches.length 
                          ? `Todas as ${branches.length} filiais selecionadas` 
                          : `${selectedBranchIds.length} filiais selecionadas`}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs px-3 py-1 font-bold">
                    {selectedBranchIds.length} Filiais
                  </Badge>
                </Button>
              </div>

              {/* BOTÃO CATÁLOGO DE PRODUTOS */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2"><Package size={16} /> 2. Produtos do Catálogo</span>
                  <span className="text-slate-400 font-normal">({selectedProducts.length} itens)</span>
                </Label>

                <Button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className={`w-full h-14 text-white font-bold rounded-xl shadow-md border-none transition-all flex items-center justify-between px-5 ${
                    distributionType === 'epi' 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20' 
                      : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
                      <Package size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-bold text-white leading-tight">Catálogo de Produtos</p>
                      <p className="text-xs text-white/80">
                        {selectedProducts.length === 0 ? 'Clique para selecionar produtos' : `${selectedProducts.length} produtos incluídos`}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-white text-slate-950 text-xs px-3 py-1 font-extrabold">
                    {selectedProducts.length} Itens
                  </Badge>
                </Button>
              </div>
            </div>

            {/* ETAPA 2 & 3: VISÃO DOS PRODUTOS INCLUÍDOS E QUANTIDADES POR FILIAL */}
            {selectedProducts.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 space-y-4 bg-slate-950/20">
                <Package size={48} className="mx-auto text-slate-700 opacity-60" />
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-300">Nenhum produto incluído na distribuição</p>
                  <p className="text-xs text-slate-500">
                    {distributionType === 'epi'
                      ? 'Clique no botão "Catálogo de Produtos" acima para escolher os EPIs.'
                      : 'Clique no botão "Catálogo de Produtos" acima para selecionar os itens a serem distribuídos.'}
                  </p>
                </div>
                <Button 
                  onClick={() => setIsCatalogOpen(true)} 
                  variant="outline" 
                  className={`font-bold ${distributionType === 'epi' ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10' : 'border-slate-700 text-cyan-400 hover:bg-cyan-500/10'}`}
                >
                  <Plus size={16} className="mr-2" /> Abrir Catálogo de Produtos
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LISTA LATERAL DE PRODUTOS SELECIONADOS */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                        Produtos Incluídos ({selectedProducts.length})
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-6 text-[10px] font-bold ${distributionType === 'epi' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-cyan-400 hover:bg-cyan-500/10'}`}
                        onClick={() => setIsCatalogOpen(true)}
                      >
                        <Plus size={12} className="mr-1" /> Mais Produtos
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                      {selectedProducts.map(productId => {
                        const prod = products.find(p => p.id === productId);
                        const isSelected = activeProductId === productId;
                        const productAlloc = allocations[productId] || {};
                        const totalAllocated = Object.values(productAlloc).reduce((a, b) => (a as number) + (b as number), 0) as number;

                        return (
                          <div
                            key={productId}
                            onClick={() => setActiveProductId(productId)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? distributionType === 'epi'
                                  ? 'bg-emerald-500/10 border-emerald-500/60 text-white shadow-lg'
                                  : 'bg-cyan-500/10 border-cyan-500/60 text-white shadow-lg' 
                                : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400 border border-slate-800 flex-shrink-0">
                                {prod?.image ? (
                                  <img src={prod.image} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package size={18} />
                                )}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-sm truncate">{prod?.name}</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-mono text-cyan-500/80">{prod?.code}</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-400">Distribuído: <strong className={distributionType === 'epi' ? 'text-emerald-400' : 'text-cyan-400'}>{totalAllocated}</strong> {prod?.unit}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex-shrink-0"
                              onClick={(e) => handleRemoveProduct(productId, e)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PAINEL PRINCIPAL DO PRODUTO ATIVO */}
                  <div className="lg:col-span-8 bg-slate-950/60 p-6 rounded-xl border border-slate-800 space-y-6">
                    {activeProduct ? (
                      <>
                        {/* HEADER DO PRODUTO ATIVO */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-md">
                              {activeProduct.image ? (
                                <img src={activeProduct.image} alt="" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                              ) : (
                                <Package size={24} />
                              )}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">{activeProduct.name}</h4>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                <span className="font-mono font-bold text-cyan-400">{activeProduct.code}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-[10px] bg-slate-900 border-slate-800 text-slate-300">
                                  {activeProduct.category}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Estoque Central</p>
                              <p className="text-sm font-bold text-emerald-400">{activeProduct.currentStock} {activeProduct.unit}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-800" />
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Alocado</p>
                              <p className={`text-sm font-bold ${distributionType === 'epi' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                {Object.values(allocations[activeProduct.id] || {}).reduce((a, b) => (a as number) + (b as number), 0)} {activeProduct.unit}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CAMPO DE QUANTIDADE EM CIMA COM BOTÃO COPIAR PARA TODAS AS FILIAIS */}
                        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 p-4 rounded-xl border border-slate-700 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                              <Copy size={14} /> Quantidade Padrão para Copiar em Massa
                            </Label>
                            <span className="text-[11px] text-slate-400">
                              Aplica a quantidade a todas as <strong>{selectedBranchIds.length}</strong> filiais
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative w-full sm:w-48">
                              <Input
                                type="number"
                                min="0"
                                placeholder="Digite a qtd..."
                                className="h-11 bg-slate-950 border-slate-700 focus:border-cyan-400 text-white font-bold text-lg"
                                value={templateQuantities[activeProduct.id] ?? ''}
                                onChange={e => setTemplateQuantities({
                                  ...templateQuantities,
                                  [activeProduct.id]: Math.max(0, Number(e.target.value))
                                })}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                                {activeProduct.unit}
                              </span>
                            </div>

                            <Button
                              type="button"
                              onClick={() => handleCopyTemplateToAllBranches(activeProduct.id)}
                              className={`w-full sm:w-auto h-11 text-white font-bold px-6 rounded-lg border-none flex items-center justify-center gap-2 ${
                                distributionType === 'epi' 
                                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/20' 
                                  : 'bg-cyan-500 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                              }`}
                            >
                              <Copy size={16} />
                              <span>Copiar para Todas ({selectedBranchIds.length} Filiais)</span>
                            </Button>
                          </div>
                        </div>

                        {/* AVISO E FERRAMENTAS DE RECEBEDOR PARA EPI */}
                        {distributionType === 'epi' && (
                          <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <span className="text-emerald-300 font-medium flex items-center gap-2">
                              <User size={15} /> Preencha o nome de quem receberá o EPI na frente de cada filial:
                            </span>
                            <div className="flex items-center gap-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={handleUseBranchManagers}
                                className="h-7 text-[10px] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-bold"
                              >
                                Usar Gerentes de Loja
                              </Button>
                              {selectedBranchIds.length > 0 && recipients[selectedBranchIds[0]] && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleCopyRecipientToAll(selectedBranchIds[0])}
                                  className="h-7 text-[10px] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-bold"
                                >
                                  Copiar 1º Nome para Todos
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* LISTA DE FILIAIS SELECIONADAS COM CAMPOS DE QUANTIDADE E RECEBEDOR */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                              Configuração por Filial ({selectedBranchIds.length} Filiais)
                            </Label>
                            <span className="text-[10px] text-slate-500">Edite as quantidades e nomes individualmente abaixo.</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {selectedBranchIds.map(branchId => {
                              const branch = branches.find(b => b.id === branchId);
                              const currentQty = allocations[activeProduct.id]?.[branchId] ?? 0;

                              return (
                                <div
                                  key={branchId}
                                  className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                                    currentQty > 0 
                                      ? distributionType === 'epi'
                                        ? 'bg-slate-900 border-emerald-500/40 shadow-sm'
                                        : 'bg-slate-900 border-cyan-500/40 shadow-sm' 
                                      : 'bg-slate-950/50 border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-200 truncate block">
                                      {branch?.name || 'Filial'}
                                    </Label>
                                    {branch?.manager && (
                                      <span className="text-[10px] text-slate-500">Gerente: {branch.manager}</span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    {/* CAMPO DE QUANTIDADE */}
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Qtd..."
                                        className="h-10 bg-slate-950 border-slate-700 text-white font-bold text-sm focus:border-cyan-400"
                                        value={allocations[activeProduct.id]?.[branchId] ?? ''}
                                        onChange={e => handleQuantityChange(activeProduct.id, branchId, Number(e.target.value))}
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                                        {activeProduct.unit}
                                      </span>
                                    </div>

                                    {/* CAMPO DE RECEBEDOR DO EPI */}
                                    {distributionType === 'epi' && (
                                      <div className="relative">
                                        <Input
                                          type="text"
                                          placeholder="Nome da pessoa que vai receber o EPI..."
                                          className="h-9 bg-slate-950 border-emerald-500/30 text-emerald-200 text-xs focus:border-emerald-400 pl-8"
                                          value={recipients[branchId] || ''}
                                          onChange={e => setRecipients({ ...recipients, [branchId]: e.target.value })}
                                        />
                                        <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500/70" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {selectedBranchIds.length === 0 && (
                              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                                Nenhuma filial selecionada no botão "Filiais" acima.
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-20 text-center text-slate-500 space-y-2">
                        <Package size={36} className="mx-auto text-slate-700" />
                        <p className="text-sm font-medium">Selecione um produto na lista à esquerda para configurar suas quantidades.</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* RESUMO NA PARTE INFERIOR PARA AJUSTES DE QUANTIDADE */}
                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <FileText size={18} className="text-cyan-400" />
                        Resumo da Distribuição & Consolidado de Quantidades
                      </h4>
                      <p className="text-xs text-slate-400">
                        Visão sintética das quantidades totais alocadas por produto e validação de estoque central.
                      </p>
                    </div>
                    <Badge className="bg-slate-900 border-slate-700 text-slate-300 text-xs font-mono self-start sm:self-auto">
                      {selectedBranchIds.length} Filiais Participantes
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-800 hover:bg-transparent text-[11px] font-bold uppercase text-slate-400">
                          <TableHead className="text-slate-400">Produto</TableHead>
                          <TableHead className="text-slate-400">Estoque Central</TableHead>
                          <TableHead className="text-slate-400">Filiais Atendidas</TableHead>
                          <TableHead className="text-slate-400">Total Alocado</TableHead>
                          <TableHead className="text-slate-400">Status do Estoque</TableHead>
                          <TableHead className="text-right text-slate-400">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.map(pId => {
                          const prod = products.find(p => p.id === pId);
                          const productAlloc = allocations[pId] || {};
                          const totalQty = Object.values(productAlloc).reduce((a, b) => (a as number) + (b as number), 0) as number;
                          const branchesCount = Object.values(productAlloc).filter(v => (v as number) > 0).length;
                          const stockExceeded = totalQty > (prod?.currentStock || 0);

                          return (
                            <TableRow key={pId} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                                    {prod?.image ? (
                                      <img src={prod.image} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Package size={16} />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-xs text-white">{prod?.name}</p>
                                    <p className="text-[10px] font-mono text-cyan-400">{prod?.code}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-bold text-emerald-400">
                                {prod?.currentStock} {prod?.unit}
                              </TableCell>
                              <TableCell className="text-xs text-slate-300">
                                {branchesCount} de {selectedBranchIds.length} filiais
                              </TableCell>
                              <TableCell className="text-xs font-extrabold text-cyan-300">
                                {totalQty} {prod?.unit}
                              </TableCell>
                              <TableCell>
                                {stockExceeded ? (
                                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-bold gap-1">
                                    <AlertCircle size={12} /> Excede o Estoque Central
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-bold gap-1">
                                    <CheckCircle2 size={12} /> Estoque Suficiente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setActiveProductId(pId)}
                                    className={`h-7 text-[11px] font-bold ${activeProductId === pId ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'}`}
                                  >
                                    Ajustar Qtds
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => handleRemoveProduct(pId, e)}
                                    className="h-7 w-7 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleCreate}
              disabled={selectedProducts.length === 0 || selectedBranchIds.length === 0}
              className={`font-bold px-8 h-11 rounded-lg shadow-lg border-none text-white ${
                distributionType === 'epi'
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20'
              }`}
            >
              {distributionType === 'epi' ? 'Confirmar e Lançar Distribuição de EPIs' : 'Confirmar e Lançar Distribuição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: SELEÇÃO DE FILIAIS (CENTRALIZADO NA TELA) */}
      <Dialog open={isBranchesModalOpen} onOpenChange={setIsBranchesModalOpen}>
        <DialogContent className="w-[96vw] max-w-7xl h-[92vh] max-h-[92vh] bg-slate-950 border border-slate-800 text-white p-0 flex flex-col z-[100] rounded-xl shadow-2xl overflow-hidden">
          {/* HEADER COMPACTO */}
          <DialogHeader className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="text-cyan-400 flex-shrink-0" size={18} />
                <DialogTitle className="text-sm sm:text-base font-bold text-white">
                  Seleção de Filiais Cadastradas ({branches.length} Filiais)
                </DialogTitle>
              </div>

              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[11px] px-2.5 py-0.5 font-bold flex gap-1.5 items-center flex-shrink-0">
                <CheckSquare size={13} />
                <span>{selectedBranchIds.length} de {branches.length} Selecionadas</span>
              </Badge>
            </div>
          </DialogHeader>

          {/* BARRA DE PESQUISA E BOTÕES COMPACTOS */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row gap-2 items-center justify-between flex-shrink-0">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <Input
                placeholder="Buscar filial por nome ou código..."
                className="pl-8 h-8 text-xs bg-slate-950 border-slate-700 text-white font-medium rounded-lg"
                value={branchSearch}
                onChange={e => setBranchSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectAllBranches}
                className="h-8 px-3 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-bold text-[11px] gap-1.5 rounded-lg"
              >
                <CheckSquare size={13} />
                Marcar Todas ({branches.length})
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDeselectAllBranches}
                className="h-8 px-3 border-slate-700 text-slate-400 hover:bg-slate-800 font-bold text-[11px] gap-1.5 rounded-lg"
              >
                <Square size={13} />
                Desmarcar Todas
              </Button>
            </div>
          </div>

          {/* LISTA DE FILIAIS EM GRID/LISTA DE ALTA DENSIDADE (FONT SIZE 12PX) */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-950">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {filteredBranches.map(branch => {
                const isSelected = selectedBranchIds.includes(branch.id);
                return (
                  <div
                    key={branch.id}
                    onClick={() => toggleBranchSelection(branch.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200 font-semibold shadow-sm'
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                        isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'bg-slate-950 border-slate-700 text-transparent'
                      }`}>
                        <Check size={10} strokeWidth={3.5} />
                      </div>

                      <span className="text-[12px] leading-tight truncate font-medium">
                        {branch.name}
                      </span>
                    </div>

                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                      isSelected ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'
                    }`}>
                      {isSelected ? '✓ Selecionada' : 'Não selecionada'}
                    </span>
                  </div>
                );
              })}
            </div>

            {filteredBranches.length === 0 && (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Building2 size={32} className="mx-auto opacity-40 text-slate-600" />
                <p className="text-xs font-bold text-slate-400">Nenhuma filial encontrada para "{branchSearch}".</p>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex justify-between items-center flex-shrink-0">
            <div className="text-xs font-medium text-slate-300">
              <strong className="text-cyan-400 text-sm">{selectedBranchIds.length}</strong> filiais selecionadas para esta distribuição
            </div>

            <Button
              onClick={() => setIsBranchesModalOpen(false)}
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-5 h-9 text-xs rounded-lg shadow-md shadow-cyan-500/20 border-none gap-1.5"
            >
              <Check size={16} />
              Confirmar Seleção de Filiais
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CATÁLOGO DE PRODUTOS (CENTRALIZADO NA TELA) */}
      <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
        <DialogContent className="w-[96vw] max-w-7xl h-[90vh] max-h-[90vh] bg-slate-950 border border-slate-800 text-white p-0 flex flex-col z-[100] rounded-2xl shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-slate-900/90 border-b border-slate-800 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <Package className={distributionType === 'epi' ? 'text-emerald-400' : 'text-cyan-400'} size={28} />
                  Catálogo de Produtos {distributionType === 'epi' && '(Modo EPIs)'}
                </DialogTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Selecione os produtos do catálogo para incluir na distribuição em massa.
                </p>
              </div>

              <Badge className={`text-sm px-4 py-2 font-bold flex gap-2 items-center self-start sm:self-auto ${
                distributionType === 'epi' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}>
                <Package size={16} />
                <span>{selectedProducts.length} Produtos Incluídos</span>
              </Badge>
            </div>
          </DialogHeader>

          {/* BUSCA E FILTROS DO CATÁLOGO */}
          <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <Input
                placeholder="Buscar produto por nome, código ou categoria..."
                className="pl-11 h-11 bg-slate-950 border-slate-700 text-white font-medium"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
              />
            </div>

            {distributionType !== 'epi' && (
              <Select value={catalogCategory} onValueChange={setCatalogCategory}>
                <SelectTrigger className="w-full sm:w-64 h-11 bg-slate-950 border-slate-700 text-slate-200 font-bold">
                  <SelectValue placeholder="Todas as Classificações" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                  <SelectItem value="all">Todas Classificações</SelectItem>
                  {(productClassifications || []).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* QUADRO COM TODOS OS PRODUTOS OCUPANDO TODA A TELA */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCatalogProducts.map(p => {
                const isIncluded = selectedProducts.includes(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleProductInCatalog(p.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                      isIncluded 
                        ? distributionType === 'epi'
                          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-xl ring-2 ring-emerald-500/50'
                          : 'bg-cyan-500/15 border-cyan-500 text-white shadow-xl ring-2 ring-cyan-500/50' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                        ) : (
                          <Package size={22} />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="font-bold text-sm text-white truncate">{p.name}</h5>
                        <p className="text-xs font-mono text-cyan-400 font-bold">{p.code}</p>
                        <Badge variant="outline" className="text-[9px] bg-slate-900 border-slate-800 text-slate-400 mt-1">
                          {p.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                      <span className="text-slate-400">Estoque Central: <strong className="text-emerald-400 font-bold">{p.currentStock} {p.unit}</strong></span>

                      {isIncluded ? (
                        <Badge className={`text-white font-bold gap-1 ${distributionType === 'epi' ? 'bg-emerald-500' : 'bg-cyan-500'}`}>
                          <Check size={12} /> Incluído
                        </Badge>
                      ) : (
                        <Button size="sm" variant="ghost" className={`h-7 text-[11px] font-bold ${distributionType === 'epi' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-cyan-400 hover:bg-cyan-500/10'}`}>
                          + Incluir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCatalogProducts.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500 space-y-2">
                  <Package size={44} className="mx-auto opacity-50 text-slate-600" />
                  <p className="font-medium text-slate-400 text-base">Nenhum produto encontrado.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-5 bg-slate-900 border-t border-slate-800 flex justify-between items-center flex-shrink-0">
            <span className="text-sm text-slate-300 font-medium">
              <strong className="text-cyan-400 text-base">{selectedProducts.length}</strong> produtos incluídos para distribuição
            </span>

            <Button
              onClick={() => setIsCatalogOpen(false)}
              className={`font-bold px-8 h-12 text-base rounded-xl shadow-lg border-none text-white gap-2 ${
                distributionType === 'epi' ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20' : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20'
              }`}
            >
              <Check size={20} />
              Finalizar Inclusão & Ajustar Quantidades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: VISUALIZAR DETALHES DA DISTRIBUIÇÃO REALIZADA */}
      {viewingDistribution && (
        <Dialog open={!!viewingDistribution} onOpenChange={() => setViewingDistribution(null)}>
          <DialogContent className="sm:max-w-[750px] bg-slate-900 border-slate-800 text-white rounded-xl shadow-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Eye className="text-cyan-400" size={20} />
                    Detalhes da Distribuição #{viewingDistribution.id.toUpperCase()}
                  </DialogTitle>
                  <p className="text-xs text-slate-400">
                    Lançada em {new Date(viewingDistribution.createdAt).toLocaleDateString('pt-BR')} às {new Date(viewingDistribution.createdAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
                {viewingDistribution.type === 'epi' && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    🛡️ Distribuição de EPIs
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {viewingDistribution.items.map((item: any, idx: number) => {
                const prod = products.find(p => p.id === item.productId);
                const totalQty = item.quantityPerBranch.reduce((acc: number, q: any) => acc + q.quantity, 0);

                return (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-3">
                        <Package className="text-cyan-400" size={20} />
                        <div>
                          <h5 className="font-bold text-sm text-white">{prod?.name || 'Produto'}</h5>
                          <p className="text-xs font-mono text-cyan-400">{prod?.code}</p>
                        </div>
                      </div>
                      <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                        Total: {totalQty} {prod?.unit || 'un'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {item.quantityPerBranch.map((q: any) => {
                        const br = branches.find(b => b.id === q.branchId);
                        const recipient = q.recipientName || viewingDistribution.recipients?.[q.branchId];

                        return (
                          <div key={q.branchId} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300 font-bold truncate">{br?.name || 'Filial'}</span>
                              <strong className="text-cyan-400 font-bold ml-2">{q.quantity} {prod?.unit || 'un'}</strong>
                            </div>
                            {recipient && (
                              <div className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1 border-t border-slate-800">
                                <User size={12} />
                                <span>Recebedor: <strong>{recipient}</strong></span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SEÇÃO DE TERMOS INDIVIDUAIS POR FILIAL SE FOR DISTRIBUIÇÃO DE EPI */}
            {viewingDistribution.type === 'epi' && (
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                <h6 className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} /> Termos Únicos por Sucursal / Persona:
                </h6>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from(new Set(viewingDistribution.items.flatMap((i: any) => i.quantityPerBranch.map((q: any) => q.branchId)))).map((bId: any) => {
                    const br = branches.find(b => b.id === bId);
                    const recipient = viewingDistribution.recipients?.[bId] || br?.manager || 'Recebedor';
                    return (
                      <Button
                        key={bId}
                        variant="outline"
                        size="sm"
                        className="h-10 justify-between border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs"
                        onClick={() => {
                          setPrintingEpiTerm({ distribution: viewingDistribution, selectedBranchId: bId });
                          setViewingDistribution(null);
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building2 size={14} className="text-emerald-400" />
                          <span className="truncate">{br?.name || 'Filial'}</span>
                          <span className="text-[10px] text-slate-400">({recipient})</span>
                        </div>
                        <FileText size={14} className="text-emerald-400 flex-shrink-0 ml-2" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-between items-center pt-4">
              {viewingDistribution.type === 'epi' ? (
                <Button 
                  onClick={() => {
                    setPrintingEpiTerm({ distribution: viewingDistribution, selectedBranchId: 'all' });
                    setViewingDistribution(null);
                  }} 
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold gap-2"
                >
                  <FileText size={16} /> Imprimir Todos os Termos de EPI
                </Button>
              ) : <div />}

              <Button onClick={() => setViewingDistribution(null)} className="bg-slate-800 text-white hover:bg-slate-700 font-bold">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 4: IMPRESSÃO DO TERMO DE RECEBIMENTO DE EPI POR SUCURSAL */}
      {printingEpiTerm && (() => {
        const dist = printingEpiTerm.distribution;
        const allBranchIds = Array.from(
          new Set(dist.items.flatMap((i: any) => i.quantityPerBranch.map((q: any) => q.branchId)))
        ) as string[];

        const activeBranchId = printingEpiTerm.selectedBranchId && printingEpiTerm.selectedBranchId !== 'all'
          ? printingEpiTerm.selectedBranchId
          : 'all';

        const displayBranchIds = activeBranchId === 'all'
          ? allBranchIds
          : allBranchIds.filter(id => id === activeBranchId);

        return (
          <Dialog open={!!printingEpiTerm} onOpenChange={() => setPrintingEpiTerm(null)}>
            <DialogContent className="sm:max-w-[850px] bg-white text-slate-900 rounded-xl shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
              <DialogHeader className="p-5 bg-slate-100 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="text-emerald-600" size={22} />
                      Termo de Recebimento de EPI - Lojas Ramos
                    </DialogTitle>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Documentos de responsabilidade individuais e únicos por sucursal e colaborador.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={() => generateEpiTermPDF(dist, branches, products, activeBranchId, settings?.companyLogo)} 
                      variant="outline"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold gap-2"
                    >
                      <Download size={16} /> Exportar PDF
                    </Button>
                    <Button 
                      onClick={handlePrintDocument} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md"
                    >
                      <Printer size={16} /> 
                      {activeBranchId === 'all' ? 'Imprimir Todos os Termos' : 'Imprimir Termo Único'}
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* SELETOR DE FILIAIS NO TOPO DO MODAL */}
              <div className="px-6 py-3 bg-slate-200/80 border-b border-slate-300 flex flex-wrap items-center gap-2 print:hidden">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mr-1">
                  <Building2 size={15} className="text-emerald-700" /> Sucursal:
                </span>

                <button
                  type="button"
                  onClick={() => setPrintingEpiTerm({ ...printingEpiTerm, selectedBranchId: 'all' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeBranchId === 'all'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Todas as Sucursais ({allBranchIds.length})
                </button>

                {allBranchIds.map(bId => {
                  const branch = branches.find(b => b.id === bId);
                  const recipientName = dist.recipients?.[bId] || branch?.manager || 'Recebedor';
                  const isSelected = activeBranchId === bId;

                  return (
                    <button
                      key={bId}
                      type="button"
                      onClick={() => setPrintingEpiTerm({ ...printingEpiTerm, selectedBranchId: bId })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{branch?.name || 'Sucursal'}</span>
                      <span className="text-[10px] opacity-80">({recipientName})</span>
                    </button>
                  );
                })}
              </div>

              {/* CONTEÚDO IMPRESSO DA FOLHA DE TERMO */}
              <div className="p-8 space-y-10 overflow-y-auto flex-1 text-slate-900 font-sans print:p-0 print:overflow-visible custom-scrollbar">
                
                {displayBranchIds.map((branchId: string, pageIdx: number) => {
                  const branch = branches.find(b => b.id === branchId);
                  const recipientName = dist.recipients?.[branchId] || branch?.manager || '___________________________';

                  // Collect all items delivered to this branch
                  const branchItems = dist.items.map((item: any) => {
                    const prod = products.find(p => p.id === item.productId);
                    const qInfo = item.quantityPerBranch.find((q: any) => q.branchId === branchId);
                    if (qInfo && qInfo.quantity > 0) {
                      return {
                        productName: prod?.name || 'EPI',
                        code: prod?.code || '',
                        unit: prod?.unit || 'un',
                        quantity: qInfo.quantity
                      };
                    }
                    return null;
                  }).filter(Boolean);

                  if (branchItems.length === 0) return null;

                  return (
                    <div 
                      key={branchId} 
                      className={`border border-slate-300 rounded-xl p-6 bg-slate-50/50 space-y-6 print:border-none print:bg-white print:p-0 ${
                        pageIdx < displayBranchIds.length - 1 ? 'break-after-page' : ''
                      }`}
                    >
                      {/* CABEÇALHO DA EMPRESA */}
                      <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                        <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">LOJAS RAMOS</h1>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Comprovante de Entrega e Termo de Responsabilidade de EPI</h2>
                        <p className="text-xs text-slate-500">Distribuição #{dist.id.toUpperCase()} • Data: {new Date(dist.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>

                      {/* CABEÇALHO DA SUCURSAL E BENEFICIÁRIO */}
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 bg-white p-4 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Empresa / Sucursal</p>
                          <p className="text-base font-bold text-slate-900">Lojas Ramos - {branch?.name}</p>
                          {branch?.location && <p className="text-xs text-slate-500">{branch.location}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Beneficiário / Recebedor Único</p>
                          <p className="text-base font-bold text-emerald-800">{recipientName}</p>
                          <p className="text-xs text-slate-500">Termo de Responsabilidade Pessoal</p>
                        </div>
                      </div>

                      {/* TABELA DE ITENS ENTREGUES */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Equipamentos de Proteção Individual (EPI) Entregues:</p>
                        <table className="w-full text-xs text-left border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-200 text-slate-800 font-bold uppercase">
                              <th className="p-2.5 border border-slate-300">Item / Equipamento</th>
                              <th className="p-2.5 border border-slate-300">Código</th>
                              <th className="p-2.5 border border-slate-300 text-center">Quantidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {branchItems.map((bi: any, bIdx: number) => (
                              <tr key={bIdx} className="border-b border-slate-200 bg-white">
                                <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{bi.productName}</td>
                                <td className="p-2.5 border border-slate-300 font-mono text-slate-600">{bi.code}</td>
                                <td className="p-2.5 border border-slate-300 text-center font-bold text-slate-900">{bi.quantity} {bi.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* DECLARAÇÃO DE RECEBIMENTO ÚNICA */}
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-slate-800 text-xs leading-relaxed space-y-2">
                        {branchItems.map((bi: any, bIdx: number) => (
                          <p key={bIdx} className="font-medium text-slate-900 text-sm">
                            "Eu, <strong className="text-emerald-950 font-bold underline">{recipientName}</strong>, confirmo o recebimento da quantidade <strong className="font-bold">{bi.quantity} {bi.unit}</strong> do item <strong className="font-bold">{bi.productName}</strong> na presente data."
                          </p>
                        ))}
                        <p className="text-[11px] text-slate-600 italic pt-2 border-t border-emerald-200/80">
                          Declaro ter recebido da <strong>Lojas Ramos</strong> os Equipamentos de Proteção Individual (EPI) listados acima em perfeitas condições de uso e conservação, comprometendo-me a utilizá-los de forma adequada durante minhas atividades profissionais.
                        </p>
                      </div>

                      {/* CAMPO DE ASSINATURA E DATA */}
                      <div className="pt-8 grid grid-cols-2 gap-8 items-end text-center text-xs">
                        <div className="space-y-1">
                          <div className="border-b border-slate-900 w-full mb-1" />
                          <p className="font-bold text-slate-900">{recipientName}</p>
                          <p className="text-[10px] text-slate-500">Assinatura do Colaborador / Recebedor</p>
                          <p className="text-[10px] text-slate-400">Lojas Ramos - {branch?.name}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="border-b border-slate-900 w-full mb-1" />
                          <p className="font-bold text-slate-900">Data: _____ / _____ / _________</p>
                          <p className="text-[10px] text-slate-500">Data do Recebimento na Sucursal</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>

              <DialogFooter className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 print:hidden">
                <Button onClick={() => setPrintingEpiTerm(null)} variant="outline" className="border-slate-300 font-bold">
                  Fechar
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => generateEpiTermPDF(dist, branches, products, activeBranchId, settings?.companyLogo)} 
                    variant="outline"
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold gap-2"
                  >
                    <Download size={16} /> Exportar PDF
                  </Button>
                  <Button onClick={handlePrintDocument} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                    <Printer size={16} /> 
                    {activeBranchId === 'all' ? 'Imprimir Todos os Termos' : 'Imprimir Termo Desta Sucursal'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* MODAL 5: IMPRESSÃO DO ROMANEIO DE ENVIO POR SUCURSAL */}
      {printingRomaneio && (() => {
        const dist = printingRomaneio.distribution;
        const branchId = printingRomaneio.selectedBranchId;
        const branch = branches.find((b) => b.id === branchId);
        const recipientName = dist.recipients?.[branchId] || branch?.manager || 'Gerente / Responsável';

        const branchItems: Array<{ code: string; productName: string; category: string; unit: string; quantity: number }> = [];
        dist.items.forEach((item: any) => {
          const qInfo = item.quantityPerBranch?.find((q: any) => q.branchId === branchId);
          if (qInfo && qInfo.quantity > 0) {
            const prod = products.find((p) => p.id === item.productId);
            branchItems.push({
              code: prod?.code || 'N/A',
              productName: prod?.name || 'Produto',
              category: prod?.category || 'Geral',
              unit: prod?.unit || 'un',
              quantity: qInfo.quantity
            });
          }
        });

        return (
          <Dialog open={!!printingRomaneio} onOpenChange={() => setPrintingRomaneio(null)}>
            <DialogContent className="sm:max-w-[850px] bg-white text-slate-900 rounded-xl shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
              <DialogHeader className="p-5 bg-slate-900 text-white border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Truck className="text-cyan-400" size={22} />
                      Romaneio de Envio & Guia de Transporte
                    </DialogTitle>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Documento de expedição e controle logístico para a filial {branch?.name || 'Sucursal'}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={() => generateDistributionRomaneioPDF(dist, branches, products, branchId, settings?.companyLogo)} 
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800 font-bold gap-2"
                    >
                      <Download size={16} /> Exportar PDF
                    </Button>
                    <Button 
                      onClick={handlePrintDocument} 
                      className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold gap-2 shadow-md"
                    >
                      <Printer size={16} /> Imprimir Romaneio
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 overflow-y-auto space-y-6 text-slate-800 font-sans">
                {/* Header Preview */}
                <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                  <div className="flex items-center gap-3">
                    {settings?.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="h-12 w-auto object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-cyan-600 text-white font-black text-xl rounded-lg flex items-center justify-center">LR</div>
                    )}
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 uppercase tracking-tight">Lojas Ramos - Distribuição Central</h4>
                      <p className="text-xs text-slate-500">Romaneio de Carga e Guia de Transferência Entre Unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-cyan-600 text-lg">#{dist.id.toUpperCase()}</span>
                    <p className="text-xs text-slate-500">{new Date(dist.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Cards Origem / Destino */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Origem da Carga</h5>
                    <p className="font-bold text-slate-900">Almoxarifado & CD Central Matriz</p>
                    <p className="text-xs text-slate-500">Tipo: <strong>{dist.type === 'epi' ? 'Distribuição de EPIs' : 'Distribuição Geral'}</strong></p>
                  </div>

                  <div className="bg-cyan-50/80 p-4 rounded-xl border border-cyan-200 space-y-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-900">Filial Destino</h5>
                    <p className="font-black text-cyan-950 text-base">{branch?.name?.toUpperCase()}</p>
                    <p className="text-xs text-cyan-900">Endereço: <strong>{branch?.location || 'Não informado'}</strong></p>
                    <p className="text-xs text-cyan-900">Gerente/Responsável: <strong>{recipientName}</strong></p>
                  </div>
                </div>

                {/* Tabela de Itens */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-900 text-white">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-white font-bold text-xs">Seq</TableHead>
                        <TableHead className="text-white font-bold text-xs">Código</TableHead>
                        <TableHead className="text-white font-bold text-xs">Descrição do Item</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">Unid</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">Qtd Despachada</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">Conferência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchItems.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-slate-200">
                          <TableCell className="font-bold text-xs text-center">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs font-bold">{item.code}</TableCell>
                          <TableCell className="font-medium text-xs text-slate-900">{item.productName}</TableCell>
                          <TableCell className="text-xs text-center">{item.unit}</TableCell>
                          <TableCell className="text-xs font-bold text-center text-cyan-700">{item.quantity}</TableCell>
                          <TableCell className="text-xs text-center font-mono text-slate-400">[ &nbsp; ] OK</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                  <div className="text-center space-y-1">
                    <div className="border-b border-slate-400 w-full mb-2"></div>
                    <p className="font-bold text-xs text-slate-900">Expedição / Transportador</p>
                    <p className="text-[10px] text-slate-500">Conferência de Saída do Estoque Central</p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="border-b border-slate-400 w-full mb-2"></div>
                    <p className="font-bold text-xs text-slate-900">{recipientName}</p>
                    <p className="text-[10px] text-slate-500">Gerente Responsável - {branch?.name}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* MODAL 6: IMPRESSÃO DO COMPROVANTE DE ENTREGA POR SUCURSAL */}
      {printingReceipt && (() => {
        const dist = printingReceipt.distribution;
        const branchId = printingReceipt.selectedBranchId;
        const branch = branches.find((b) => b.id === branchId);
        const recipientName = dist.recipients?.[branchId] || branch?.manager || 'Gerente / Responsável';

        const branchItems: Array<{ code: string; productName: string; category: string; unit: string; quantity: number }> = [];
        dist.items.forEach((item: any) => {
          const qInfo = item.quantityPerBranch?.find((q: any) => q.branchId === branchId);
          if (qInfo && qInfo.quantity > 0) {
            const prod = products.find((p) => p.id === item.productId);
            branchItems.push({
              code: prod?.code || 'N/A',
              productName: prod?.name || 'Produto',
              category: prod?.category || 'Geral',
              unit: prod?.unit || 'un',
              quantity: qInfo.quantity
            });
          }
        });

        return (
          <Dialog open={!!printingReceipt} onOpenChange={() => setPrintingReceipt(null)}>
            <DialogContent className="sm:max-w-[850px] bg-white text-slate-900 rounded-xl shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
              <DialogHeader className="p-5 bg-emerald-950 text-white border-b border-emerald-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="text-emerald-400" size={22} />
                      Comprovante de Entrega & Termo de Recebimento
                    </DialogTitle>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      Comprovante oficial de entrega e transferência emitido para {branch?.name || 'Sucursal'}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={() => generateDistributionReceiptPDF(dist, branches, products, branchId, settings?.companyLogo)} 
                      variant="outline"
                      className="border-emerald-700 text-emerald-100 hover:bg-emerald-900 font-bold gap-2"
                    >
                      <Download size={16} /> Exportar PDF
                    </Button>
                    <Button 
                      onClick={handlePrintDocument} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shadow-md"
                    >
                      <Printer size={16} /> Imprimir Comprovante
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 overflow-y-auto space-y-6 text-slate-800 font-sans">
                {/* Header Preview */}
                <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                  <div className="flex items-center gap-3">
                    {settings?.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="h-12 w-auto object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-700 text-white font-black text-xl rounded-lg flex items-center justify-center">LR</div>
                    )}
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 uppercase tracking-tight">Lojas Ramos - Comprovante de Entrega</h4>
                      <p className="text-xs text-slate-500">Termo de Transferência e Recebimento na Filial</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 text-lg">#{dist.id.toUpperCase()}</span>
                    <p className="text-xs text-slate-500">{new Date(dist.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Origem Remetente</h5>
                    <p className="font-bold text-slate-900">Almoxarifado & CD Central Matriz</p>
                    <p className="text-xs text-slate-500">Lote ID: #{dist.id.toUpperCase()}</p>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Filial Recebedora</h5>
                    <p className="font-black text-emerald-950 text-base">{branch?.name?.toUpperCase()}</p>
                    <p className="text-xs text-emerald-900">Gerente Responsável: <strong>{recipientName}</strong></p>
                  </div>
                </div>

                {/* Tabela de Produtos */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-emerald-900 text-white">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-white font-bold text-xs">Seq</TableHead>
                        <TableHead className="text-white font-bold text-xs">Código</TableHead>
                        <TableHead className="text-white font-bold text-xs">Descrição do Item</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">Unid</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">Qtd Entregue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchItems.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-slate-200">
                          <TableCell className="font-bold text-xs text-center">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs font-bold">{item.code}</TableCell>
                          <TableCell className="font-medium text-xs text-slate-900">{item.productName}</TableCell>
                          <TableCell className="text-xs text-center">{item.unit}</TableCell>
                          <TableCell className="text-xs font-bold text-center text-emerald-700">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Declaração */}
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  Declaro que recebi da administração central da Lojas Ramos os produtos discriminados acima em perfeita quantidade, qualidade e integridade física para atendimento e uso operacional da sucursal <strong>{branch?.name}</strong>.
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                  <div className="text-center space-y-1">
                    <div className="border-b border-slate-400 w-full mb-2"></div>
                    <p className="font-bold text-xs text-slate-900">{recipientName}</p>
                    <p className="text-[10px] text-slate-500">Assinatura do Gerente / Responsável - {branch?.name}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="border-b border-slate-400 w-full mb-2"></div>
                    <p className="font-bold text-xs text-slate-900">Data: ____ / ____ / _________</p>
                    <p className="text-[10px] text-slate-500">Data Efetiva de Recebimento e Carimbo da Loja</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
function PurchasesTab() {
  const { purchaseOrders, suppliers, products, createPurchaseOrder, updatePurchaseOrderStatus, settings, productClassifications } = useRamoxContext();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string, quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [poCategory, setPoCategory] = useState('all');

  // List Filters
  const [listStatusFilter, setListStatusFilter] = useState<string>('all');
  const [listSupplierFilter, setListSupplierFilter] = useState<string>('all');
  const [listDateFilter, setListDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = purchaseOrders.filter(o => {
    if (listStatusFilter !== 'all' && o.status !== listStatusFilter) return false;
    if (listSupplierFilter !== 'all' && o.supplierId !== listSupplierFilter) return false;
    if (listDateFilter) {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      if (orderDate !== listDateFilter) return false;
    }
    return true;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [listStatusFilter, listSupplierFilter, listDateFilter]);

  const reversedOrders = filteredOrders.slice().reverse();
  const paginatedOrders = reversedOrders.slice((currentPage - 1) * 15, currentPage * 15);

  const currentOrderTotal = orderItems.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    return acc + (product ? product.price * item.quantity : 0);
  }, 0);

  const handleAddProduct = (productId: string) => {
    if (!productId) return;
    const existingItem = orderItems.find(item => item.productId === productId);
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { productId, quantity: 1 }]);
    }
    setProductSearch('');
  };

  const handleCreate = () => {
    if (!selectedSupplier || orderItems.length === 0) return;
    createPurchaseOrder(selectedSupplier, orderItems);
    setIsAddOpen(false);
    toast.success('Pedido de compra gerado com sucesso!');
    setOrderItems([]);
    setSelectedSupplier('');
  };

  const generatePDF = (order: any) => {
    const supplier = suppliers.find(s => s.id === order.supplierId);
    generatePurchaseOrderPDF(order, supplier, products, settings?.companyLogo);
    toast.success('PDF gerado com sucesso!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-bold text-white tracking-tight">Histórico de Pedidos de Compra</CardTitle>
              <p className="text-sm text-slate-400 font-medium">Gestão de entradas de mercadorias e negociações com fornecedores.</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportExcelModal
                title="Exportar Pedidos de Compra"
                description="Exporte o histórico completo dos pedidos de compra realizados com fornecedores."
                data={filteredOrders.map(o => {
                  const supplier = suppliers.find(s => s.id === o.supplierId);
                  const total = o.items.reduce((acc, item) => {
                    const p = products.find(prod => prod.id === item.productId);
                    return acc + (p ? p.price * item.quantity : 0);
                  }, 0);
                  return {
                    IDPedido: o.id.toUpperCase(),
                    DataEmissao: new Date(o.createdAt).toLocaleDateString('pt-BR'),
                    Fornecedor: supplier?.name || 'N/A',
                    TotalItens: o.items.length,
                    ValorTotal: total,
                    Status: o.status === 'pendente' ? 'Pendente' : o.status === 'aprovado' ? 'Aprovado' : o.status === 'recebido' ? 'Recebido' : 'Cancelado'
                  };
                })}
                defaultFilename="pedidos_de_compra"
                sheetName="PedidosDeCompra"
                columns={[
                  { key: 'IDPedido', label: 'ID Pedido' },
                  { key: 'DataEmissao', label: 'Data Emissão' },
                  { key: 'Fornecedor', label: 'Fornecedor' },
                  { key: 'TotalItens', label: 'Qtd Itens' },
                  { key: 'ValorTotal', label: 'Valor Total (R$)' },
                  { key: 'Status', label: 'Status' },
                ]}
              />
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger
                  render={
                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-white h-11 px-6 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] font-bold border-none">
                      <Plus size={18} className="mr-2" /> Novo Pedido de Compra
                    </Button>
                  }
                />
              <DialogContent className="sm:max-w-[95vw] lg:max-w-7xl h-[90vh] bg-slate-900 border-slate-800 text-white rounded-xl shadow-2xl flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-black text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                        <ShoppingCart size={22} />
                      </div>
                      <div>
                        <span>Novo Pedido de Compra</span>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em] mt-0.5">Abastecimento de Almoxarifado</p>
                      </div>
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 uppercase font-black">Valor Total</p>
                      <p className="text-2xl font-black text-cyan-400">R$ {currentOrderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Left Sidebar: Supplier Info */}
                  <div className="w-full md:w-72 bg-slate-950/30 border-r border-slate-800 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-3 bg-cyan-500 rounded-full"></div>
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Fornecedor</Label>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Selecionar Parceiro</Label>
                          <SearchableSelect
                            value={selectedSupplier}
                            onChange={setSelectedSupplier}
                            placeholder="Escolha um fornecedor..."
                            searchPlaceholder="Digite nome, código ou CNPJ..."
                            clearable={true}
                            options={suppliers.map(s => ({
                              value: s.id,
                              label: s.name,
                              code: s.code,
                              sublabel: s.cnpj ? `CNPJ: ${s.cnpj}` : undefined
                            }))}
                          />
                        </div>
                        
                        {selectedSupplier && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 space-y-3 shadow-inner"
                          >
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">Razão Social</p>
                              <p className="text-xs font-bold text-white uppercase truncate">{suppliers.find(s => s.id === selectedSupplier)?.name}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">CNPJ</p>
                              <p className="text-xs font-mono text-cyan-500/80">{suppliers.find(s => s.id === selectedSupplier)?.cnpj || '---'}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">Contato Direto</p>
                              <p className="text-xs text-slate-400 font-medium truncate">{suppliers.find(s => s.id === selectedSupplier)?.contact || '---'}</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </section>

                    <div className="p-5 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Atenção</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Certifique-se de que as quantidades solicitadas estão em conformidade com as embalagens padrão do fornecedor.
                      </p>
                    </div>
                  </div>

                  {/* Right Content: Products and List */}
                  <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
                    <div className="p-6 pb-2 space-y-4 pointer-events-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-3 bg-cyan-500 rounded-full"></div>
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Inclusão de Itens</Label>
                        </div>
                        {orderItems.length > 0 && (
                          <Badge className="bg-cyan-500 text-white border-none px-2 py-0.5 font-black text-[9px] shadow-lg shadow-cyan-500/20">
                            {orderItems.length} {orderItems.length === 1 ? 'ITEM' : 'ITENS'}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative group flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 z-10 pointer-events-none">
                              <Search size={18} className="group-focus-within:scale-110 transition-transform" />
                            </div>
                            <Input 
                              placeholder="Buscar por NOME ou CÓDIGO do produto..." 
                              className="h-12 pl-12 pr-20 rounded-xl bg-slate-950 border-slate-800 shadow-xl text-slate-200 focus:ring-2 focus:ring-cyan-500/30 hover:bg-slate-950/80 transition-all text-sm font-medium ring-offset-slate-900"
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                            />
                            {productSearch && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setProductSearch('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                              >
                                Limpar
                              </Button>
                            )}
                          </div>
                          <Select value={poCategory} onValueChange={setPoCategory}>
                            <SelectTrigger className="w-full sm:w-48 bg-slate-950 border-slate-800 h-12 text-slate-300 rounded-xl">
                              <SelectValue placeholder="Classificação..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                              <SelectItem value="all">Todas Classificações</SelectItem>
                              {(productClassifications || []).map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {(productSearch.trim() !== '' || poCategory !== 'all') && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[400px] flex flex-col z-50 border-t-2 border-t-cyan-500"
                          >
                            <div className="p-2 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Resultados da Busca</p>
                              {productSearch.trim() === '' && poCategory !== 'all' && (
                                <span className="text-[9px] font-bold text-cyan-400 px-2">Filtrado por: {poCategory}</span>
                              )}
                            </div>
                            <div className="overflow-y-auto custom-scrollbar p-1">
                              {(() => {
                                const q = productSearch.trim().toLowerCase();
                                const matches = products.filter(p => {
                                  const matchesSearch = !q || 
                                    p.name.toLowerCase().includes(q) || 
                                    p.code.toLowerCase().includes(q) ||
                                    p.category.toLowerCase().includes(q) ||
                                    p.unit.toLowerCase().includes(q);
                                  const matchesCategory = poCategory === 'all' || p.category === poCategory;
                                  return matchesSearch && matchesCategory;
                                });

                                if (matches.length === 0) {
                                  return (
                                    <div className="p-8 text-center text-slate-600">
                                      <Search size={28} className="mx-auto mb-2 opacity-30 text-cyan-400" />
                                      <p className="text-xs font-semibold text-slate-300">Nenhum produto com essa relação.</p>
                                      <p className="text-[11px] text-slate-500 mt-0.5">Tente pesquisar por parte do nome ou código.</p>
                                    </div>
                                  );
                                }

                                const displayed = (!q && poCategory !== 'all') ? matches.slice(0, 15) : matches;

                                return (
                                  <>
                                    {displayed.map(p => (
                                      <div 
                                        key={p.id}
                                        onClick={() => handleAddProduct(p.id)}
                                        className="flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-all border border-transparent hover:border-cyan-500/30 group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                                            {p.image ? (
                                              <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                              <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-700">
                                                <Package size={16} />
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-black font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded uppercase">#{p.code}</span>
                                              <span className="font-bold text-slate-200 uppercase text-xs">{p.name}</span>
                                            </div>
                                            <p className="text-[8px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">{p.category} • {p.unit}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-black text-emerald-400">R$ {p.price.toFixed(2)}</p>
                                          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Estoque: {p.currentStock}</p>
                                        </div>
                                      </div>
                                    ))}
                                    {!q && matches.length > 15 && (
                                      <div className="p-2 text-center text-[10px] text-slate-500 border-t border-slate-800/50">
                                        Exibindo 15 de {matches.length} itens. Digite no campo de busca para filtrar.
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar bg-slate-950/20 border-t border-slate-800/50">
                      <AnimatePresence mode="popLayout">
                        {orderItems.map((item, idx) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <motion.div 
                              key={item.productId}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="group flex gap-4 items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800 mb-2 hover:border-cyan-500/40 hover:bg-slate-900 transition-all shadow-lg relative overflow-hidden"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/10 group-hover:bg-cyan-500 transition-colors"></div>
                              
                              <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center text-slate-600 flex-shrink-0 border border-slate-800 shadow-inner overflow-hidden">
                                {product?.image ? (
                                  <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package size={20} />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded shadow-sm">#{product?.code}</span>
                                  <h4 className="font-black text-sm text-white truncate uppercase tracking-tight">{product?.name}</h4>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-slate-500">
                                    <span className="text-[9px] font-black uppercase">Preço:</span>
                                    <span className="text-[10px] font-bold text-slate-400">R$ {product?.price.toFixed(2)}</span>
                                  </div>
                                  <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                                  <div className="flex items-center gap-1 text-slate-500">
                                    <span className="text-[9px] font-black uppercase">Unid:</span>
                                    <span className="text-[10px] font-bold text-slate-400">{product?.unit}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 pr-1">
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 uppercase font-black text-center block tracking-widest">Qtd</Label>
                                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 shadow-inner group-focus-within:border-cyan-500/50 transition-colors">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 rounded-md text-slate-500 hover:text-white"
                                      onClick={() => {
                                        const newItems = [...orderItems];
                                        newItems[idx].quantity = Math.max(1, newItems[idx].quantity - 1);
                                        setOrderItems(newItems);
                                      }}
                                    >
                                      <Minus size={12} />
                                    </Button>
                                    <Input 
                                      type="number" 
                                      min="1"
                                      className="w-12 h-7 border-none bg-transparent text-center font-black text-white focus-visible:ring-0 text-xs px-1" 
                                      value={item.quantity} 
                                      onChange={e => {
                                        const newItems = [...orderItems];
                                        newItems[idx].quantity = Math.max(1, Number(e.target.value));
                                        setOrderItems(newItems);
                                      }}
                                    />
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 rounded-md text-slate-500 hover:text-white"
                                      onClick={() => {
                                        const newItems = [...orderItems];
                                        newItems[idx].quantity += 1;
                                        setOrderItems(newItems);
                                      }}
                                    >
                                      <Plus size={12} />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end min-w-[100px]">
                                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Subtotal</span>
                                  <span className="text-lg font-black text-cyan-400">R$ {((product?.price || 0) * item.quantity).toFixed(2)}</span>
                                </div>

                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg h-9 w-9 transition-all active:scale-90" 
                                  onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      
                      {orderItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 py-32 space-y-6">
                          <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse shadow-inner">
                            <ShoppingCart size={40} className="opacity-20" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-slate-400 uppercase tracking-tight">Pedido Vazio</p>
                            <p className="text-sm text-slate-600 mt-1">Utilize o campo acima para incluir<br/>produtos no pedido de compra.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="bg-slate-950 p-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 w-full z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-6">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Resumo Financeiro</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">R$ {currentOrderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Total Pedido</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
                    <div className="hidden md:flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center min-w-[60px]">
                        <p className="text-[8px] text-slate-500 uppercase font-black">Skus</p>
                        <p className="text-lg font-black text-cyan-500">{orderItems.length}</p>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center min-w-[80px]">
                        <p className="text-[8px] text-slate-500 uppercase font-black">Total Unid.</p>
                        <p className="text-lg font-black text-cyan-500">{orderItems.reduce((acc, i) => acc + i.quantity, 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsAddOpen(false)} 
                      className="h-12 px-8 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                      Descartar
                    </Button>
                    <Button 
                      className="bg-cyan-500 hover:bg-cyan-400 text-white h-12 px-10 rounded-xl font-black shadow-[0_4px_30px_rgba(6,182,212,0.4)] border-none text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50"
                      onClick={handleCreate}
                      disabled={!selectedSupplier || orderItems.length === 0}
                    >
                      FINALIZAR PEDIDO
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/20 p-4 rounded-xl border border-slate-800/50">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Filtrar por Status</Label>
              <select 
                value={listStatusFilter} 
                onChange={(e) => setListStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border-slate-800 rounded-md h-9 text-slate-200 text-sm px-3 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              >
                <option value="all">Ver Todos</option>
                <option value="pending">Aguardando Aprovação</option>
                <option value="approved">Em Trânsito / Logística</option>
                <option value="checked">Conferido pela Logística</option>
                <option value="received">Recebido no Almoxarifado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Filtrar por Fornecedor</Label>
              <SearchableSelect
                value={listSupplierFilter}
                onChange={setListSupplierFilter}
                placeholder="Todos os Fornecedores"
                searchPlaceholder="Digite nome do fornecedor..."
                options={[
                  { value: 'all', label: 'Todos os Fornecedores' },
                  ...suppliers.map(s => ({
                    value: s.id,
                    label: s.name,
                    code: s.code,
                    sublabel: s.cnpj ? `CNPJ: ${s.cnpj}` : undefined
                  }))
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Data de Emissão</Label>
              <Input 
                type="date" 
                value={listDateFilter}
                onChange={(e) => setListDateFilter(e.target.value)}
                className="bg-slate-900 border-slate-800 text-slate-200 h-9"
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setListStatusFilter('all');
                  setListSupplierFilter('all');
                  setListDateFilter('');
                }}
                className="text-slate-500 hover:text-white w-full border border-dashed border-slate-800 hover:border-slate-700 h-9"
              >
                <XCircle size={14} className="mr-2" /> Limpar Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="w-[140px] text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-6">ID Pedido</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Fornecedor</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Data Emissão</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Valor Total</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((o) => {
                const supplier = suppliers.find(s => s.id === o.supplierId);
                return (
                  <TableRow key={o.id} className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="pl-6">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-slate-500 hover:text-cyan-400 h-10 w-10 rounded-md hover:bg-cyan-500/10 transition-all"
                        onClick={() => generatePDF(o)}
                        title="Baixar PDF"
                      >
                        <Download size={20} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-cyan-500 uppercase tracking-tighter">#{o.id.toUpperCase()}</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="font-bold text-slate-200 text-xs break-words">{supplier?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono tracking-wider">{supplier?.cnpj}</div>
                    </TableCell>
                    <TableCell className="text-slate-400 font-medium text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-bold text-white text-xs md:text-sm whitespace-nowrap">R$ {o.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        o.status === 'received' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        o.status === 'checked' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        o.status === 'approved' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      } variant="outline">
                        {o.status === 'pending' ? 'Aguardando Aprovação' : 
                         o.status === 'approved' ? 'Em Trânsito / Logística' : 
                         o.status === 'checked' ? 'Conferido pela Logística' :
                         'Recebido no Almoxarifado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        {o.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border-red-800/50 font-bold h-9 px-3 rounded-md transition-colors"
                              onClick={() => {
                                updatePurchaseOrderStatus(o.id, 'rejected' as any);
                                toast.info(`Pedido de compra #${o.id.toUpperCase()} cancelado.`);
                              }}
                            >
                              <XCircle size={16} className="mr-1.5" /> Cancelar
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-cyan-500 hover:bg-cyan-400 text-white h-9 px-4 rounded-md font-bold shadow-lg shadow-cyan-500/20 border-none transition-all active:scale-95" 
                              onClick={() => {
                                updatePurchaseOrderStatus(o.id, 'approved');
                                toast.success('Pedido aprovado! A logística já pode visualizar a entrada.');
                              }}
                            >
                              <CheckCircle2 size={16} className="mr-2" /> Aprovar
                            </Button>
                          </>
                        )}
                        
                        {o.status === 'checked' && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-400 text-white h-9 px-4 rounded-md font-bold shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-95" 
                            onClick={() => {
                              updatePurchaseOrderStatus(o.id, 'received');
                              toast.success('Estoque atualizado com sucesso!');
                            }}
                          >
                            <Package size={16} className="mr-2" /> Confirmar Entrada
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <ShoppingCart size={32} className="text-slate-600" />
                      </div>
                      <p className="text-lg font-medium">Nenhum pedido de compra encontrado.</p>
                      <p className="text-sm text-slate-600 truncate">Tente ajustar seus filtros para encontrar o que procura.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
         </div>
         <Pagination
           currentPage={currentPage}
           totalPages={Math.ceil(filteredOrders.length / 15)}
           onPageChange={setCurrentPage}
           totalItems={filteredOrders.length}
           itemsPerPage={15}
         />
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalTab() {
  const { branchOrders, branches, products, updateBranchOrderStatus, updateBranchOrderItems, currentUser } = useRamoxContext();
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<{ productId: string, quantity: number }[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedItemProductIds, setSelectedItemProductIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = branchOrders.filter(o => {
    // Status Filter
    if (statusFilter === 'active') {
      if (o.status === 'delivered' || o.status === 'rejected') return false;
    } else if (statusFilter !== 'all') {
      if (o.status !== statusFilter) return false;
    }

    // Branch Filter
    if (branchFilter !== 'all') {
      if (o.branchId !== branchFilter) return false;
    }

    // Date Filter
    if (dateFilter) {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      if (orderDate !== dateFilter) return false;
    }

    return true;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, branchFilter, dateFilter]);

  const reversedOrders = filteredOrders.slice().reverse();
  const paginatedOrders = reversedOrders.slice((currentPage - 1) * 15, currentPage * 15);

  const startEdit = (order: any) => {
    setEditingOrder(order.id);
    setEditItems([...order.items]);
    setSelectedItemProductIds([]);
  };

  const handleUpdateItem = (productId: string, quantity: number) => {
    setEditItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
    ));
  };

  const saveChanges = () => {
    if (editingOrder) {
      updateBranchOrderItems(editingOrder, editItems);
      setEditingOrder(null);
      toast.success('Pedido editado com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white">Acompanhamento e Aprovação</CardTitle>
              <p className="text-sm text-slate-400">Gerencie aprovações e acompanhe o status dos pedidos em tempo real.</p>
            </div>
            <ExportExcelModal
              title="Exportar Pedidos das Filiais"
              description="Exporte a lista de solicitações de reposição enviadas pelas filiais."
              data={filteredOrders.map(o => {
                const branch = branches.find(b => b.id === o.branchId);
                const total = o.items.reduce((acc, item) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return acc + (p ? p.price * item.quantity : 0);
                }, 0);
                return {
                  IDPedido: o.id.toUpperCase(),
                  DataSolicitacao: new Date(o.createdAt).toLocaleDateString('pt-BR'),
                  Filial: branch?.name || 'N/A',
                  TotalItens: o.items.length,
                  ValorTotalEstimado: total,
                  Status: o.status === 'pending' ? 'Pendente' : o.status === 'approved' ? 'Aprovado' : o.status === 'delivered' ? 'Entregue' : o.status === 'rejected' ? 'Rejeitado' : o.status
                };
              })}
              defaultFilename="pedidos_filiais_aprovacao"
              sheetName="PedidosFiliais"
              columns={[
                { key: 'IDPedido', label: 'ID Pedido' },
                { key: 'DataSolicitacao', label: 'Data Solicitação' },
                { key: 'Filial', label: 'Filial' },
                { key: 'TotalItens', label: 'Qtd Itens' },
                { key: 'ValorTotalEstimado', label: 'Valor Estimado (R$)' },
                { key: 'Status', label: 'Status' },
              ]}
            />
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/20 p-4 rounded-xl border border-slate-800/50">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status do Pedido</Label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border-slate-800 rounded-md h-9 text-slate-200 text-sm px-3 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              >
                <option value="active">Todos os Ativos</option>
                <option value="all">Ver Todos</option>
                <optgroup label="Fases Iniciais">
                  <option value="pending">Aguardando Aprovação</option>
                  <option value="discrepancy">Divergência Relatada</option>
                  <option value="approved">Aprovado</option>
                </optgroup>
                <optgroup label="Em Operação">
                  <option value="picking">Em Separação</option>
                  <option value="picked">Separado</option>
                  <option value="invoiced">Faturado</option>
                  <option value="loading">Carregando</option>
                  <option value="shipped">Em Trânsito</option>
                </optgroup>
                <optgroup label="Finalizados">
                  <option value="delivered">Entregue</option>
                  <option value="rejected">Rejeitado</option>
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Filial de Destino</Label>
              <SearchableSelect
                value={branchFilter}
                onChange={setBranchFilter}
                placeholder="Todas as Filiais"
                searchPlaceholder="Digite nome ou código da filial..."
                options={[
                  { value: 'all', label: 'Todas as Filiais' },
                  ...branches.map(b => ({
                    value: b.id,
                    label: b.name,
                    code: b.code,
                    sublabel: b.location
                  }))
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Filtrar por Data</Label>
              <Input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-900 border-slate-800 text-slate-200 h-9"
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setStatusFilter('active');
                  setBranchFilter('all');
                  setDateFilter('');
                }}
                className="text-slate-500 hover:text-white w-full border border-dashed border-slate-800 hover:border-slate-700 h-9"
              >
                <XCircle size={14} className="mr-2" /> Limpar Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Batch Actions Bar for Orders */}
          {selectedOrderIds.length > 0 && (
            <div className="mx-6 my-4 bg-slate-900 border border-cyan-500/40 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckSquare size={16} />
                  <span>{selectedOrderIds.length} pedido(s) selecionado(s)</span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Ações em lote para os pedidos das filiais</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-950/80 hover:bg-red-900 text-red-300 border-red-800/60 font-bold h-9 px-3.5 rounded-lg text-xs transition-all shadow-md"
                  onClick={() => {
                    selectedOrderIds.forEach(id => {
                      updateBranchOrderStatus(id, 'rejected', currentUser?.name || 'Administrador Central');
                    });
                    toast.info(`${selectedOrderIds.length} pedido(s) cancelado(s) em lote.`);
                    setSelectedOrderIds([]);
                  }}
                >
                  <XCircle size={15} className="mr-1.5 text-red-400" /> Cancelar Pedidos Selecionados ({selectedOrderIds.length})
                </Button>

                <Button
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold h-9 px-3.5 rounded-lg text-xs transition-all shadow-md"
                  onClick={() => {
                    selectedOrderIds.forEach(id => {
                      updateBranchOrderStatus(id, 'approved', currentUser?.name || 'Administrador Central');
                    });
                    toast.success(`${selectedOrderIds.length} pedido(s) aprovado(s) em lote.`);
                    setSelectedOrderIds([]);
                  }}
                >
                  <CheckCircle2 size={15} className="mr-1.5" /> Aprovar Selecionados ({selectedOrderIds.length})
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-white h-9 px-2 text-xs"
                  onClick={() => setSelectedOrderIds([])}
                >
                  Desmarcar
                </Button>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="w-10 text-center">
                    <input 
                      type="checkbox"
                      title="Selecionar todos os pedidos visíveis"
                      className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer align-middle"
                      checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelected = Array.from(new Set([...selectedOrderIds, ...paginatedOrders.map(o => o.id)]));
                          setSelectedOrderIds(newSelected);
                        } else {
                          setSelectedOrderIds(selectedOrderIds.filter(id => !paginatedOrders.some(o => o.id === id)));
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Pedido</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Filial</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">Status / Acompanhamento</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Total</TableHead>
                <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map(order => {
                const branch = branches.find(b => b.id === order.branchId);
                const isEditing = editingOrder === order.id;
                const isDiscrepancy = order.status === 'discrepancy';
                const isPending = order.status === 'pending' || isDiscrepancy;

                const getStatusBadge = (status: string) => {
                  switch(status) {
                    case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">Pendente</Badge>;
                    case 'discrepancy': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">Divergência</Badge>;
                    case 'approved': return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Aprovado</Badge>;
                    case 'picking': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse">Em Separação</Badge>;
                    case 'picked': return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Separado</Badge>;
                    case 'invoiced': return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Faturado</Badge>;
                    case 'loading': return <Badge className="bg-blue-600/10 text-blue-400 border-blue-600/20">Carregando</Badge>;
                    case 'shipped': return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Em Trânsito</Badge>;
                    case 'delivered': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Entregue</Badge>;
                    case 'rejected': return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Rejeitado</Badge>;
                    default: return <Badge>{status}</Badge>;
                  }
                };

                return (
                  <TableRow key={order.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-cyan-500/5' : ''}`}>
                    <TableCell className="w-10 text-center py-2.5">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer align-middle"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds(prev => [...prev, order.id]);
                          } else {
                            setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className={`font-mono font-bold ${isDiscrepancy ? 'text-red-500' : 'text-cyan-500'}`}>
                      #{order.id.toUpperCase()}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="font-bold text-slate-200 text-xs break-words">{branch?.name}</div>
                    </TableCell>
                    <TableCell className="text-slate-400 font-medium text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-white text-xs md:text-sm whitespace-nowrap">R$ {order.totalValue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isPending ? (
                          <>
                            <Dialog open={isEditing} onOpenChange={(open) => !open && setEditingOrder(null)}>
                              <DialogTrigger
                                render={
                                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400 font-bold" onClick={() => startEdit(order)}>
                                    <Edit size={16} className="mr-2" /> Analisar
                                  </Button>
                                }
                              />
                              <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Analisar Pedido #{order.id.toUpperCase()}</DialogTitle>
                                  {isDiscrepancy && (
                                    <p className="text-xs text-red-400 font-bold bg-red-400/10 p-2 rounded border border-red-400/20 flex items-center gap-2">
                                      <FileCheck size={14} /> Este pedido foi gerado devido a uma divergência relatada.
                                    </p>
                                  )}
                                </DialogHeader>

                                {/* Item Multi-selection Header inside Modal */}
                                <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 mt-2">
                                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                                    <input 
                                      type="checkbox"
                                      className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                                      checked={editItems.length > 0 && editItems.every(item => selectedItemProductIds.includes(item.productId))}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedItemProductIds(editItems.map(i => i.productId));
                                        } else {
                                          setSelectedItemProductIds([]);
                                        }
                                      }}
                                    />
                                    <span>Selecionar Todos os Itens ({editItems.length})</span>
                                  </label>

                                  {selectedItemProductIds.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="bg-red-600 hover:bg-red-500 text-white font-bold h-8 text-xs px-3 rounded-md shadow-sm transition-all"
                                      onClick={() => {
                                        const remaining = editItems.filter(item => !selectedItemProductIds.includes(item.productId));
                                        setEditItems(remaining);
                                        const removedCount = selectedItemProductIds.length;
                                        setSelectedItemProductIds([]);
                                        if (remaining.length === 0) {
                                          updateBranchOrderStatus(order.id, 'rejected', currentUser?.name || 'Administrador Central');
                                          setEditingOrder(null);
                                          toast.info(`Todos os itens foram removidos. Pedido #${order.id.toUpperCase()} foi cancelado.`);
                                        } else {
                                          updateBranchOrderItems(order.id, remaining);
                                          toast.info(`${removedCount} item(ns) cancelado(s)/removido(s) do pedido.`);
                                        }
                                      }}
                                    >
                                      <Trash2 size={14} className="mr-1.5" /> Cancelar {selectedItemProductIds.length} Item(ns) Selecionado(s)
                                    </Button>
                                  )}
                                </div>

                                <div className="py-4 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                  {editItems.map((item, idx) => {
                                    const product = products.find(p => p.id === item.productId);
                                    const isItemSelected = selectedItemProductIds.includes(item.productId);
                                    return (
                                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-md border transition-all ${isItemSelected ? 'bg-red-950/30 border-red-800/50' : 'bg-slate-800/40 border-slate-700/30'}`}>
                                        <input 
                                          type="checkbox"
                                          className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                                          checked={isItemSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedItemProductIds(prev => [...prev, item.productId]);
                                            } else {
                                              setSelectedItemProductIds(prev => prev.filter(id => id !== item.productId));
                                            }
                                          }}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-white text-sm truncate">{product?.name || item.productId}</p>
                                          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">{product?.code}</p>
                                        </div>
                                        <div className="w-24">
                                          <Label className="text-[10px] text-slate-500 uppercase mb-1 block">Quantidade</Label>
                                          <Input 
                                            type="number" 
                                            value={item.quantity} 
                                            onChange={(e) => handleUpdateItem(item.productId, Number(e.target.value))}
                                            className="bg-slate-950 border-slate-800 text-center font-bold text-cyan-400 h-9 text-sm"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {editItems.length === 0 && (
                                    <p className="text-center py-6 text-slate-500 italic">Nenhum item restante no pedido.</p>
                                  )}
                                </div>
                                <DialogFooter className="border-t border-slate-800 pt-6 flex items-center justify-between gap-2">
                                  <Button 
                                    variant="outline" 
                                    className="bg-red-950/60 hover:bg-red-900/80 text-red-400 border-red-800/60 font-bold"
                                    onClick={() => {
                                      updateBranchOrderStatus(order.id, 'rejected', currentUser?.name || 'Administrador Central');
                                      setEditingOrder(null);
                                      toast.info(`Pedido #${order.id.toUpperCase()} cancelado/rejeitado.`);
                                    }}
                                  >
                                    <XCircle size={16} className="mr-2" /> Cancelar Pedido Completo
                                  </Button>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setEditingOrder(null)} className="text-slate-400">Fechar</Button>
                                    <Button onClick={saveChanges} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold">Salvar Alterações</Button>
                                  </div>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border-red-800/50 font-bold h-9 px-3 rounded-md transition-colors"
                              onClick={() => {
                                updateBranchOrderStatus(order.id, 'rejected', currentUser?.name || 'Administrador Central');
                                toast.info(`Pedido #${order.id.toUpperCase()} cancelado.`);
                              }}
                            >
                              <XCircle size={16} className="mr-1.5" /> Cancelar
                            </Button>

                            <Button 
                              size="sm" 
                              className={`${isDiscrepancy ? 'bg-red-500 hover:bg-red-400' : 'bg-amber-500 hover:bg-amber-400'} text-white font-bold h-9 px-4 rounded-md shadow-lg`}
                              onClick={() => {
                                updateBranchOrderStatus(order.id, 'approved', currentUser?.name || 'Administrador Central');
                                toast.success(isDiscrepancy ? 'Divergência tratada e pedido re-enviado!' : 'Pedido aprovado e enviado para separação!');
                              }}
                            >
                              <CheckCircle2 size={16} className="mr-2" /> {isDiscrepancy ? 'Aprovar Revisão' : 'Aprovar'}
                            </Button>
                          </>
                        ) : order.status !== 'rejected' && order.status !== 'delivered' ? (
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border-red-800/50 font-bold h-8 px-2.5 rounded-md text-xs transition-colors"
                              onClick={() => {
                                updateBranchOrderStatus(order.id, 'rejected', currentUser?.name || 'Administrador Central');
                                toast.info(`Pedido #${order.id.toUpperCase()} cancelado.`);
                              }}
                            >
                              <XCircle size={14} className="mr-1" /> Cancelar Pedido
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium italic pr-4">
                            {order.status === 'rejected' ? 'Cancelado / Rejeitado' : 'Entregue'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <p className="text-slate-500 font-medium italic">Nenhum pedido encontrado nesta categoria.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
         </div>
         <Pagination
           currentPage={currentPage}
           totalPages={Math.ceil(filteredOrders.length / 15)}
           onPageChange={setCurrentPage}
           totalItems={filteredOrders.length}
           itemsPerPage={15}
         />
        </CardContent>
      </Card>
    </div>
  );
}

function InvoicingTab() {
  const { branchOrders, branches, products, updateBranchOrderStatus, currentUser, settings } = useRamoxContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [labelOrderPrompt, setLabelOrderPrompt] = useState<any>(null);
  const [labelCount, setLabelCount] = useState<number>(1);

  const getStatusLabelAndBadge = (status: string) => {
    switch (status) {
      case 'picked':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Aguardando Faturamento</Badge>;
      case 'invoiced':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Faturado & Liberado</Badge>;
      case 'loading':
        return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Para Embarque / Carregando</Badge>;
      case 'shipped':
        return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Despachado / Em Trânsito</Badge>;
      case 'delivered':
        return <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/30">Entregue</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-450 border-slate-500/20">{status}</Badge>;
    }
  };

  const filterByDate = (order: any) => {
    if (dateFilter === 'all') return true;
    if (!order.createdAt) return true;
    try {
      const orderTime = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      const diffTime = now - orderTime;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (dateFilter === '7days') return diffDays <= 7;
      if (dateFilter === '30days') return diffDays <= 30;
    } catch (e) {
      return true;
    }
    return true;
  };

  const filteredOrders = branchOrders.filter(order => {
    // Only orders that are at least picked (checked) or downstream
    const allowedStatuses = ['picked', 'invoiced', 'loading', 'shipped', 'delivered'];
    if (!allowedStatuses.includes(order.status)) return false;

    // Filter by status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && order.status !== 'picked') return false;
      if (statusFilter === 'invoiced' && order.status !== 'invoiced') return false;
      if (statusFilter === 'shipped_loading' && !['loading', 'shipped', 'delivered'].includes(order.status)) return false;
    }

    // Filter by search query (ID or branch name)
    const branch = branches.find(b => b.id === order.branchId);
    const branchName = (branch?.name || '').toLowerCase();
    const branchLocation = (branch?.location || '').toLowerCase();
    const idMatch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = branchName.includes(searchQuery.toLowerCase()) || branchLocation.includes(searchQuery.toLowerCase());
    if (searchQuery && !idMatch && !nameMatch) return false;

    // Filter by date
    return filterByDate(order);
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * 15, currentPage * 15);

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <Card className="border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
          <div className="flex-1 min-w-[280px]">
            <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Buscar Pedido</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por ID do pedido ou nome da filial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="w-full md:w-[220px]">
            <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Status de Faturamento</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">Todos os Pedidos</SelectItem>
                <SelectItem value="pending">Aguardando Faturamento</SelectItem>
                <SelectItem value="invoiced">Somente Faturados</SelectItem>
                <SelectItem value="shipped_loading">Despachados / Trânsito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-[200px]">
            <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Período de Emissão</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                <SelectValue placeholder="Selecionar Período" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">Todo o Histórico</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <span>Faturamento & Romaneios</span>
                <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{filteredOrders.length} Encontrado(s)</Badge>
              </CardTitle>
              <p className="text-sm text-slate-400">Controle integrado de faturamento de pedidos e geração de romaneios para transporte inter-filiais.</p>
            </div>
            <ExportExcelModal
              title="Exportar Faturamento & Romaneios"
              description="Exporte o relatório dos pedidos faturados com número de NF-e, romaneios e valores."
              data={filteredOrders.map(o => {
                const branch = branches.find(b => b.id === o.branchId);
                const total = o.items.reduce((acc, item) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return acc + (p ? p.price * item.quantity : 0);
                }, 0);
                return {
                  IDPedido: o.id.toUpperCase(),
                  Filial: branch?.name || 'N/A',
                  DataSolicitacao: new Date(o.createdAt).toLocaleDateString('pt-BR'),
                  StatusFaturamento: o.invoiced ? 'Faturado' : 'Aguardando Faturamento',
                  NumeroNFe: o.invoiceNumber || 'Pendente',
                  DataFaturamento: o.invoicedAt ? new Date(o.invoicedAt).toLocaleDateString('pt-BR') : 'N/A',
                  ValorTotal: total
                };
              })}
              defaultFilename="faturamento_e_romaneios"
              sheetName="Faturamento"
              columns={[
                { key: 'IDPedido', label: 'ID Pedido' },
                { key: 'Filial', label: 'Filial' },
                { key: 'DataSolicitacao', label: 'Data Solicitação' },
                { key: 'StatusFaturamento', label: 'Status Faturamento' },
                { key: 'NumeroNFe', label: 'Número NF-e' },
                { key: 'DataFaturamento', label: 'Data Faturamento' },
                { key: 'ValorTotal', label: 'Valor Total (R$)' },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">ID Pedido</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Filial</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Data Solic.</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Status Faturamento</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Valor</TableHead>
                <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map(order => {
                const branch = branches.find(b => b.id === order.branchId);
                const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A';
                return (
                  <TableRow key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-cyan-450 text-cyan-400">#{order.id.toUpperCase()}</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="font-bold text-slate-200 text-xs break-words">{branch?.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest break-words">{branch?.location}</div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs font-medium whitespace-nowrap">{orderDate}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getStatusLabelAndBadge(order.status)}
                    </TableCell>
                    <TableCell className="font-bold text-white text-xs whitespace-nowrap">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex items-center justify-end gap-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-slate-950 border-slate-800 text-cyan-400 hover:bg-slate-900 border font-bold h-9 px-3 rounded-md"
                          onClick={() => {
                            const orderBranch = branches.find(b => b.id === order.branchId);
                            generateRomaneioPDF(order, orderBranch, products, order.approvedBy || currentUser?.name || 'Supervisor Admin', settings?.companyLogo);
                            toast.success('Romaneio de entrega exportado!');
                          }}
                        >
                          <FileText size={14} className="mr-1.5" /> Romaneio PDF
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 border font-bold h-9 px-3 rounded-md"
                          onClick={() => {
                            setLabelOrderPrompt(order);
                            setLabelCount(1);
                          }}
                        >
                          <Printer size={14} className="mr-1.5" /> Etiqueta Caixa
                        </Button>
                        
                        {order.status === 'picked' ? (
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold h-9 px-6 rounded-md shadow-lg shadow-emerald-500/20 border-none"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsInvoiceModalOpen(true);
                            }}
                          >
                            <FileCheck size={14} className="mr-1.5" /> Faturar
                          </Button>
                        ) : (
                          <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> Faturado
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                      <FileText size={48} className="text-slate-800" />
                      <p className="text-lg font-medium">Nenhum registro encontrado.</p>
                      <p className="text-sm text-slate-600">Altere os filtros acima para pesquisar pedidos com outros status de faturamento ou datas.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
         </div>
         <Pagination
           currentPage={currentPage}
           totalPages={Math.ceil(filteredOrders.length / 15)}
           onPageChange={setCurrentPage}
           totalItems={filteredOrders.length}
           itemsPerPage={15}
         />
        </CardContent>
      </Card>

      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-slate-900 border border-slate-800 text-white p-6 rounded-lg shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <FileCheck className="text-emerald-500" size={24} /> Faturar Pedido #{selectedOrder?.id.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 pt-4">
              {/* Branch & Approval info header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Destinatário & Filial</h4>
                  <p className="text-sm font-semibold text-slate-200 mt-1">
                    {branches.find(b => b.id === selectedOrder.branchId)?.name || 'Filial não encontrada'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Localização: {branches.find(b => b.id === selectedOrder.branchId)?.location || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Gerente da Filial: {branches.find(b => b.id === selectedOrder.branchId)?.manager || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Aprovação & Emissão</h4>
                  <p className="text-sm font-semibold text-slate-200 mt-1">
                    Aprovado por: {selectedOrder.approvedBy || 'Supervisor Administrativo'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Data da Aprovação: {selectedOrder.approvedAt ? new Date(selectedOrder.approvedAt).toLocaleDateString('pt-BR') : 'Hoje'}
                  </p>
                  <p className="text-xs font-bold text-cyan-400">
                    Valor Total: R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Items tables summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Itens do Pedido</h4>
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20 max-h-[300px] overflow-y-auto overflow-x-auto w-full">
                  <Table>
                    <TableHeader className="bg-slate-950/60">
                      <TableRow className="border-b border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 text-xs py-2">Código</TableHead>
                        <TableHead className="text-slate-500 text-xs py-2">Produto</TableHead>
                        <TableHead className="text-slate-500 text-xs py-2">Classificação</TableHead>
                        <TableHead className="text-slate-500 text-xs py-2 text-right">Qtd Solicitada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item: any) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <TableRow key={item.productId} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-colors">
                            <TableCell className="font-mono text-xs text-cyan-400 font-bold py-2.5">{product?.code}</TableCell>
                            <TableCell className="text-xs py-2.5">{product?.name}</TableCell>
                            <TableCell className="text-xs py-2.5 text-slate-400">{product?.category}</TableCell>
                            <TableCell className="text-xs text-right font-bold py-2.5">{item.quantity} {product?.unit}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Process notice */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2.5">
                <p className="text-xs text-emerald-400 leading-relaxed font-semibold">
                  🔍 EXPORTAÇÃO DE ROMANEIO DE TRANSPORTE E ENTREGA:
                </p>
                <div className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                  <p>• O Romaneio PDF gerado contém as informações da filial bem como a identificação do aprovador do pedido.</p>
                  <p>• O documento dispõe de colunas para verificação física organizada de mercadorias.</p>
                  <p>• Contém um campo de preenchimento manual de volumes e caixas expedidas.</p>
                  <p>• Contém campos de assinaturas destinados para o conferente despachante e o recebimento de filial.</p>
                </div>
              </div>

              {/* Modal footer fields/actions */}
              <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setSelectedOrder(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Voltar
                </Button>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 border font-bold"
                    onClick={() => {
                      setLabelOrderPrompt(selectedOrder);
                      setLabelCount(1);
                    }}
                  >
                    <Printer size={16} className="mr-2" /> Etiqueta Caixa
                  </Button>

                  <Button
                    variant="outline"
                    className="bg-slate-950 border-slate-800 text-cyan-400 hover:bg-slate-950 border font-bold"
                    onClick={() => {
                      const orderBranch = branches.find(b => b.id === selectedOrder.branchId);
                      generateRomaneioPDF(selectedOrder, orderBranch, products, selectedOrder.approvedBy || currentUser?.name || 'Supervisor Admin', settings?.companyLogo);
                      toast.success('Romaneio de entrega exportado!');
                    }}
                  >
                    <Download size={16} className="mr-2" /> Exportar Romaneio PDF
                  </Button>
                  
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold"
                    onClick={() => {
                      // Mark as invoiced
                      updateBranchOrderStatus(selectedOrder.id, 'invoiced');
                      
                      // Automatically export Romaneio PDF on invoicing
                      const orderBranch = branches.find(b => b.id === selectedOrder.branchId);
                      generateRomaneioPDF(selectedOrder, orderBranch, products, selectedOrder.approvedBy || currentUser?.name || 'Supervisor Admin', settings?.companyLogo);
                      
                      toast.success('Pedido faturado e Romaneio gerado com sucesso!');
                      setIsInvoiceModalOpen(false);
                      setSelectedOrder(null);
                    }}
                  >
                    <FileCheck size={16} className="mr-2" /> Faturar & Emitir Romaneio
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
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
                const br = branches.find(b => b.id === labelOrderPrompt.branchId);
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
              <Label htmlFor="admin-label-count-input" className="text-xs font-bold text-slate-300 uppercase tracking-wide">
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
                  id="admin-label-count-input"
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
              Não, cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const orderBranch = branches.find(b => b.id === labelOrderPrompt.branchId);
                generateBoxLabelPDF(labelOrderPrompt, orderBranch, labelCount, settings?.companyLogo);
                toast.success(`${labelCount} etiqueta(s) A4 gerada(s) para o Pedido #${labelOrderPrompt.id.toUpperCase()}!`);
                setLabelOrderPrompt(null);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 shadow-lg shadow-amber-500/20"
            >
              <Printer size={16} className="mr-2" /> Sim, Gerar {labelCount} Etiqueta(s) PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
