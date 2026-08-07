import React, { useState, useEffect, useMemo } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import ImportExcelModal from '../components/ImportExcelModal';
import Pagination from '../components/Pagination';
import { SearchableSelect } from '../components/SearchableSelect';
import { exportToExcel, downloadExcelTemplate } from '../utils/excelUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sliders,
  Search,
  DollarSign,
  Package,
  Save,
  Check,
  Copy,
  Building2,
  Download,
  FileSpreadsheet,
  Layers,
  Filter,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  ListFilter,
  ArrowRight,
  X
} from 'lucide-react';

interface LimitsModuleProps {
  hideHeader?: boolean;
}

export default function LimitsModule({ hideHeader = false }: LimitsModuleProps) {
  const { branches, products, branchLimits, saveBranchLimits, productClassifications } = useRamoxContext();

  // Mode state: 'branch' (single branch edit), 'product' (product matrix across 40 branches), 'matrix' (consolidated 40 branches overview)
  const [activeTab, setActiveTab] = useState<'branch' | 'product' | 'matrix'>('branch');

  // --- MODE 1: BRANCH VIEW STATE ---
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [maxOrderBudget, setMaxOrderBudget] = useState<number>(0);
  const [productLimits, setProductLimits] = useState<{ [productId: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quotaStatusFilter, setQuotaStatusFilter] = useState<'all' | 'with_quota' | 'unlimited'>('all');
  const [replicateBranchIds, setReplicateBranchIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // --- MODE 2: PRODUCT MATRIX VIEW STATE ---
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productBranchSearch, setProductBranchSearch] = useState('');
  const [productBranchLimits, setProductBranchLimits] = useState<{ [branchId: string]: number }>({});
  const [selectedBranchMatrixIds, setSelectedBranchMatrixIds] = useState<string[]>([]);
  const [batchQuotaValue, setBatchQuotaValue] = useState<string>('');

  // --- MODE 3: MATRIX OVERVIEW SEARCH ---
  const [overviewSearch, setOverviewSearch] = useState('');

  // Initialize selected branch when component mounts or branches change
  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches]);

  // Initialize selected product for mode 2
  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  // Load limits for the selected branch (Mode 1)
  useEffect(() => {
    setReplicateBranchIds([]);
    if (selectedBranchId) {
      const existingLimits = branchLimits?.find(l => l.branchId === selectedBranchId);
      if (existingLimits) {
        setMaxOrderBudget(existingLimits.maxOrderBudget || 0);
        setProductLimits(existingLimits.productMonthlyLimits || {});
      } else {
        setMaxOrderBudget(0);
        setProductLimits({});
      }
    } else {
      setMaxOrderBudget(0);
      setProductLimits({});
    }
  }, [selectedBranchId, branchLimits]);

  // Load product matrix limits across all branches (Mode 2)
  useEffect(() => {
    if (selectedProductId) {
      const matrixMap: { [branchId: string]: number } = {};
      branches.forEach(b => {
        const limits = branchLimits?.find(l => l.branchId === b.id);
        const q = limits?.productMonthlyLimits?.[selectedProductId] || 0;
        matrixMap[b.id] = q;
      });
      setProductBranchLimits(matrixMap);
      // Default select all branches for batch assignment ease
      setSelectedBranchMatrixIds(branches.map(b => b.id));
    }
  }, [selectedProductId, branchLimits, branches]);

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const otherBranches = branches.filter(b => b.id !== selectedBranchId);
  const selectedProductObj = products.find(p => p.id === selectedProductId);

  // --- HANDLERS MODE 1 ---
  const handleToggleReplicate = (branchId: string) => {
    setReplicateBranchIds(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSelectAllReplicate = () => {
    setReplicateBranchIds(otherBranches.map(b => b.id));
  };

  const handleClearReplicate = () => {
    setReplicateBranchIds([]);
  };

  const handleProductLimitChange = (productId: string, value: string) => {
    const qty = parseInt(value, 10);
    setProductLimits(prev => ({
      ...prev,
      [productId]: isNaN(qty) ? 0 : Math.max(0, qty)
    }));
  };

  const handleSaveBranchLimits = () => {
    if (!selectedBranchId) {
      toast.error('Selecione uma filial para salvar os limites.');
      return;
    }

    saveBranchLimits(selectedBranchId, maxOrderBudget, productLimits);

    if (replicateBranchIds.length > 0) {
      replicateBranchIds.forEach(id => {
        saveBranchLimits(id, maxOrderBudget, productLimits);
      });
      toast.success(`Limites salvos para "${selectedBranch?.name}" e replicados para ${replicateBranchIds.length} filial(ais)!`);
    } else {
      toast.success(`Limites de cota para "${selectedBranch?.name}" salvos com sucesso!`);
    }
  };

  // --- HANDLERS MODE 2 (PRODUCT MATRIX) ---
  const handleToggleBranchMatrix = (branchId: string) => {
    setSelectedBranchMatrixIds(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSelectAllMatrixBranches = () => {
    setSelectedBranchMatrixIds(branches.map(b => b.id));
  };

  const handleDeselectAllMatrixBranches = () => {
    setSelectedBranchMatrixIds([]);
  };

  const handleSingleBranchQuotaChange = (branchId: string, value: string) => {
    const qty = parseInt(value, 10);
    setProductBranchLimits(prev => ({
      ...prev,
      [branchId]: isNaN(qty) ? 0 : Math.max(0, qty)
    }));
  };

  const handleApplyBatchQuota = () => {
    if (selectedBranchMatrixIds.length === 0) {
      toast.error('Selecione ao menos uma filial para aplicar a cota em lote.');
      return;
    }
    const val = parseInt(batchQuotaValue, 10);
    const newQty = isNaN(val) ? 0 : Math.max(0, val);

    setProductBranchLimits(prev => {
      const updated = { ...prev };
      selectedBranchMatrixIds.forEach(bId => {
        updated[bId] = newQty;
      });
      return updated;
    });

    toast.success(`Cota de ${newQty} un aplicada para ${selectedBranchMatrixIds.length} filiais selecionadas!`);
  };

  const handleZeroSelectedBranches = () => {
    if (selectedBranchMatrixIds.length === 0) {
      toast.error('Selecione ao menos uma filial.');
      return;
    }
    setProductBranchLimits(prev => {
      const updated = { ...prev };
      selectedBranchMatrixIds.forEach(bId => {
        updated[bId] = 0;
      });
      return updated;
    });
    toast.info(`Cotas zeradas para ${selectedBranchMatrixIds.length} filiais.`);
  };

  const handleSaveProductMatrix = () => {
    if (!selectedProductId) {
      toast.error('Selecione um produto.');
      return;
    }

    // Update each branch's productMonthlyLimits for this selectedProductId
    let updatedCount = 0;
    branches.forEach(b => {
      const existing = branchLimits?.find(l => l.branchId === b.id);
      const budget = existing?.maxOrderBudget || 0;
      const currentLimits = { ...(existing?.productMonthlyLimits || {}) };

      currentLimits[selectedProductId] = productBranchLimits[b.id] || 0;
      saveBranchLimits(b.id, budget, currentLimits);
      updatedCount++;
    });

    toast.success(`Cotas do produto "${selectedProductObj?.name}" salvas para todas as ${updatedCount} filiais!`);
  };

  // --- EXPORT TO EXCEL FEATURE ---
  const handleExportFullLimitsExcel = () => {
    const exportRows: any[] = [];

    branches.forEach(b => {
      const limits = branchLimits?.find(l => l.branchId === b.id);
      const budget = limits?.maxOrderBudget || 0;
      const pLimits = limits?.productMonthlyLimits || {};

      products.forEach(p => {
        const cota = pLimits[p.id] || 0;
        exportRows.push({
          'Código Filial': b.code || `FIL-${b.id.substring(0, 4)}`,
          'Nome Filial': b.name,
          'Gerente / Resp.': b.manager,
          'Localização': b.location,
          'Verba Máxima por Pedido (R$)': budget > 0 ? budget : 'Ilimitado',
          'Código Produto': p.code,
          'Nome do Produto': p.name,
          'Categoria': p.category,
          'Preço Unit. (R$)': p.price,
          'Cota Mensal (Unid)': cota > 0 ? cota : 'Ilimitado',
          'Status Cota': cota > 0 ? 'Cota Configurada' : 'Livre / Ilimitado'
        });
      });
    });

    exportToExcel(exportRows, `Matriz_Cotas_Limites_Filiais_${new Date().toISOString().split('T')[0]}.xlsx`, 'Matriz_Cotas');
    toast.success('Relatório completo de cotas exportado com sucesso!');
  };

  // Download CSV template specifically
  const handleDownloadCsvTemplate = () => {
    const sampleBranch = branches[0];
    const sampleProd = products[0];
    downloadExcelTemplate(
      [
        { header: 'Codigo_Filial', example: sampleBranch?.code || 'FIL-001' },
        { header: 'Nome_Filial', example: sampleBranch?.name || 'Lojas Ramos - Filial Matriz' },
        { header: 'Codigo_Produto', example: sampleProd?.code || 'PROD-101' },
        { header: 'Nome_Produto', example: sampleProd?.name || 'Papel A4 Sulfite Report 75g' },
        { header: 'Cota_Mensal_Unidades', example: '20' },
        { header: 'Verba_Maxima_Pedido', example: '5000.00' },
      ],
      'modelo_importacao_cotas_limites.xlsx',
      'CotasELimites'
    );
    toast.info('Planilha modelo baixada com sucesso!');
  };

  // --- FILTERED PRODUCTS (MODE 1) ---
  const categories = ['all', ...(productClassifications || [])];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const cota = productLimits[p.id] || 0;
      let matchesStatus = true;
      if (quotaStatusFilter === 'with_quota') {
        matchesStatus = cota > 0;
      } else if (quotaStatusFilter === 'unlimited') {
        matchesStatus = cota === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, quotaStatusFilter, productLimits]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, quotaStatusFilter]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((currentPage - 1) * 15, currentPage * 15);
  }, [filteredProducts, currentPage]);

  // Mode 1 Stats
  const productsWithQuotaCount = useMemo(() => {
    return Object.values(productLimits).filter((q: number) => q > 0).length;
  }, [productLimits]);

  // Mode 2 Filtered Branches
  const filteredMatrixBranches = useMemo(() => {
    const term = productBranchSearch.toLowerCase().trim();
    if (!term) return branches;
    return branches.filter(b =>
      b.name.toLowerCase().includes(term) ||
      b.location.toLowerCase().includes(term) ||
      b.manager.toLowerCase().includes(term) ||
      (b.code && b.code.toLowerCase().includes(term))
    );
  }, [branches, productBranchSearch]);

  // Mode 3 Overview Matrix Data
  const overviewData = useMemo(() => {
    const term = overviewSearch.toLowerCase().trim();
    return branches
      .filter(b =>
        !term ||
        b.name.toLowerCase().includes(term) ||
        b.location.toLowerCase().includes(term) ||
        b.manager.toLowerCase().includes(term)
      )
      .map(b => {
        const limits = branchLimits?.find(l => l.branchId === b.id);
        const budget = limits?.maxOrderBudget || 0;
        const pLimits = limits?.productMonthlyLimits || {};
        const configuredCount = Object.values(pLimits).filter((q: any) => Number(q) > 0).length;
        const totalItemsAllowed = Object.values(pLimits).reduce((acc: number, q: any) => acc + (Number(q) || 0), 0);

        return {
          branch: b,
          budget,
          configuredCount,
          totalItemsAllowed
        };
      });
  }, [branches, branchLimits, overviewSearch]);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Sliders className="text-cyan-400 shrink-0" size={28} />
              Controle de Limites e Cotas das Filiais
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Gerencie verbas máximas por pedido e cotas mensais de produtos para cada uma das {branches.length} filiais da rede.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Import Spreadsheet Modal */}
            <ImportExcelModal
              type="limits"
              triggerText="Importar Planilha"
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-700 hover:border-cyan-500 text-cyan-300 font-bold"
            />

            {/* Download Template */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsvTemplate}
              className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 font-semibold gap-1.5 text-xs"
            >
              <Download size={14} className="text-slate-400" />
              Modelo CSV
            </Button>

            {/* Export Full Excel */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportFullLimitsExcel}
              className="bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 font-bold gap-1.5 text-xs"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              Exportar Matriz Excel
            </Button>
          </div>
        </div>
      )}

      {/* TABS MODE SWITCHER */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('branch')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeTab === 'branch'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 size={16} />
          Visão por Filial
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('product')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeTab === 'product'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Package size={16} />
          Matriz por Produto (Estilo Distribuição)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers size={16} />
          Consolidado das 40 Filiais
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: VISÃO POR FILIAL (INDIVIDUAL)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'branch' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Left column: Branch selection & Replication */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
              <CardHeader className="p-4 md:p-5">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Building2 className="text-cyan-400 shrink-0" size={18} />
                  Selecionar Filial
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Escolha qual das {branches.length} filiais deseja configurar.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-5 pt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="branch-select" className="text-xs font-semibold text-slate-300">
                    Filial de Origem
                  </Label>
                  <SearchableSelect
                    value={selectedBranchId}
                    onChange={setSelectedBranchId}
                    placeholder="Selecione uma filial..."
                    searchPlaceholder="Buscar por nome, código ou cidade..."
                    options={branches.map(b => ({
                      value: b.id,
                      label: b.name,
                      code: b.code,
                      sublabel: b.location
                    }))}
                  />
                </div>

                {selectedBranch && (
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 mt-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Gestor Responsável</span>
                      <span className="text-xs font-bold text-slate-200">{selectedBranch.manager}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Localização</span>
                      <span className="text-xs text-slate-300">{selectedBranch.location}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedBranchId && (
              <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
                <CardHeader className="p-4 md:p-5 pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Copy className="text-cyan-400 shrink-0" size={16} />
                    Copiar Regras em Lote
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Replique estas mesmas regras para outras filiais ao salvar:
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-5 pt-0 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Destinos ({replicateBranchIds.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllReplicate}
                        className="text-[10px] font-black uppercase text-cyan-400 hover:text-cyan-300 cursor-pointer border-none bg-transparent"
                      >
                        Marcar Todas
                      </button>
                      <span className="text-slate-800 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={handleClearReplicate}
                        className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-400 cursor-pointer border-none bg-transparent"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                    {otherBranches.map(b => {
                      const isSelected = replicateBranchIds.includes(b.id);
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => handleToggleReplicate(b.id)}
                          className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-medium text-slate-200 truncate">{b.name}</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isSelected && <Check size={11} strokeWidth={4} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: Budget & Products Editor */}
          <div className="lg:col-span-3 space-y-6">
            {selectedBranchId ? (
              <>
                {/* Financial Budget Card */}
                <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
                  <CardHeader className="p-4 md:p-5">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <DollarSign className="text-cyan-400 shrink-0" size={20} />
                      Verba Limite por Pedido de Abastecimento
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Valor teto em R$ que a filial poderá gastar em uma única requisição.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-5 pt-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 max-w-xl">
                      <div className="space-y-1.5 flex-1">
                        <Label htmlFor="max-budget" className="text-xs font-semibold text-slate-300">
                          Verba Máxima (R$)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-sm">
                            R$
                          </span>
                          <Input
                            id="max-budget"
                            type="number"
                            step="0.01"
                            min="0"
                            value={maxOrderBudget || ''}
                            onChange={(e) => setMaxOrderBudget(parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 5000.00"
                            className="bg-slate-950 border-slate-800 text-slate-100 pl-9 pr-4 focus:ring-cyan-500 font-medium"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">Deixe "0" ou em branco para verba sem limite financeiro.</p>
                      </div>

                      <Button
                        onClick={handleSaveBranchLimits}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black h-10 px-6 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all flex items-center justify-center gap-2 border-none text-xs"
                      >
                        <Save size={16} /> Salvar Configuração
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Products Quotas Card */}
                <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
                  <CardHeader className="border-b border-slate-800/60 p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Package className="text-cyan-400 shrink-0" size={20} />
                          Cotas Unitárias Mensais dos Produtos
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                          Limite máximo de peças que a filial pode solicitar por mês.
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 text-xs px-2.5 py-1">
                          {productsWithQuotaCount} com cota ativa
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 md:p-5 space-y-4">
                    {/* ENHANCED SEARCH & FILTER BAR */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      {/* Search Bar */}
                      <div className="md:col-span-5 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Buscar por nome, código ou categoria..."
                          className="bg-slate-900 border-slate-800 pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:ring-cyan-500"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Category Filter */}
                      <div className="md:col-span-4 flex items-center gap-2">
                        <Filter className="text-slate-500 shrink-0" size={15} />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:ring-cyan-500"
                        >
                          <option value="all">Todas as Categorias</option>
                          {categories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quota Status Filter */}
                      <div className="md:col-span-3 flex items-center gap-2">
                        <ListFilter className="text-slate-500 shrink-0" size={15} />
                        <select
                          value={quotaStatusFilter}
                          onChange={(e) => setQuotaStatusFilter(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:ring-cyan-500"
                        >
                          <option value="all">Todos os Status</option>
                          <option value="with_quota">Com Cota (&gt; 0)</option>
                          <option value="unlimited">Ilimitado / Sem Cota</option>
                        </select>
                      </div>
                    </div>

                    {/* Active Filters Bar */}
                    {(searchTerm || selectedCategory !== 'all' || quotaStatusFilter !== 'all') && (
                      <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-0.5">
                        <p>
                          Exibindo <strong>{filteredProducts.length}</strong> de {products.length} produtos
                        </p>
                        <button
                          type="button"
                          onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setQuotaStatusFilter('all'); }}
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RotateCcw size={12} /> Limpar Filtros
                        </button>
                      </div>
                    )}

                    {/* Products Table */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                          <TableRow className="border-b border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] py-3">Produto</TableHead>
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] hidden sm:table-cell py-3">Categoria</TableHead>
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] py-3">Código / Preço</TableHead>
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] text-right py-3 w-[180px]">Cota Mensal (Unid)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedProducts.length > 0 ? (
                            paginatedProducts.map(p => {
                              const value = productLimits[p.id] !== undefined ? productLimits[p.id] : 0;
                              const hasQuota = value > 0;
                              return (
                                <TableRow key={p.id} className="border-slate-800/60 hover:bg-slate-900/30">
                                  <TableCell className="py-2.5">
                                    <div className="flex items-center gap-3">
                                      {p.image ? (
                                        <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-slate-800 shrink-0" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 font-bold text-[10px] border border-slate-800 shrink-0">
                                          N/A
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-semibold text-slate-100 text-xs sm:text-sm">{p.name}</p>
                                        <p className="text-[11px] text-slate-500">Unidade: {p.unit}</p>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="hidden sm:table-cell py-2.5">
                                    <Badge className="bg-slate-900 border-slate-800 text-slate-400 text-[10px]">
                                      {p.category}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="py-2.5">
                                    <p className="font-mono text-xs font-bold text-slate-400 uppercase">{p.code}</p>
                                    <p className="text-xs text-cyan-400 font-semibold">R$ {p.price.toFixed(2)}</p>
                                  </TableCell>

                                  <TableCell className="text-right py-2.5">
                                    <div className="flex items-center justify-end gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={value || ''}
                                        onChange={(e) => handleProductLimitChange(p.id, e.target.value)}
                                        placeholder="Ilimitado"
                                        className={`w-28 text-center text-xs font-bold ${
                                          hasQuota
                                            ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 focus:ring-cyan-400'
                                            : 'bg-slate-950 border-slate-800 text-slate-300'
                                        }`}
                                      />
                                      <span className="text-[11px] text-slate-500 w-5 shrink-0 text-left">{p.unit}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-slate-500 text-xs py-4">
                                Nenhum produto encontrado com os filtros selecionados.
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

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleSaveBranchLimits}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black h-11 px-8 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 border-none text-xs sm:text-sm"
                      >
                        <Save size={16} /> Salvar Toda a Grade da Filial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-900/60 border-slate-800 shadow-xl border-dashed py-16">
                <CardContent className="flex flex-col items-center justify-center text-center gap-3">
                  <Sliders size={32} className="text-slate-600" />
                  <p className="font-bold text-base text-white">Nenhuma Filial Selecionada</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Selecione uma das filiais no painel à esquerda para carregar e modificar as verbas e cotas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MATRIZ POR PRODUTO (ESTILO MENU DE DISTRIBUIÇÃO)                 */}
      {/* ========================================================================= */}
      {activeTab === 'product' && (
        <div className="space-y-6">
          {/* Top Selector Card */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader className="p-4 md:p-5">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Package className="text-cyan-400 shrink-0" size={20} />
                Seleção do Produto para Cadastro de Cotas em Lote
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Selecione um item do catálogo e defina as cotas simultaneamente para cada uma das {branches.length} filiais.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-5 pt-0">
              <div className="max-w-2xl space-y-2">
                <Label className="text-xs font-semibold text-slate-300">Produto Alvo</Label>
                <SearchableSelect
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  placeholder="Selecione um produto do catálogo..."
                  searchPlaceholder="Digite nome, código ou categoria do produto..."
                  options={products.map(p => ({
                    value: p.id,
                    label: `${p.code} - ${p.name}`,
                    code: p.category,
                    sublabel: `R$ ${p.price.toFixed(2)} | Unidade: ${p.unit}`
                  }))}
                />
              </div>

              {selectedProductObj && (
                <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {selectedProductObj.image ? (
                      <img src={selectedProductObj.image} alt={selectedProductObj.name} className="w-12 h-12 rounded-lg object-cover border border-slate-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                        N/A
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-white">{selectedProductObj.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-slate-900 border-slate-800 text-slate-400 text-[10px]">
                          {selectedProductObj.category}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">Cód: {selectedProductObj.code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Preço Base</span>
                    <p className="text-sm font-black text-cyan-400">R$ {selectedProductObj.price.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BATCH ACTION CONTROLS (ESTILO MENU DE DISTRIBUIÇÃO) */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader className="p-4 md:p-5 border-b border-slate-800/60">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Sparkles className="text-cyan-400" size={18} />
                    Ações de Atribuição em Lote para Filiais
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    {selectedBranchMatrixIds.length} de {branches.length} filiais selecionadas para alteração rápida.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllMatrixBranches}
                    className="bg-slate-950 border-slate-800 text-cyan-400 hover:bg-slate-900 text-xs font-bold gap-1"
                  >
                    <CheckSquare size={14} /> Selecionar Todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllMatrixBranches}
                    className="bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 text-xs font-semibold gap-1"
                  >
                    <Square size={14} /> Desmarcar
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="space-y-1 flex-1">
                  <Label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Valor da Cota em Lote (Unidades / Mês)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={batchQuotaValue}
                    onChange={(e) => setBatchQuotaValue(e.target.value)}
                    placeholder="Ex: 10 (0 para Ilimitado)"
                    className="bg-slate-900 border-slate-800 text-slate-100 font-bold text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <Button
                    onClick={handleApplyBatchQuota}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs h-9 px-4 gap-1.5"
                  >
                    <ArrowRight size={14} /> Aplicar nas Selecionadas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleZeroSelectedBranches}
                    className="bg-slate-900 border-slate-800 text-rose-400 hover:bg-rose-950/30 text-xs font-bold h-9"
                  >
                    Zerar Selecionadas
                  </Button>
                </div>
              </div>

              {/* Branch Filter Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  value={productBranchSearch}
                  onChange={(e) => setProductBranchSearch(e.target.value)}
                  placeholder="Filtrar filiais por nome, cidade ou responsável..."
                  className="bg-slate-950 border-slate-800 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500"
                />
              </div>

              {/* Branches Grid Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                    <TableRow className="border-b border-slate-800 hover:bg-transparent">
                      <TableHead className="w-10 text-center py-3">
                        <input
                          type="checkbox"
                          checked={selectedBranchMatrixIds.length === branches.length && branches.length > 0}
                          onChange={(e) => e.target.checked ? handleSelectAllMatrixBranches() : handleDeselectAllMatrixBranches()}
                          className="rounded border-slate-700 accent-cyan-500 cursor-pointer"
                        />
                      </TableHead>
                      <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] py-3">Filial</TableHead>
                      <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] py-3">Gerente / Responsável</TableHead>
                      <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] py-3">Localização</TableHead>
                      <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] text-right py-3 w-[200px]">Cota Mensal (Unid)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatrixBranches.map(b => {
                      const isChecked = selectedBranchMatrixIds.includes(b.id);
                      const currentVal = productBranchLimits[b.id] || 0;
                      const hasQuota = currentVal > 0;

                      return (
                        <TableRow
                          key={b.id}
                          className={`border-slate-800/60 transition-colors ${
                            isChecked ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'hover:bg-slate-900/30'
                          }`}
                        >
                          <TableCell className="text-center py-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBranchMatrix(b.id)}
                              className="rounded border-slate-700 accent-cyan-500 cursor-pointer"
                            />
                          </TableCell>

                          <TableCell className="py-2.5">
                            <p className="font-bold text-slate-100 text-xs sm:text-sm">{b.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">{b.code || `FIL-${b.id.substring(0,4)}`}</p>
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-slate-300 font-medium">
                            {b.manager}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-slate-400">
                            {b.location}
                          </TableCell>

                          <TableCell className="text-right py-2.5">
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={currentVal || ''}
                                onChange={(e) => handleSingleBranchQuotaChange(b.id, e.target.value)}
                                placeholder="Ilimitado"
                                className={`w-28 text-center text-xs font-bold ${
                                  hasQuota
                                    ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              />
                              <span className="text-[11px] text-slate-500 w-6 text-left">{selectedProductObj?.unit || 'un'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSaveProductMatrix}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black h-11 px-8 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 border-none text-xs sm:text-sm"
                >
                  <Save size={16} /> Salvar Matriz do Produto para Todas as Filiais
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: CONSOLIDADO DAS 40 FILIAIS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
          <CardHeader className="p-4 md:p-5 border-b border-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Layers className="text-cyan-400" size={20} />
                  Visão Consolidada de Limites das {branches.length} Filiais
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Resumo geral da verba por pedido e quantidade de produtos com cotas ativas por filial.
                </CardDescription>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  value={overviewSearch}
                  onChange={(e) => setOverviewSearch(e.target.value)}
                  placeholder="Buscar filial..."
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-5 space-y-4">
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                  <TableRow className="border-b border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] py-3">Filial</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] py-3">Gerente</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] text-right py-3">Verba por Pedido (R$)</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] text-right py-3">Itens com Cota Ativa</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] text-right py-3">Total Peças Mensais</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[11px] text-center py-3 w-[120px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overviewData.map(row => (
                    <TableRow key={row.branch.id} className="border-slate-800/60 hover:bg-slate-900/40">
                      <TableCell className="py-3">
                        <p className="font-bold text-slate-100 text-xs sm:text-sm">{row.branch.name}</p>
                        <p className="text-[10px] text-slate-500">{row.branch.location}</p>
                      </TableCell>

                      <TableCell className="py-3 text-xs text-slate-300 font-medium">
                        {row.branch.manager}
                      </TableCell>

                      <TableCell className="py-3 text-right font-mono text-xs font-bold text-cyan-400">
                        {row.budget > 0 ? `R$ ${row.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Ilimitado'}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <Badge className={`text-xs ${
                          row.configuredCount > 0 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}>
                          {row.configuredCount} de {products.length} itens
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-200">
                        {row.totalItemsAllowed > 0 ? `${row.totalItemsAllowed} un` : 'Ilimitado'}
                      </TableCell>

                      <TableCell className="text-center py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBranchId(row.branch.id);
                            setActiveTab('branch');
                          }}
                          className="h-8 text-xs text-cyan-400 hover:bg-cyan-500/10 font-bold gap-1"
                        >
                          Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
