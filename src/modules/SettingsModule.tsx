import React, { useState } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import ExportExcelModal from '../components/ExportExcelModal';
import ImportExcelModal from '../components/ImportExcelModal';
import { 
  Settings as SettingsIcon, 
  UserPlus, 
  Image as ImageIcon,
  Users,
  Shield,
  Building,
  Download,
  Play,
  Eye,
  Tag,
  Trash2,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Terminal
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  getSupabase, 
  isSupabaseConfigured 
} from '../lib/supabase';
import { toValidUUID } from '../services/ramoxContext';
import Pagination from '../components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SettingsModule() {
  const { 
    users, 
    addUser, 
    deleteUser,
    settings, 
    updateSettings, 
    branches, 
    addBranch,
    deleteBranch,
    productClassifications,
    addProductClassification,
    deleteProductClassification
  } = useRamoxContext();
  
  const [newClassification, setNewClassification] = useState('');
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const [currentBranchesPage, setCurrentBranchesPage] = useState(1);
  const [currentClassificationsPage, setCurrentClassificationsPage] = useState(1);

  const paginatedUsers = users.slice((currentUsersPage - 1) * 15, currentUsersPage * 15);
  const paginatedBranches = branches.slice((currentBranchesPage - 1) * 15, currentBranchesPage * 15);
  const paginatedClassifications = (productClassifications || []).slice((currentClassificationsPage - 1) * 15, currentClassificationsPage * 15);
  const initialSupabaseConfig = getSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(initialSupabaseConfig.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(initialSupabaseConfig.key);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  const {
    products,
    suppliers,
    branchOrders,
    purchaseOrders
  } = useRamoxContext();

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    toast.success('Credenciais do Supabase salvas com sucesso no navegador!');
  };

  const handleTestSupabaseConnection = async () => {
    const client = getSupabase();
    if (!client) {
      toast.error('Informe a URL e a Chave de API do Supabase e clique em Salvar primeiro.');
      return;
    }
    try {
      const { data, error } = await client.from('branches').select('*').limit(1);
      if (error) {
        toast.error(`Falha na consulta Supabase: ${error.message}. Verifique se rodou o script SQL das tabelas no Supabase.`);
      } else {
        toast.success(`Conexão com Supabase efetuada com sucesso! (${data?.length || 0} registro(s) retornado(s))`);
      }
    } catch (err: any) {
      toast.error(`Erro ao conectar: ${err.message || 'Verifique as credenciais.'}`);
    }
  };

  const handleSyncToSupabase = async () => {
    const client = getSupabase();
    if (!client) {
      toast.error('Supabase não configurado. Insira a URL e a Chave antes de sincronizar.');
      return;
    }

    setIsSyncingSupabase(true);
    try {
      // 1. Sync Branches
      if (branches.length > 0) {
        const payload = branches.map(b => ({
          id: toValidUUID(b.id),
          name: b.name,
          location: b.location || '',
          manager: b.manager || ''
        }));
        await client.from('branches').upsert(payload);
      }

      // 2. Sync Suppliers
      if (suppliers && suppliers.length > 0) {
        const payload = suppliers.map(s => ({
          id: toValidUUID(s.id),
          name: s.name,
          code: s.code,
          cnpj: s.cnpj || '',
          contact: s.contact || ''
        }));
        await client.from('suppliers').upsert(payload);
      }

      // 3. Sync Products
      if (products && products.length > 0) {
        const payload = products.map(p => ({
          id: toValidUUID(p.id),
          name: p.name,
          code: p.code,
          category: p.category,
          unit: p.unit,
          price: p.price,
          current_stock: p.currentStock,
          min_stock: p.minStock,
          image: p.image || ''
        }));
        await client.from('products').upsert(payload);
      }

      // 4. Sync Users (including CARLOS PEREIRA, rr3v, etc.)
      if (users && users.length > 0) {
        const payload = users.map(u => ({
          id: toValidUUID(u.id),
          name: u.name,
          email: u.email,
          role: u.role,
          branch_id: u.branchId ? toValidUUID(u.branchId) : null
        }));
        
        let syncedCount = 0;
        for (const userRow of payload) {
          const { error } = await client.from('users').upsert(userRow, { onConflict: 'email' });
          if (error) {
            console.error(`Erro ao sincronizar usuário ${userRow.name}:`, error);
          } else {
            syncedCount++;
          }
        }
      }

      // 5. Sync Branch Orders
      if (branchOrders && branchOrders.length > 0) {
        const payload = branchOrders.map(o => ({
          id: toValidUUID(o.id),
          branch_id: toValidUUID(o.branchId),
          status: o.status,
          total_value: o.totalValue || 0,
          items: o.items,
          approved_by: o.approvedBy || null,
          approved_at: o.approvedAt || null,
          created_at: o.createdAt
        }));
        await client.from('branch_orders').upsert(payload);
      }

      toast.success('Todos os dados locais (Filiais, Fornecedores, Produtos, Usuários e Pedidos) foram sincronizados com sucesso no Supabase!');
    } catch (err: any) {
      toast.error(`Erro ao sincronizar com Supabase: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleCopySQLScript = () => {
    const sql = `-- SUPABASE SCHEMA SCRIPT FOR LOJAS RAMOS / RAMOX LOGÍSTICA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'branch', 'logistics');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE po_status AS ENUM ('pending', 'approved', 'checked', 'received');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
      'pending', 'approved', 'rejected', 'picking',
      'picked', 'invoiced', 'loading', 'shipped', 'delivered', 'discrepancy'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_count_status AS ENUM ('pending', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  manager TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  cnpj TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'branch',
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  unit TEXT NOT NULL DEFAULT 'un',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Allow public read-write for branches" ON public.branches FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Allow public read-write for suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Allow public read-write for users" ON public.users FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Allow public read-write for products" ON public.products FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Allow public read-write for branch_orders" ON public.branch_orders FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
`;
    navigator.clipboard.writeText(sql);
    toast.success('Script SQL copiado para a área de transferência!');
  };
  
  // User creation state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'branch' as any,
    branchId: ''
  });

  // Branch creation state
  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
    manager: ''
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    addUser({
      ...newUser,
      password: newUser.password || '123456'
    });
    setNewUser({ name: '', email: '', password: '', role: 'branch', branchId: '' });
    toast.success('Usuário criado com sucesso!');
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.location || !newBranch.manager) {
      toast.error('Preencha todos os campos obrigatórios da filial');
      return;
    }
    addBranch(newBranch);
    setNewBranch({ name: '', location: '', manager: '' });
    toast.success('Filial criada com sucesso!');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ companyLogo: reader.result as string });
        toast.success('Logo atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h2>
        <p className="text-slate-500 font-medium">Gerencie usuários, identidade visual e parâmetros globais.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg mb-6">
          <TabsTrigger value="general" className="rounded-lg px-6 flex gap-2">
            <ImageIcon size={16} /> Identidade
          </TabsTrigger>
          <TabsTrigger value="branches" className="rounded-lg px-6 flex gap-2">
            <Building size={16} /> Filiais
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg px-6 flex gap-2">
            <Users size={16} /> Usuários
          </TabsTrigger>
          <TabsTrigger value="classifications" className="rounded-lg px-6 flex gap-2">
            <Tag size={16} /> Classificações
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-lg px-6 flex gap-2">
            <Database size={16} /> Banco de Dados Supabase
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Personalize a aparência do MOX com a marca da sua empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Logo da Empresa</Label>
                <div className="flex items-center gap-8 p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="w-32 h-32 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {settings?.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <ImageIcon size={32} strokeWidth={1.5} />
                        <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Sem Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-slate-500">
                      Envie uma imagem em formato PNG ou JPG. Recomendamos o uso de uma logo com fundo transparente.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="relative overflow-hidden cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleLogoChange}
                        />
                        Alterar Logo
                      </Button>
                      {settings?.companyLogo && (
                        <>
                          <Button 
                            variant="outline" 
                            className="border-slate-200 text-slate-700 hover:bg-slate-100 flex gap-1.5"
                            onClick={() => {
                              try {
                                const link = document.createElement('a');
                                link.href = settings.companyLogo;
                                link.download = 'logo_empresa.png';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success('Logo exportada com sucesso!');
                              } catch (e) {
                                toast.error('Erro ao exportar logo');
                              }
                            }}
                          >
                            <Download size={14} /> Exportar Logo
                          </Button>
                          <Button variant="ghost" className="text-red-500" onClick={() => updateSettings({ companyLogo: '' })}>
                            Remover
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Play size={18} className="text-cyan-500 fill-cyan-500" />
                Vinheta de Abertura do Sistema
              </CardTitle>
              <CardDescription>
                Personalize a vinheta cinematográfica de entrada que é exibida quando um usuário realiza o login no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-slate-900">Ativar Vinheta de Login</Label>
                  <p className="text-xs text-slate-500">Quando habilitada, a animação de introdução será exibida a cada nova sessão de login de usuários.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant={settings?.vignetteEnabled !== false ? "default" : "outline"}
                    className={settings?.vignetteEnabled !== false ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}
                    onClick={() => updateSettings({ vignetteEnabled: true })}
                  >
                    Ativado
                  </Button>
                  <Button
                    type="button"
                    variant={settings?.vignetteEnabled === false ? "default" : "outline"}
                    className={settings?.vignetteEnabled === false ? "bg-slate-300 text-slate-700 hover:bg-slate-400" : ""}
                    onClick={() => updateSettings({ vignetteEnabled: false })}
                  >
                    Desativado
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-900">Três Palavras de Eficiência</Label>
                  <p className="text-xs text-slate-500">Estas três palavras serão exibidas e destacadas de forma sequencial na animação inicial.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => {
                    const defaultWords = ['Agilidade', 'Precisão', 'Controle'];
                    const currentWord = settings?.vignetteWords?.[idx] ?? defaultWords[idx];
                    return (
                      <div key={idx} className="space-y-2">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Palavra {idx + 1}</Label>
                        <Input
                          value={currentWord}
                          onChange={(e) => {
                            const currentWords = [...(settings?.vignetteWords || defaultWords)];
                            currentWords[idx] = e.target.value;
                            updateSettings({ vignetteWords: currentWords });
                          }}
                          placeholder={`Palavra ${idx + 1}`}
                          className="border-slate-200"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  Quer ver como ficou a sua animação com o logotipo e textos novos em tela cheia?
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-2 w-full sm:w-auto"
                  onClick={() => {
                    toast.info("Iniciando visualização da vinheta...");
                    (window as any).triggerMoxVignette?.();
                  }}
                >
                  <Eye size={16} className="text-cyan-500" /> Pré-visualizar Vinheta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus size={20} className="text-brand-600" />
                  Novo Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      value={newUser.name} 
                      onChange={e => setNewUser({...newUser, name: e.target.value})} 
                      placeholder="Ex: Carlos Oliveira"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail (Login)</Label>
                    <Input 
                      type="email"
                      value={newUser.email} 
                      onChange={e => setNewUser({...newUser, email: e.target.value})} 
                      placeholder="carlos@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha de Acesso</Label>
                    <Input 
                      type="text"
                      value={newUser.password} 
                      onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      placeholder="Ex: 123456 (Padrão se em branco)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Acesso</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="logistics">Logística</SelectItem>
                        <SelectItem value="branch">Gerente de Filial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newUser.role === 'branch' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label>Vincular à Filial</Label>
                      <Select value={newUser.branchId} onValueChange={v => setNewUser({...newUser, branchId: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a filial" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 mt-4">
                    Criar Usuário
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Usuários Cadastrados</CardTitle>
                  <CardDescription>Gerencie, importe e exporte os usuários e acessos do sistema.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <ImportExcelModal type="users" triggerText="Importar Excel" />
                  <ExportExcelModal
                    title="Exportar Cadastro de Usuários"
                    description="Faça o download da relação completa de usuários cadastrados."
                    data={users.map(u => ({
                      ID: u.id,
                      Nome: u.name,
                      Email: u.email,
                      Senha: u.password || '123',
                      Funcao: u.role,
                      Filial: branches.find(b => b.id === u.branchId)?.name || 'Global / Sem vínculo'
                    }))}
                    defaultFilename="usuarios_cadastrados"
                    sheetName="Usuarios"
                    columns={[
                      { key: 'ID', label: 'ID do Usuário' },
                      { key: 'Nome', label: 'Nome Completo' },
                      { key: 'Email', label: 'E-mail' },
                      { key: 'Senha', label: 'Senha de Acesso' },
                      { key: 'Funcao', label: 'Nível de Acesso' },
                      { key: 'Filial', label: 'Filial' },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Senha</TableHead>
                        <TableHead>Acesso</TableHead>
                        <TableHead>Vínculo</TableHead>
                        <TableHead className="text-right w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="py-2.5 px-3">
                            <div className="font-medium text-slate-800 text-xs md:text-sm break-words">{u.name}</div>
                            <div className="text-[11px] text-slate-500 break-words">{u.email}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-2.5 px-3">
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                              {u.password || '123'}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-2.5 px-3">
                            <Badge variant="outline" className="capitalize flex w-fit gap-1 items-center text-xs">
                              <Shield size={12} className="text-slate-400" />
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            {u.branchId ? (
                              <span className="text-xs md:text-sm text-slate-600 break-words block">
                                {branches.find(b => b.id === u.branchId)?.name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Global</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap py-2.5 px-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
                              onClick={() => {
                                deleteUser(u.id);
                                toast.success(`Usuário "${u.name}" excluído com sucesso.`);
                              }}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  currentPage={currentUsersPage}
                  totalPages={Math.ceil(users.length / 15)}
                  onPageChange={setCurrentUsersPage}
                  totalItems={users.length}
                  itemsPerPage={15}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branches">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900">
            <Card className="lg:col-span-1 border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building size={20} className="text-cyan-600" />
                  Nova Filial
                </CardTitle>
                <CardDescription>Insira os detalhes para cadastrar uma nova unidade/loja no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBranch} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Nome da Filial</Label>
                    <Input 
                      value={newBranch.name} 
                      onChange={e => setNewBranch({...newBranch, name: e.target.value})} 
                      placeholder="Ex: Filial Sul"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Localização / Endereço</Label>
                    <Input 
                      value={newBranch.location} 
                      onChange={e => setNewBranch({...newBranch, location: e.target.value})} 
                      placeholder="Ex: Av. Ipiranga, 1200 - Porto Alegre"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Gerente Responsável</Label>
                    <Input 
                      value={newBranch.manager} 
                      onChange={e => setNewBranch({...newBranch, manager: e.target.value})} 
                      placeholder="Ex: Roberto Silva"
                      className="border-slate-200"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 mt-4 text-white font-bold">
                    Criar Filial
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Filiais Cadastradas</CardTitle>
                  <CardDescription>Lista de todas as filiais atualmente registradas e ativas no sistema.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <ImportExcelModal type="branches" triggerText="Importar Excel" />
                  <ExportExcelModal
                    title="Exportar Cadastro de Filiais"
                    description="Faça o download da lista completa de filiais e lojas cadastradas."
                    data={branches.map(b => ({
                      ID: b.id,
                      Nome: b.name,
                      Localizacao: b.location,
                      Gerente: b.manager
                    }))}
                    defaultFilename="filiais_cadastradas"
                    sheetName="Filiais"
                    columns={[
                      { key: 'ID', label: 'ID da Filial' },
                      { key: 'Nome', label: 'Nome da Filial' },
                      { key: 'Localizacao', label: 'Localização / Endereço' },
                      { key: 'Gerente', label: 'Gerente Responsável' },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identificação</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Gerente</TableHead>
                        <TableHead className="text-right w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBranches.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 text-xs md:text-sm break-words">{b.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {b.id}</div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            <span className="text-xs md:text-sm text-slate-600 font-medium break-words block">{b.location}</span>
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            <span className="text-xs md:text-sm text-slate-700 font-medium break-words block">{b.manager}</span>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap py-2.5 px-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
                              onClick={() => {
                                deleteBranch(b.id);
                                toast.success(`Filial "${b.name}" excluída com sucesso.`);
                              }}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  currentPage={currentBranchesPage}
                  totalPages={Math.ceil(branches.length / 15)}
                  onPageChange={setCurrentBranchesPage}
                  totalItems={branches.length}
                  itemsPerPage={15}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classifications">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900 animate-in fade-in slide-in-from-top-2 duration-300">
            <Card className="lg:col-span-1 border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag size={20} className="text-cyan-600" />
                  Nova Classificação
                </CardTitle>
                <CardDescription>Crie uma classificação/categoria de produtos para ser selecionada no cadastro de produtos.</CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newClassification.trim()) {
                      toast.error('O nome da classificação não pode estar vazio');
                      return;
                    }
                    addProductClassification(newClassification);
                    setNewClassification('');
                    toast.success('Classificação criada com sucesso!');
                  }} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-slate-700">Nome da Classificação</Label>
                    <Input 
                      value={newClassification} 
                      onChange={e => setNewClassification(e.target.value)} 
                      placeholder="Ex: Alimentos, Bebidas, Higiene"
                      className="border-slate-200"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 mt-4 text-white font-bold">
                    Criar Classificação
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <CardHeader>
                <CardTitle>Classificações Cadastradas</CardTitle>
                <CardDescription>Lista de classificações ativas que serão exibidas durante o cadastro de mercadorias.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classificação</TableHead>
                        <TableHead className="text-right w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productClassifications && paginatedClassifications.map((c) => (
                        <TableRow key={c}>
                          <TableCell>
                            <div className="font-semibold text-slate-800">{c}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              type="button"
                              className="text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg p-0 h-8 w-8 inline-flex items-center justify-center"
                              onClick={() => {
                                deleteProductClassification(c);
                                toast.success(`Classificação "${c}" excluída!`);
                              }}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!productClassifications || productClassifications.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-slate-400 py-8 italic">
                            Nenhuma classificação cadastrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  currentPage={currentClassificationsPage}
                  totalPages={Math.ceil((productClassifications || []).length / 15)}
                  onPageChange={setCurrentClassificationsPage}
                  totalItems={(productClassifications || []).length}
                  itemsPerPage={15}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database">
          <div className="space-y-6 text-slate-900 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Formulario de Conexao Supabase */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <Database size={22} className="text-cyan-600" />
                    Conexão ao Banco de Dados Supabase
                  </CardTitle>
                  <CardDescription>
                    Insira a URL e a Chave de API (Anon Key) do seu projeto Supabase para ativar a sincronização em tempo real na nuvem.
                  </CardDescription>
                </div>
                {isSupabaseConfigured() ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Credenciais Configuradas
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border border-amber-500/30 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" /> Modo Local (localStorage)
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">URL do Projeto Supabase (Project URL)</Label>
                      <Input
                        type="text"
                        placeholder="Ex: https://xxxx.supabase.co"
                        value={supabaseUrlInput}
                        onChange={(e) => setSupabaseUrlInput(e.target.value)}
                        className="bg-white border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Chave Anônima de API (Anon / Public Key)</Label>
                      <Input
                        type="password"
                        placeholder="Ex: eyJhbGciOi..."
                        value={supabaseKeyInput}
                        onChange={(e) => setSupabaseKeyInput(e.target.value)}
                        className="bg-white border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs">
                      <CheckCircle2 size={15} className="mr-1.5" /> Salvar Credenciais
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestSupabaseConnection}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                    >
                      <Play size={15} className="mr-1.5 text-cyan-600" /> Testar Conexão Supabase
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSyncingSupabase}
                      onClick={handleSyncToSupabase}
                      className="border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs"
                    >
                      <Database size={15} className="mr-1.5 text-emerald-600" />
                      {isSyncingSupabase ? 'Sincronizando...' : 'Enviar Todos os Dados Locais para o Supabase'}
                    </Button>
                  </div>
                </form>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Terminal size={16} className="text-cyan-600" />
                        Script de Migração SQL Supabase
                      </h4>
                      <p className="text-xs text-slate-500">
                        Copie este script e cole no <strong>SQL Editor</strong> do painel Supabase (https://supabase.com/dashboard) para criar a estrutura completa de tabelas e permissões RLS.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopySQLScript}
                      className="border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-xs shrink-0"
                    >
                      <Copy size={14} className="mr-1.5" /> Copiar SQL
                    </Button>
                  </div>

                  <div className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
                    <div className="text-slate-400 font-bold">// Tabelas relacionais inclusas na migração Supabase:</div>
                    <div className="text-cyan-400">1. public.branches (Filiais - 40 lojas)</div>
                    <div className="text-cyan-400">2. public.suppliers (Fornecedores & Fábricas)</div>
                    <div className="text-cyan-400">3. public.users (Usuários, Cargos & Acessos)</div>
                    <div className="text-cyan-400">4. public.products (Produtos & Estoque Central)</div>
                    <div className="text-cyan-400">5. public.branch_orders (Pedidos & Solicitações)</div>
                    <div className="text-cyan-400 font-bold mt-2 text-slate-400">// Arquivo de migração gerado: /supabase/schema.sql</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
