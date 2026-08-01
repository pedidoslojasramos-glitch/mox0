import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, XCircle, RefreshCw, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { parseExcelFile, downloadExcelTemplate } from '../utils/excelUtils';
import { useRamoxContext } from '../services/RamoxContextComponent';
import { Product, User, Branch } from '../types';

export type ImportType = 'products' | 'users' | 'branches';

interface ImportExcelModalProps {
  type: ImportType;
  triggerText?: string;
  variant?: 'outline' | 'default' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

export default function ImportExcelModal({
  type,
  triggerText = 'Importar Planilha',
  variant = 'outline',
  size = 'sm',
  className = '',
  onSuccess,
}: ImportExcelModalProps) {
  const { bulkAddProducts, bulkAddUsers, bulkAddBranches, branches: existingBranches } = useRamoxContext();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setInvalidCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getTitle = () => {
    switch (type) {
      case 'products':
        return 'Importar Cadastro de Produtos via Excel';
      case 'users':
        return 'Importar Cadastro de Usuários via Excel';
      case 'branches':
        return 'Importar Cadastro de Filiais via Excel';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'products':
        return 'Carregue uma planilha (.xlsx ou .csv) contendo o catálogo de produtos com código, nome, categoria, preço e estoque.';
      case 'users':
        return 'Carregue uma planilha (.xlsx ou .csv) contendo os usuários do sistema com nome, email, perfil e filial.';
      case 'branches':
        return 'Carregue uma planilha (.xlsx ou .csv) contendo a lista de filiais com nome, localização e responsável.';
    }
  };

  const handleDownloadTemplate = () => {
    if (type === 'products') {
      downloadExcelTemplate(
        [
          { header: 'Codigo', example: 'PROD-9090' },
          { header: 'Nome', example: 'Gabinete Gamer RGB 4x Fans' },
          { header: 'Categoria', example: 'Informática' },
          { header: 'Unidade', example: 'UN' },
          { header: 'Preco', example: '350.00' },
          { header: 'EstoqueAtual', example: '25' },
          { header: 'EstoqueMinimo', example: '5' },
        ],
        'modelo_importacao_produtos.xlsx',
        'Produtos'
      );
    } else if (type === 'users') {
      downloadExcelTemplate(
        [
          { header: 'Nome', example: 'Carlos Operador' },
          { header: 'Email', example: 'carlos.operador@lojasramos.com.br' },
          { header: 'Senha', example: '123456' },
          { header: 'Funcao', example: 'branch' },
          { header: 'Filial', example: 'Filial Centro - SP' },
        ],
        'modelo_importacao_usuarios.xlsx',
        'Usuarios'
      );
    } else if (type === 'branches') {
      downloadExcelTemplate(
        [
          { header: 'Nome', example: 'Filial Zona Sul - SP' },
          { header: 'Localizacao', example: 'Av. Ibirapuera, 1200 - São Paulo, SP' },
          { header: 'Gerente', example: 'Luciana Martins' },
        ],
        'modelo_importacao_filiais.xlsx',
        'Filiais'
      );
    }
    toast.info('Planilha modelo baixada!');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const rawData = await parseExcelFile(selectedFile);

      if (!rawData || rawData.length === 0) {
        toast.error('A planilha está vazia ou não possui dados formatados corretamente.');
        setIsParsing(false);
        return;
      }

      // Validate & normalize data based on type
      let invalids = 0;
      const validated = rawData.map((row: any, idx: number) => {
        let isValid = true;
        let reason = '';
        let processedData: any = {};

        if (type === 'products') {
          const code = String(row['Codigo'] || row['código'] || row['codigo'] || row['Code'] || '').trim();
          const name = String(row['Nome'] || row['nome'] || row['Produto'] || row['Name'] || '').trim();
          const category = String(row['Categoria'] || row['categoria'] || 'Geral').trim();
          const unit = String(row['Unidade'] || row['unidade'] || 'UN').trim();
          const price = parseFloat(String(row['Preco'] || row['preço'] || row['preco'] || row['Price'] || '0').replace(',', '.'));
          const currentStock = parseInt(String(row['EstoqueAtual'] || row['estoque'] || row['estoque_atual'] || '0'), 10);
          const minStock = parseInt(String(row['EstoqueMinimo'] || row['estoque_minimo'] || '0'), 10);

          if (!name) {
            isValid = false;
            reason = 'Nome do produto obrigatório';
          }

          processedData = {
            code: code || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
            name,
            category,
            unit,
            price: isNaN(price) ? 0 : price,
            currentStock: isNaN(currentStock) ? 0 : currentStock,
            minStock: isNaN(minStock) ? 0 : minStock,
          };
        } else if (type === 'users') {
          const name = String(row['Nome'] || row['nome'] || row['Name'] || '').trim();
          const email = String(row['Email'] || row['email'] || '').trim();
          const password = String(row['Senha'] || row['senha'] || row['Password'] || row['password'] || '123456').trim();
          let role = String(row['Funcao'] || row['função'] || row['funcao'] || row['Role'] || row['Perfil'] || 'branch').toLowerCase().trim();

          // normalize role
          if (['admin', 'administrador', 'gerente'].includes(role)) role = 'admin';
          else if (['logistics', 'logística', 'logistica', 'deposito', 'depósito'].includes(role)) role = 'logistics';
          else role = 'branch';

          const branchInput = String(row['Filial'] || row['filial'] || row['Branch'] || '').trim();
          let branchId = '';

          if (branchInput) {
            const foundBranch = existingBranches.find(
              (b) => b.id === branchInput || b.name.toLowerCase().includes(branchInput.toLowerCase())
            );
            if (foundBranch) branchId = foundBranch.id;
            else if (existingBranches.length > 0) branchId = existingBranches[0].id;
          } else if (role === 'branch' && existingBranches.length > 0) {
            branchId = existingBranches[0].id;
          }

          if (!name || !email) {
            isValid = false;
            reason = 'Nome e Email são obrigatórios';
          } else if (!email.includes('@')) {
            isValid = false;
            reason = 'Email inválido';
          }

          processedData = {
            name,
            email,
            password: password || '123456',
            role: role as any,
            branchId: role === 'branch' ? branchId : undefined,
            branchNameDisplay: existingBranches.find((b) => b.id === branchId)?.name || 'N/A',
          };
        } else if (type === 'branches') {
          const name = String(row['Nome'] || row['nome'] || row['Filial'] || row['Name'] || '').trim();
          const location = String(row['Localizacao'] || row['localização'] || row['localizacao'] || row['Cidade'] || '').trim();
          const manager = String(row['Gerente'] || row['gerente'] || row['Responsavel'] || row['responsavel'] || '').trim();

          if (!name) {
            isValid = false;
            reason = 'Nome da filial é obrigatório';
          }

          processedData = {
            name,
            location: location || 'Não informada',
            manager: manager || 'A definir',
          };
        }

        if (!isValid) invalids++;

        return {
          rowIndex: idx + 1,
          isValid,
          reason,
          data: processedData,
        };
      });

      setParsedRows(validated);
      setInvalidCount(invalids);
      toast.success(`${validated.length} linhas lidas da planilha!`);
    } catch (err) {
      toast.error('Erro ao ler planilha. Verifique se o arquivo é um Excel válido.');
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid).map((r) => r.data);

    if (validRows.length === 0) {
      toast.error('Nenhum registro válido para importar.');
      return;
    }

    if (type === 'products') {
      const formattedProducts: Omit<Product, 'id'>[] = validRows.map((p) => ({
        code: p.code,
        name: p.name,
        category: p.category,
        unit: p.unit,
        price: p.price,
        currentStock: p.currentStock,
        minStock: p.minStock,
      }));
      bulkAddProducts(formattedProducts);
      toast.success(`${formattedProducts.length} produtos cadastrados com sucesso!`);
    } else if (type === 'users') {
      const formattedUsers: Omit<User, 'id'>[] = validRows.map((u) => ({
        name: u.name,
        email: u.email,
        password: u.password || '123456',
        role: u.role,
        branchId: u.branchId,
      }));
      bulkAddUsers(formattedUsers);
      toast.success(`${formattedUsers.length} usuários cadastrados com sucesso!`);
    } else if (type === 'branches') {
      const formattedBranches: Omit<Branch, 'id'>[] = validRows.map((b) => ({
        name: b.name,
        location: b.location,
        manager: b.manager,
      }));
      bulkAddBranches(formattedBranches);
      toast.success(`${formattedBranches.length} filiais cadastradas com sucesso!`);
    }

    setOpen(false);
    resetState();
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger
        render={
          <Button variant={variant} size={size} className={`gap-2 ${className}`}>
            <Upload size={16} className="text-blue-600" />
            <span>{triggerText}</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileSpreadsheet className="text-blue-600" size={22} />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
          {/* Download Template Banner */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900">Precisa da planilha modelo?</p>
                <p className="text-[11px] text-blue-700">
                  Baixe o modelo preenchido com as colunas aceitas pelo sistema.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100 text-xs gap-1.5 font-semibold"
            >
              <Download size={14} /> Baixar Modelo
            </Button>
          </div>

          {/* Upload Input Box */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                Clique ou arraste o arquivo Excel (.xlsx, .csv)
              </p>
              <p className="text-xs text-slate-500">Suporta arquivos até 10MB</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" size={20} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} linhas identificadas
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState} className="text-xs text-rose-600 hover:bg-rose-50">
                  Trocar Arquivo
                </Button>
              </div>

              {/* Status summary */}
              <div className="flex gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 gap-1 text-xs">
                  <CheckCircle2 size={12} /> {parsedRows.filter((r) => r.isValid).length} Válidos
                </Badge>
                {invalidCount > 0 && (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-100 gap-1 text-xs">
                    <XCircle size={12} /> {invalidCount} Inválidos (serão ignorados)
                  </Badge>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[260px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12 text-center text-[11px]">Linha</TableHead>
                      <TableHead className="text-[11px]">Status</TableHead>
                      {type === 'products' && (
                        <>
                          <TableHead className="text-[11px]">Código</TableHead>
                          <TableHead className="text-[11px]">Nome</TableHead>
                          <TableHead className="text-[11px]">Categoria</TableHead>
                          <TableHead className="text-[11px] text-right">Preço</TableHead>
                          <TableHead className="text-[11px] text-right">Estoque</TableHead>
                        </>
                      )}
                      {type === 'users' && (
                        <>
                          <TableHead className="text-[11px]">Nome</TableHead>
                          <TableHead className="text-[11px]">Email</TableHead>
                          <TableHead className="text-[11px]">Perfil</TableHead>
                          <TableHead className="text-[11px]">Filial Assodada</TableHead>
                        </>
                      )}
                      {type === 'branches' && (
                        <>
                          <TableHead className="text-[11px]">Nome da Filial</TableHead>
                          <TableHead className="text-[11px]">Localização</TableHead>
                          <TableHead className="text-[11px]">Gerente</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <TableRow key={row.rowIndex} className={!row.isValid ? 'bg-rose-50/50' : ''}>
                        <TableCell className="text-center font-mono text-xs text-slate-500">
                          {row.rowIndex}
                        </TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0" title={row.reason}>
                              Inválido
                            </Badge>
                          )}
                        </TableCell>

                        {type === 'products' && (
                          <>
                            <TableCell className="font-mono text-xs">{row.data.code}</TableCell>
                            <TableCell className="text-xs font-medium">{row.data.name || '-'}</TableCell>
                            <TableCell className="text-xs">{row.data.category}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              R$ {row.data.price?.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono font-bold">
                              {row.data.currentStock}
                            </TableCell>
                          </>
                        )}

                        {type === 'users' && (
                          <>
                            <TableCell className="text-xs font-medium">{row.data.name || '-'}</TableCell>
                            <TableCell className="text-xs font-mono">{row.data.email || '-'}</TableCell>
                            <TableCell className="text-xs capitalize">
                              <Badge variant="outline" className="text-[10px]">
                                {row.data.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {row.data.role === 'branch' ? row.data.branchNameDisplay : 'N/A'}
                            </TableCell>
                          </>
                        )}

                        {type === 'branches' && (
                          <>
                            <TableCell className="text-xs font-bold">{row.data.name || '-'}</TableCell>
                            <TableCell className="text-xs">{row.data.location}</TableCell>
                            <TableCell className="text-xs font-medium text-slate-700">{row.data.manager}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
          <Button variant="outline" onClick={() => { setOpen(false); resetState(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={!file || isParsing || parsedRows.filter((r) => r.isValid).length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <CheckCircle2 size={16} />
            Confirmar Importação ({parsedRows.filter((r) => r.isValid).length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
