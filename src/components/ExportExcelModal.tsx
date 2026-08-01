import React, { useState } from 'react';
import { Download, FileSpreadsheet, Check, RefreshCw } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { exportToExcel } from '../utils/excelUtils';

export interface ExportColumnOption {
  key: string;
  label: string;
}

interface ExportExcelModalProps {
  title: string;
  description?: string;
  data: Record<string, any>[];
  defaultFilename: string;
  sheetName?: string;
  columns?: ExportColumnOption[];
  triggerText?: string;
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function ExportExcelModal({
  title,
  description = 'Exporte os dados em formato de planilha Excel (.xlsx)',
  data,
  defaultFilename,
  sheetName = 'Dados',
  columns,
  triggerText = 'Exportar Planilha',
  variant = 'outline',
  size = 'sm',
  className = '',
}: ExportExcelModalProps) {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState(defaultFilename);
  const [isExporting, setIsExporting] = useState(false);

  // If columns are provided, allow filtering columns
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    columns ? columns.map((c) => c.key) : []
  );

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (columns) setSelectedKeys(columns.map((c) => c.key));
  };

  const deselectAll = () => {
    setSelectedKeys([]);
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado disponível para exportar.');
      return;
    }

    if (!filename.trim()) {
      toast.error('Informe um nome para o arquivo.');
      return;
    }

    setIsExporting(true);

    try {
      let exportData = data;

      // Filter columns if keys selected
      if (columns && selectedKeys.length > 0) {
        exportData = data.map((row) => {
          const filteredRow: Record<string, any> = {};
          columns.forEach((col) => {
            if (selectedKeys.includes(col.key)) {
              filteredRow[col.label] = row[col.key] ?? '';
            }
          });
          return filteredRow;
        });
      }

      exportToExcel(exportData, filename, sheetName);
      toast.success(`Planilha "${filename}.xlsx" exportada com sucesso! (${exportData.length} registros)`);
      setOpen(false);
    } catch (err) {
      toast.error('Falha ao exportar planilha Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} size={size} className={`gap-2 ${className}`}>
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>{triggerText}</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileSpreadsheet className="text-emerald-600" size={22} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary badge */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-600 font-medium">Registros a exportar:</div>
            <div className="text-sm font-bold text-slate-900 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
              {data.length} {data.length === 1 ? 'linha' : 'linhas'}
            </div>
          </div>

          {/* Filename input */}
          <div className="space-y-1.5">
            <Label htmlFor="filename" className="text-xs font-semibold text-slate-700">
              Nome do Arquivo (.xlsx)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="nome_do_arquivo"
                className="font-mono text-sm"
              />
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-2 border rounded-md">
                .xlsx
              </span>
            </div>
          </div>

          {/* Column selection if columns given */}
          {columns && columns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Colunas para Incluir na Planilha
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Marcar todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Desmarcar todas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-2 bg-slate-50 border rounded-lg">
                {columns.map((col) => {
                  const isChecked = selectedKeys.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleKey(col.key)}
                      className={`flex items-center gap-2 p-1.5 rounded text-left text-xs transition-colors border ${
                        isChecked
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-medium'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center text-white ${
                          isChecked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check size={12} />}
                      </div>
                      <span className="truncate">{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCw className="animate-spin" size={16} /> Exportando...
              </>
            ) : (
              <>
                <Download size={16} /> Exportar Planilha
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
