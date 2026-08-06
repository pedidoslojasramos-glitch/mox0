import React, { useState, useEffect } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import ExportExcelModal from '../components/ExportExcelModal';
import Pagination from '../components/Pagination';
import { SearchableSelect } from '../components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sliders, Search, DollarSign, Package, Save, Check, Copy } from 'lucide-react';

interface LimitsModuleProps {
  hideHeader?: boolean;
}

export default function LimitsModule({ hideHeader = false }: LimitsModuleProps) {
  const { branches, products, branchLimits, saveBranchLimits, productClassifications } = useRamoxContext();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [maxOrderBudget, setMaxOrderBudget] = useState<number>(0);
  const [productLimits, setProductLimits] = useState<{ [productId: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [replicateBranchIds, setReplicateBranchIds] = useState<string[]>([]);

  // Load limits for the selected branch
  useEffect(() => {
    setReplicateBranchIds([]);
    if (selectedBranchId) {
      const existingLimits = branchLimits?.find(l => l.branchId === selectedBranchId);
      if (existingLimits) {
        setMaxOrderBudget(existingLimits.maxOrderBudget);
        setProductLimits(existingLimits.productMonthlyLimits || {});
      } else {
        // Reset or init empty
        setMaxOrderBudget(0);
        setProductLimits({});
      }
    } else {
      setMaxOrderBudget(0);
      setProductLimits({});
    }
  }, [selectedBranchId, branchLimits]);

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const otherBranches = branches.filter(b => b.id !== selectedBranchId);

  // Toggle replicate branch check
  const handleToggleReplicate = (branchId: string) => {
    setReplicateBranchIds(prev => 
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  // Select all replicate target branches
  const handleSelectAllReplicate = () => {
    setReplicateBranchIds(otherBranches.map(b => b.id));
  };

  // Clear replicate targets
  const handleClearReplicate = () => {
    setReplicateBranchIds([]);
  };

  // Handle single product limit change
  const handleProductLimitChange = (productId: string, value: string) => {
    const qty = parseInt(value, 10);
    setProductLimits(prev => ({
      ...prev,
      [productId]: isNaN(qty) ? 0 : qty
    }));
  };

  const handleSave = () => {
    if (!selectedBranchId) {
      toast.error('Selecione uma filial para salvar os limites.');
      return;
    }
    
    // Save base branch limits
    saveBranchLimits(selectedBranchId, maxOrderBudget, productLimits);
    
    // Replicate same limits to selected branches
    if (replicateBranchIds.length > 0) {
      replicateBranchIds.forEach(id => {
        saveBranchLimits(id, maxOrderBudget, productLimits);
      });
      toast.success(`Limites salvos para "${selectedBranch?.name}" e copiados para mais ${replicateBranchIds.length} filial(ais) com sucesso!`);
    } else {
      toast.success(`Limites de cota para "${selectedBranch?.name}" salvos com sucesso!`);
    }
  };

  const categories = ['all', ...(productClassifications || [])];

  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * 15, currentPage * 15);

  return (
    <div className="space-y-6 md:space-y-8 text-slate-100 font-sans">
      {!hideHeader && (
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2 md:gap-3">
            <Sliders className="text-cyan-500 shrink-0" size={28} />
            Controle de Limites e Cotas
          </h2>
          <p className="text-sm text-slate-400 font-medium">Define limites de quantidade mensal por produto e verba máxima por pedido para cada filial.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Left column: Branch selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg text-white">Selecionar Filial</CardTitle>
              <CardDescription className="text-slate-400 text-xs md:text-sm">Escolha a filial para gerenciar as permissões e cotas.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branch-select" className="text-xs md:text-sm font-semibold text-slate-300">Filial de Origem</Label>
                <SearchableSelect
                  value={selectedBranchId}
                  onChange={setSelectedBranchId}
                  placeholder="Selecione uma filial..."
                  searchPlaceholder="Digite nome, código ou localidade..."
                  options={branches.map(b => ({
                    value: b.id,
                    label: b.name,
                    code: b.code,
                    sublabel: b.location
                  }))}
                />
              </div>

              {selectedBranch && (
                <div className="p-3 md:p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3 mt-4">
                  <div className="space-y-1">
                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Gestor</span>
                    <p className="text-xs md:text-sm text-slate-200 font-medium">{selectedBranch.manager}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Localização</span>
                    <p className="text-xs md:text-sm text-slate-300">{selectedBranch.location}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedBranchId && (
            <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
              <CardHeader className="p-4 md:p-6 pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Copy className="text-cyan-400 shrink-0" size={18} />
                  Copiar Regras para...
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs leading-relaxed">
                  Selecione as filiais abaixo para salvar o orçamento e as cotas simultaneamente nelas também:
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Destinos ({replicateBranchIds.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllReplicate}
                      className="text-[10px] font-black uppercase text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-slate-800 text-[10px]">|</span>
                    <button
                      type="button"
                      onClick={handleClearReplicate}
                      className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-400 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {otherBranches.length > 0 ? (
                    otherBranches.map(b => {
                      const isSelected = replicateBranchIds.includes(b.id);
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => handleToggleReplicate(b.id)}
                          className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.05)]'
                              : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex flex-col flex-1 leading-normal">
                            <span className="text-xs font-bold text-slate-200 break-words">{b.name}</span>
                            <span className="text-[10px] text-slate-500 break-words">{b.manager}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={4} />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-600 text-center py-4">Nenhuma outra filial cadastrada.</p>
                  )}
                </div>

                {replicateBranchIds.length > 0 && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg space-y-1">
                    <p className="text-[9px] font-black tracking-wider text-cyan-400 uppercase">Gravação Simultânea</p>
                    <p className="text-[10px] text-slate-300 leading-normal">
                      Ao clicar em um dos botões de <strong>Salvar</strong>, estes mesmos limites substituirão integralmente as configurações de <strong>{replicateBranchIds.length} filial(ais)</strong> marcada(s).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Limits editor */}
        <div className="lg:col-span-3 space-y-6">
          {selectedBranchId ? (
            <div className="space-y-6">
              {/* Financial/Budget cota card */}
              <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-white flex items-center gap-2">
                    <DollarSign className="text-cyan-400 shrink-0" size={18} md:size={20} />
                    Verba Limite por Pedido
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs md:text-sm">
                    Insira o valor máximo em dinheiro que esta filial poderá gastar em um único pedido de abastecimento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                  <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6 max-w-2xl">
                    <div className="space-y-2 flex-1 w-full">
                      <Label htmlFor="max-budget" className="text-xs md:text-sm font-semibold text-slate-300">
                        Verba Total por Pedido (R$)
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
                      <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">Use "0" ou deixe em branco para liberar pedidos com valor ilimitado.</p>
                    </div>

                    <div className="shrink-0 w-full md:w-auto font-sans">
                      <Button
                        onClick={handleSave}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black h-10 px-6 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex items-center justify-center gap-2 border-none text-xs md:text-sm"
                      >
                        <Save size={16} /> Salvar Configurações
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product cota card */}
              <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
                <CardHeader className="border-b border-slate-800/60 p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl text-white flex items-center gap-2">
                        <Package className="text-cyan-400 shrink-0" size={18} md:size={20} />
                        Cotas de Produtos Unitárias (Mensal)
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs md:text-sm">
                        Limite máximo de unidades que a filial pode solicitar para cada item por mês.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4 font-sans">
                  {/* Search and filter bar */}
                  <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                    <div className="relative w-full lg:max-w-xs xl:max-w-md shrink-0">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={17} />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar produto por nome ou código..."
                        className="bg-slate-950 border-slate-800 pl-10 pr-4 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-500 font-sans"
                      />
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto overflow-x-auto justify-start lg:justify-end py-1 scrollbar-none snap-x -mx-4 px-4 lg:mx-0 lg:px-0">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all border cursor-pointer shrink-0 snap-center ${
                            selectedCategory === cat
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                              : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {cat === 'all' ? 'Ver Todos' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60 w-full overflow-x-auto">
                    <div className="min-w-[640px] md:min-w-full">
                      <Table>
                        <TableHeader className="bg-slate-900/60 border-b border-slate-800">
                          <TableRow className="border-b border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs font-sans px-4 py-3">Produto</TableHead>
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs font-sans hidden md:table-cell px-4 py-3">Categoria</TableHead>
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs font-sans px-4 py-3">Cód. / Preço</TableHead>
                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs font-sans w-[180px] text-right px-4 py-3">Qtd Máxima / Mês</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.length > 0 ? (
                            paginatedProducts.map((p) => {
                              const value = productLimits[p.id] !== undefined ? productLimits[p.id] : 0;
                              return (
                                <TableRow key={p.id} className="border-slate-800/60 hover:bg-slate-900/30">
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {p.image ? (
                                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-800 font-sans shrink-0">
                                          N/A
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-semibold text-slate-100 font-sans text-sm">{p.name}</p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                          <p className="text-xs text-slate-500 font-sans">Unidade: {p.unit}</p>
                                          <span className="md:hidden">
                                            <Badge className="bg-slate-900 border-slate-800 text-[9px] text-slate-400 hover:bg-slate-900 select-none px-1.5 py-0">
                                              {p.category}
                                            </Badge>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell px-4 py-3">
                                    <Badge className="bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-900 select-none text-xs font-sans">
                                      {p.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <p className="font-semibold text-xs text-slate-400 tracking-wider uppercase font-sans">{p.code}</p>
                                    <p className="text-xs text-cyan-400/90 font-bold mt-0.5 font-sans">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    <div className="flex justify-end items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={value || ''}
                                        onChange={(e) => handleProductLimitChange(p.id, e.target.value)}
                                        placeholder="Ilimitado"
                                        className="bg-slate-950 border-slate-800 focus:ring-cyan-500 w-24 sm:w-32 text-center text-slate-100 font-bold font-sans"
                                      />
                                      <span className="text-xs text-slate-500 font-medium w-6 shrink-0 text-left font-sans">{p.unit}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-slate-500 font-medium font-sans px-4 py-3">
                                Nenhum produto encontrado.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredProducts.length / 15)}
                    onPageChange={setCurrentPage}
                    totalItems={filteredProducts.length}
                    itemsPerPage={15}
                  />

                  <div className="flex flex-col sm:flex-row justify-end pt-4 gap-4">
                    <Button
                      onClick={handleSave}
                      className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black h-11 px-8 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 border-none font-sans text-xs md:text-sm"
                    >
                      <Save size={16} /> Salvar Toda a Grade de Limites
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-slate-900/60 border-slate-800 shadow-xl border-dashed py-12 md:py-16">
              <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-4 md:p-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-500">
                  <Sliders size={24} md:size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base md:text-lg text-white font-sans">Nenhuma Filial Selecionada</h3>
                  <p className="text-xs md:text-sm text-slate-400 max-w-sm font-sans mx-auto">Selecione uma das filiais no menu lateral esquerdo para começar a cadastrar e gerenciar as verbas e cotas de produtos.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
