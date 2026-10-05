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
import { Edit, Package, Trash2, Save, RotateCw } from 'lucide-react';
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
    minStock: 0,
    image: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        category: product.category || '',
        unit: product.unit || 'un',
        price: product.price ?? 0,
        currentStock: product.currentStock ?? 0,
        minStock: product.minStock ?? 0,
        image: product.image || ''
      });
    }
  }, [product, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

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
        image: formData.image || ''
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
              <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
                Categoria *
              </Label>
              <Select
                value={formData.category}
                onValueChange={v => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="h-11 rounded-md bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {(productClassifications || []).map(c => (
                    <SelectItem key={c} value={c} className="focus:bg-slate-700 text-white cursor-pointer">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-cyan-400 tracking-widest">
              Foto do Produto
            </Label>
            <div className="flex items-center gap-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <div className="w-16 h-16 rounded-md bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Package size={24} className="text-slate-600" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="h-10 text-xs bg-slate-800 border-slate-700 text-slate-300 file:bg-slate-700 file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:text-xs"
                />
                {formData.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2"
                  >
                    <Trash2 size={12} className="mr-1" /> Remover Imagem
                  </Button>
                )}
              </div>
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
