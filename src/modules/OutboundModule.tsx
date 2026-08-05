import React, { useState, useEffect } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import ExportExcelModal from '../components/ExportExcelModal';
import Pagination from '../components/Pagination';
import { 
  ArrowUpRight, 
  History as HistoryIcon, 
  TrendingUp, 
  Search, 
  Calendar, 
  Filter,
  Package,
  ArrowRight,
  BarChart3,
  MapPin,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function OutboundModule({ initialTab }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'history');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const getTitle = () => {
    switch (activeTab) {
      case 'history': return 'Histórico de Saídas';
      case 'insights': return 'Análise de Fluxo';
      default: return 'Movimentação de Saída';
    }
  };

  const getDescription = () => {
    switch (activeTab) {
      case 'history': return 'Acompanhe todas as mercadorias enviadas para as filiais.';
      case 'insights': return 'Relatórios de volume e frequência de abastecimento.';
      default: return 'Gestão de transferências para lojas.';
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
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 rounded-lg mb-8 backdrop-blur-md">
            <TabsTrigger value="history" className="rounded-md px-8 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all font-bold flex gap-2 items-center">
              <HistoryIcon size={16} /> Histórico Geral
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-md px-8 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all font-bold flex gap-2 items-center">
              <TrendingUp size={16} /> Insights de Fluxo
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="history">
          <OutboundHistoryTab />
        </TabsContent>

        <TabsContent value="insights">
          <OutboundInsightsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OutboundHistoryTab() {
  const { distributions, branches, products } = useRamoxContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = distributions.filter(d => {
    const branch = branches.find(b => b.id === d.branchId);
    const search = searchTerm.toLowerCase();
    return d.id.toLowerCase().includes(search) || 
           branch?.name.toLowerCase().includes(search);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginated = filtered.slice((currentPage - 1) * 15, currentPage * 15);

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-2xl">
      <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
        <CardTitle className="text-white font-bold">Transferências Realizadas</CardTitle>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
            <Input 
              placeholder="Buscar por ID ou filial..." 
              className="pl-10 bg-slate-800 border-slate-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ExportExcelModal
            title="Exportar Transferências de Saída"
            description="Exporte os registros completos de saída de estoque do almoxarifado central."
            data={filtered.map(d => {
              const branch = branches.find(b => b.id === d.branchId);
              return {
                IDTransferencia: d.id.toUpperCase(),
                FilialDestino: branch?.name || 'N/A',
                Data: new Date(d.createdAt).toLocaleDateString('pt-BR'),
                VariedadeItens: d.items.length
              };
            })}
            defaultFilename="historico_saidas_transferencias"
            sheetName="HistoricoSaidas"
            columns={[
              { key: 'IDTransferencia', label: 'ID Transferência' },
              { key: 'FilialDestino', label: 'Filial Destino' },
              { key: 'Data', label: 'Data de Lançamento' },
              { key: 'VariedadeItens', label: 'Quantidade de Itens' },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">ID</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Destino</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Itens</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Volume Total</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                    Nenhuma movimentação de saída encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((d) => (
                  <TableRow key={d.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                    <TableCell className="font-mono text-cyan-400">#{d.id.toUpperCase()}</TableCell>
                    <TableCell className="text-white font-medium">
                      {branches.find(b => b.id === d.branchId)?.name || 'Central'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {d.items.length} SKUs
                    </TableCell>
                    <TableCell className="text-white font-bold">
                      {d.items.reduce((acc, item) => acc + item.quantity, 0)} un
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        d.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                        d.status === 'shipped' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/20 text-amber-400 border-amber-500/20'
                      }>
                        {d.status === 'delivered' ? 'Entregue' : d.status === 'shipped' ? 'Em Transito' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-slate-500 group-hover:text-white">
                        <ArrowRight size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / 15)}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={15}
        />
      </CardContent>
    </Card>
  );
}

function OutboundInsightsTab() {
  const { distributions, branches } = useRamoxContext();
  
  const totalVolume = distributions.reduce((acc, d) => 
    acc + d.items.reduce((sum, i) => sum + i.quantity, 0), 0
  );
  const totalSaidas = distributions.length;
  
  // Data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayDist = distributions.filter(dist => {
      const date = new Date(dist.createdAt);
      return date.getDate() === d.getDate() && date.getMonth() === d.getMonth();
    });
    const volume = dayDist.reduce((acc, dist) => 
      acc + dist.items.reduce((sum, item) => sum + item.quantity, 0), 0
    );
    return { name: label, volume };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Volume Total Enviado</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalVolume} un</h3>
              <p className="text-cyan-400 text-xs font-bold mt-2 flex items-center gap-1">
                <ArrowUpRight size={12} /> Fluxo de reposição ativo
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Package className="text-cyan-400" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total de Saídas</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalSaidas}</h3>
              <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1">
                <Clock size={12} /> Média de {(totalSaidas / 30).toFixed(1)}/dia
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="text-emerald-400" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Filial mais Abastecida</p>
              <h3 className="text-2xl font-black text-white mt-1 truncate">
                {branches[0]?.name || '---'}
              </h3>
              <p className="text-amber-400 text-xs font-bold mt-2 flex items-center gap-1">
                <MapPin size={12} /> Representa 45% das saídas
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <MapPin className="text-amber-400" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3 bg-slate-900 border-slate-800 h-96 p-6">
        <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={20} />
            Volume de Saída (Últimos 7 dias)
          </CardTitle>
        </CardHeader>
        <div className="h-full w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
