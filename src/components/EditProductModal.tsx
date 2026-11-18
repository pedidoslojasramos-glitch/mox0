import React, { useState, useEffect } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import { Product } from '../types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Edit, Save, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedProduct: Product) => void;
}

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess
}: EditProductModalProps) {
  const { updateProduct, productClassifications } = useRamoxContext();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    unit: 'un',
    price: 0,
    currentStock: 0,
    minStock: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        category: product.category || '',
        unit: product.unit || 'un',
        price: product.price ?? 0,
        currentStock: product.currentStock ?? 0,
        minStock: product.minStock ?? 0
      });
      setIsCustomCategory(false);
    }
  }, [product, isOpen]);

  const handleSave = async () => {
    if (!product) return;

    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim();
    const category = formData.category.trim();

    if (!trimmedName || !trimmedCode || !category) {
      toast.error('Preencha os campos obrigatórios (Nome, Código e Categoria).');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Product> = {
        name: trimmedName,
        code: trimmedCode,
        category: category,
        unit: formData.unit || 'un',
        price: Number(formData.price) || 0,
        currentStock: Number(formData.currentStock) || 0,
        minStock: Number(formData.minStock) || 0,
        image: ''
      };

      const success = await updateProduct(product.id, payload);

      if (success !== false) {
        toast.success(`Produto "${trimmedName}" atualizado com sucesso!`);
        if (onSuccess) {
          onSuccess({ ...product, ...payload });
        }
        onClose();
      } else {
        toast.error('Não foi possível salvar as alterações no banco de dados.');
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro inesperado ao salvar alterações do produto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] bg-slate-900 border-slate-800 text-white rounded-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Edit className="text-cyan-400" size={22} />
            <span>Editar Produto</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                Nome do Produto *
              </Label>
              <Input
                className="h-11 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Arroz 5kg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                Código *
              </Label>
              <Input
                className="h-11 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50 font-mono"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: ARR001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                  Categoria *
                </Label>
                <button 
                  type="button" 
                  onClick={() => setIsCustomCategory(!isCustomCategory)} 
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  {isCustomCategory ? 'Selecionar da Lista' : '+ Nova Categoria'}
                </button>
              </div>
              {isCustomCategory ? (
                <Input
                  className="h-11 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Digite a nova categoria..."
                />
              ) : (
                <Select
                  value={formData.category}
                  onValueChange={v => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="h-11 rounded-md bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {/* Always include current category if not in list */}
                    {formData.category && !(productClassifications || []).includes(formData.category) && (
                      <SelectItem value={formData.category} className="focus:bg-slate-700 text-white cursor-pointer">
                        {formData.category}
                      </SelectItem>
                    )}
                    {(productClassifications || []).map(c => (
                      <SelectItem key={c} value={c} className="focus:bg-slate-700 text-white cursor-pointer">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                Unidade de Medida
              </Label>
              <Select
                value={formData.unit}
                onValueChange={v => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger className="h-11 rounded-md bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="un" className="focus:bg-slate-700 text-white cursor-pointer">Unidade (un)</SelectItem>
                  <SelectItem value="kg" className="focus:bg-slate-700 text-white cursor-pointer">Quilo (kg)</SelectItem>
                  <SelectItem value="cx" className="focus:bg-slate-700 text-white cursor-pointer">Caixa (cx)</SelectItem>
                  <SelectItem value="lt" className="focus:bg-slate-700 text-white cursor-pointer">Litro (lt)</SelectItem>
                  <SelectItem value="par" className="focus:bg-slate-700 text-white cursor-pointer">Par (par)</SelectItem>
                  <SelectItem value="pct" className="focus:bg-slate-700 text-white cursor-pointer">Pacote (pct)</SelectItem>
                  <SelectItem value="fdo" className="focus:bg-slate-700 text-white cursor-pointer">Fardo (fdo)</SelectItem>
                  <SelectItem value="m" className="focus:bg-slate-700 text-white cursor-pointer">Metro (m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                Preço Unit. (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-11 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Math.max(0, parseFloat(e.target.value) || 0) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                Estoque Atual
              </Label>
              <Input
                type="number"
                min="0"
                className="h-11 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                value={formData.currentStock}
                onChange={e => setFormData({ ...formData, currentStock: Math.max(0, parseInt(e.target.value) || 0) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                Estoque Mínimo
              </Label>
              <Input
                type="number"
                min="0"
                className="h-11 rounded-md bg-slate-800 border-slate-700 text-white focus:border-cyan-500/50"
                value={formData.minStock}
                onChange={e => setFormData({ ...formData, minStock: Math.max(0, parseInt(e.target.value) || 0) })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-800 gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-11 px-6 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 hover:bg-cyan-400 text-white h-11 px-8 rounded-md font-bold shadow-lg shadow-cyan-500/20 border-none flex items-center gap-2 cursor-pointer"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RotateCw size={16} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Salvar Alterações</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
