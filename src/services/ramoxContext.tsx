import React, { useState, useEffect, useRef } from 'react';
import { mockDb, isRecordDeleted } from './mockDb';
import { Product, Supplier, PurchaseOrder, Branch, BranchOrder, User, UserRole, Distribution, DistributionType, BranchLimits } from '../types';
import { getSupabase } from '../lib/supabase';

export function toValidUUID(id: string): string {
  if (!id) {
    return '10000000-1000-4000-8000-100000000000';
  }

  // Check if string is already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }

  // Default mappings for standard mock IDs
  if (id === '1') return '88888888-8888-8888-8888-888888888888';
  if (id === '2') return '99999999-9999-9999-9999-999999999999';
  if (id === '3') return 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if (id === '4') return 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  if (/^\d+$/.test(id)) {
    return `00000000-0000-0000-0000-${id.padStart(12, '0')}`;
  }

  // Deterministic UUID algorithm based on string hashing
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  let strHex = '';
  for (let i = 0; i < id.length; i++) {
    strHex += id.charCodeAt(i).toString(16);
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  strHex = (strHex + hex + '00000000000000000000000000000000').slice(0, 32);

  return `${strHex.slice(0,8)}-${strHex.slice(8,12)}-4${strHex.slice(13,16)}-8${strHex.slice(17,20)}-${strHex.slice(20,32)}`;
}

const DELETED_KEY = 'ramox_deleted_ids_v1';

export function getDeletedIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(DELETED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

export function markAsDeleted(...ids: (string | undefined | null)[]) {
  try {
    if (typeof window === 'undefined') return;
    const set = getDeletedIds();
    ids.forEach(id => {
      if (id) {
        const str = id.toString().trim();
        if (str) {
          set.add(str.toLowerCase());
          const uuid = toValidUUID(str);
          if (uuid) set.add(uuid.toLowerCase());
        }
      }
    });
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function isDeleted(id: string | undefined | null): boolean {
  if (!id) return false;
  if (isRecordDeleted(id)) return true;
  const set = getDeletedIds();
  const clean = id.toString().trim().toLowerCase();
  if (set.has(clean)) return true;
  const uuid = toValidUUID(id.toString()).toLowerCase();
  return set.has(uuid);
}

export function useRamox() {
  const [state, setState] = useState(mockDb.get());
  const [globalSearch, setGlobalSearch] = useState('');
  const isInitialLoadCompleteRef = useRef(false);

  // Initial fetch from Supabase if connected
  useEffect(() => {
    async function loadFromSupabase() {
      const client = getSupabase();
      if (!client) {
        isInitialLoadCompleteRef.current = true;
        return;
      }

      try {
        const [
          { data: dbBranches, error: errBranches },
          { data: dbSuppliers, error: errSuppliers },
          { data: dbProducts, error: errProducts },
          { data: dbUsers, error: errUsers },
          { data: dbBranchOrders, error: errOrders }
        ] = await Promise.all([
          client.from('branches').select('*'),
          client.from('suppliers').select('*'),
          client.from('products').select('*'),
          client.from('users').select('*'),
          client.from('branch_orders').select('*')
        ]);

        if (errUsers) console.warn('Supabase fetch users error:', errUsers);

        setState(prev => {
          let updated = { ...prev };

          if (!errBranches && Array.isArray(dbBranches)) {
            updated.branches = dbBranches
              .filter((b: any) => b && !isDeleted(b.id) && !isDeleted(b.name))
              .map((b: any) => ({
                id: b.id,
                name: b.name,
                location: b.location || '',
                manager: b.manager || ''
              }));
          }

          if (!errSuppliers && Array.isArray(dbSuppliers)) {
            updated.suppliers = dbSuppliers
              .filter((s: any) => s && !isDeleted(s.id) && !isDeleted(s.code) && !isDeleted(s.name))
              .map((s: any) => ({
                id: s.id,
                name: s.name,
                code: s.code,
                cnpj: s.cnpj || '',
                contact: s.contact || ''
              }));
          }

          if (!errProducts && Array.isArray(dbProducts)) {
            updated.products = dbProducts
              .filter((p: any) => p && !isDeleted(p.id) && !isDeleted(p.code) && !isDeleted(p.name))
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                code: p.code,
                category: p.category,
                unit: p.unit,
                price: Number(p.price) || 0,
                currentStock: p.current_stock ?? p.currentStock ?? 0,
                minStock: p.min_stock ?? p.minStock ?? 0,
                image: p.image || ''
              }));
          }

          if (!errUsers && Array.isArray(dbUsers)) {
            updated.users = dbUsers
              .filter((u: any) => u && u.id && !isDeleted(u.id) && !isDeleted(u.email) && !isDeleted(u.name))
              .map((u: any) => ({
                id: u.id,
                name: u.name || 'Usuário',
                email: u.email || '',
                role: u.role || 'branch',
                password: u.password || '123',
                branchId: u.branch_id || undefined
              }));
          }

          if (!errOrders && Array.isArray(dbBranchOrders)) {
            updated.branchOrders = dbBranchOrders
              .filter((o: any) => o && !isDeleted(o.id))
              .map((o: any) => ({
                id: o.id,
                branchId: o.branch_id || o.branchId,
                status: o.status,
                totalValue: Number(o.total_value ?? o.totalValue) || 0,
                items: o.items || [],
                createdAt: o.created_at || o.createdAt,
                approvedBy: o.approved_by || o.approvedBy || undefined,
                approvedAt: o.approved_at || o.approvedAt || undefined
              }));
          }

          mockDb.save(updated);
          return updated;
        });
      } catch (e) {
        console.warn('Erro ao carregar dados do Supabase:', e);
      } finally {
        isInitialLoadCompleteRef.current = true;
      }
    }

    loadFromSupabase();
  }, []);

  // Save to local storage & sync to Supabase on state change
  useEffect(() => {
    mockDb.save(state);

    if (!isInitialLoadCompleteRef.current) {
      return;
    }

    const client = getSupabase();
    if (client) {
      // Background sync to Supabase
      const sync = async () => {
        try {
          const validBranches = state.branches.filter(b => b && !isDeleted(b.id) && !isDeleted(b.name));
          if (validBranches.length > 0) {
            const payload = validBranches.map(b => ({
              id: toValidUUID(b.id),
              name: b.name,
              location: b.location || '',
              manager: b.manager || ''
            }));
            await client.from('branches').upsert(payload);
          }

          const validSuppliers = state.suppliers.filter(s => s && !isDeleted(s.id) && !isDeleted(s.code) && !isDeleted(s.name));
          if (validSuppliers.length > 0) {
            const payload = validSuppliers.map(s => ({
              id: toValidUUID(s.id),
              name: s.name,
              code: s.code,
              cnpj: s.cnpj || '',
              contact: s.contact || ''
            }));
            await client.from('suppliers').upsert(payload);
          }

          const validProducts = state.products.filter(p => p && !isDeleted(p.id) && !isDeleted(p.code) && !isDeleted(p.name));
          if (validProducts.length > 0) {
            const payload = validProducts.map(p => ({
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

          const validUsers = state.users.filter(u => u && !isDeleted(u.id) && !isDeleted(u.email) && !isDeleted(u.name));
          if (validUsers.length > 0) {
            const payload = validUsers.map(u => ({
              id: toValidUUID(u.id),
              name: u.name,
              email: u.email,
              role: u.role,
              branch_id: u.branchId ? toValidUUID(u.branchId) : null
            }));

            for (const userRow of payload) {
              const { error: singleErr } = await client.from('users').upsert(userRow, { onConflict: 'email' });
              if (singleErr) {
                console.warn(`Erro ao sincronizar usuário ${userRow.email}:`, singleErr.message);
              }
            }
          }

          const validOrders = state.branchOrders.filter(o => o && !isDeleted(o.id));
          if (validOrders.length > 0) {
            const payload = validOrders.map(o => ({
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
        } catch (err) {
          console.warn('Falha na sincronização assíncrona com Supabase:', err);
        }
      };
      sync();
    }
  }, [state]);

  const login = (email: string, password?: string) => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    const user = state.users.find(u => u && u.email && u.email.toLowerCase().trim() === cleanEmail);
    if (user) {
      if (user.password && password !== undefined && user.password !== password) {
        return false;
      }
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // Products
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const bulkAddProducts = (newProductsList: Omit<Product, 'id'>[]) => {
    const createdProducts = newProductsList.map(p => ({
      ...p,
      id: Math.random().toString(36).substr(2, 9)
    }));
    setState(prev => ({ ...prev, products: [...prev.products, ...createdProducts] }));
  };

  const deleteProduct = (id: string) => {
    const targetProduct = state.products.find(p => p.id === id || p.code === id || p.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetProduct) {
      markAsDeleted(targetProduct.id, targetProduct.code, targetProduct.name);
    }

    setState(prev => {
      const updated = {
        ...prev,
        products: prev.products.filter(p => p.id !== id && p.id !== targetId && (targetProduct ? p.code !== targetProduct.code && p.name !== targetProduct.name : true))
      };
      mockDb.save(updated);
      return updated;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('products').delete().eq('id', targetId);
          await client.from('products').delete().eq('id', id);
          if (targetProduct?.code) {
            await client.from('products').delete().eq('code', targetProduct.code);
          }
          if (targetProduct?.name) {
            await client.from('products').delete().eq('name', targetProduct.name);
          }
        } catch (e) {
          console.warn('Supabase delete product err:', e);
        }
      })();
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  // Suppliers
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
  };

  const deleteSupplier = (id: string) => {
    const targetSupplier = state.suppliers.find(s => s.id === id || s.code === id || s.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetSupplier) {
      markAsDeleted(targetSupplier.id, targetSupplier.code, targetSupplier.name);
    }

    setState(prev => {
      const updated = {
        ...prev,
        suppliers: prev.suppliers.filter(s => s.id !== id && s.id !== targetId && (targetSupplier ? s.code !== targetSupplier.code && s.name !== targetSupplier.name : true))
      };
      mockDb.save(updated);
      return updated;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('suppliers').delete().eq('id', targetId);
          await client.from('suppliers').delete().eq('id', id);
          if (targetSupplier?.code) {
            await client.from('suppliers').delete().eq('code', targetSupplier.code);
          }
          if (targetSupplier?.name) {
            await client.from('suppliers').delete().eq('name', targetSupplier.name);
          }
        } catch (e) {
          console.warn('Supabase delete supplier err:', e);
        }
      })();
    }
  };

  // Purchase Orders
  const createPurchaseOrder = (supplierId: string, items: { productId: string, quantity: number }[]) => {
    const totalValue = items.reduce((acc, item) => {
      const product = state.products.find(p => p.id === item.productId);
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);

    const newOrder: PurchaseOrder = {
      id: Math.random().toString(36).substr(2, 9),
      supplierId,
      items,
      status: 'pending',
      totalValue,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({ ...prev, purchaseOrders: [...prev.purchaseOrders, newOrder] }));
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    setState(prev => {
      const order = prev.purchaseOrders.find(o => o.id === id);
      if (status === 'received' && order && order.status !== 'received') {
        // Update stock when received
        const updatedProducts = prev.products.map(p => {
          const item = order.items.find(i => i.productId === p.id);
          return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
        });
        return {
          ...prev,
          products: updatedProducts,
          purchaseOrders: prev.purchaseOrders.map(o => o.id === id ? { ...o, status } : o)
        };
      }
      return {
        ...prev,
        purchaseOrders: prev.purchaseOrders.map(o => o.id === id ? { ...o, status } : o)
      };
    });
  };

  // Branch Orders
  const checkBranchOrderLimits = (branchId: string, items: { productId: string, quantity: number }[], excludeOrderId?: string) => {
    // Check if any product in the order has zero central stock
    for (const item of items) {
      const product = state.products.find(p => p.id === item.productId);
      if (product && product.currentStock <= 0) {
        return {
          allowed: false,
          reason: `Não é possível solicitar o produto "${product.name}" porque ele se encontra com estoque zerado no estoque central.`
        };
      }
    }

    const limits = state.branchLimits?.find(l => l.branchId === branchId);
    if (!limits) return { allowed: true };

    const totalValue = items.reduce((acc, item) => {
      const product = state.products.find(p => p.id === item.productId);
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);

    // 1. Budget limit check per order
    if (limits.maxOrderBudget > 0 && totalValue > limits.maxOrderBudget) {
      return {
        allowed: false,
        reason: `O valor do pedido (R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) ultrapassa a verba de R$ ${limits.maxOrderBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por pedido definida para sua filial.`
      };
    }

    // 2. Product monthly quantity limit check
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get current month's existing orders for this branch (excluding rejected and optionally the order being edited)
    const currentMonthOrders = state.branchOrders.filter(o => {
      if (o.branchId !== branchId || o.status === 'rejected' || (excludeOrderId && o.id === excludeOrderId)) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    for (const item of items) {
      const limitQty = limits.productMonthlyLimits[item.productId];
      // Only enforce if limit is defined and > 0
      if (limitQty !== undefined && limitQty > 0) {
        // Calculate already ordered total in this month
        let alreadyOrdered = 0;
        currentMonthOrders.forEach(mo => {
          const matchItem = mo.items.find(i => i.productId === item.productId);
          if (matchItem) {
            alreadyOrdered += matchItem.quantity;
          }
        });

        if (alreadyOrdered + item.quantity > limitQty) {
          const product = state.products.find(p => p.id === item.productId);
          const productName = product ? product.name : 'Produto';
          const remaining = Math.max(0, limitQty - alreadyOrdered);
          return {
            allowed: false,
            reason: `O produto "${productName}" excede o limite mensal configurado. Cota máxima mensal: ${limitQty} un. Já solicitado este mês: ${alreadyOrdered} un. Cota restante: ${remaining} un. (Você tentou pedir: ${item.quantity} un.)`
          };
        }
      }
    }

    return { allowed: true };
  };

  const saveBranchLimits = (branchId: string, maxOrderBudget: number, productMonthlyLimits: { [productId: string]: number }) => {
    setState(prev => {
      const exists = prev.branchLimits?.some(l => l.branchId === branchId);
      const newLimits: BranchLimits = {
        branchId,
        maxOrderBudget,
        productMonthlyLimits
      };
      
      const updatedLimits = exists 
        ? prev.branchLimits.map(l => l.branchId === branchId ? newLimits : l)
        : [...(prev.branchLimits || []), newLimits];
        
      return {
        ...prev,
        branchLimits: updatedLimits
      };
    });
  };

  const createBranchOrder = (branchId: string, items: { productId: string, quantity: number }[], status: BranchOrder['status'] = 'pending') => {
    if (status === 'pending') {
      const checkResult = checkBranchOrderLimits(branchId, items);
      if (!checkResult.allowed) {
        return { success: false, reason: checkResult.reason };
      }
    }

    const totalValue = items.reduce((acc, item) => {
      const product = state.products.find(p => p.id === item.productId);
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);

    const newOrder: BranchOrder = {
      id: Math.random().toString(36).substr(2, 9),
      branchId,
      items,
      status,
      totalValue,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({ ...prev, branchOrders: [...prev.branchOrders, newOrder] }));
    return { success: true };
  };

  const updateBranchOrderStatus = (id: string, status: BranchOrder['status'], approvedBy?: string) => {
    setState(prev => {
      const order = prev.branchOrders.find(o => o.id === id);
      
      const updateData: Partial<BranchOrder> = { status };
      if (status === 'approved' && approvedBy) {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = new Date().toISOString();
      }

      // If moving to picking/picked, we might want to check stock, but for now just update status
      // When shipped, we should deduct from warehouse stock
      if (status === 'shipped' && order && order.status !== 'shipped') {
        const updatedProducts = prev.products.map(p => {
          const item = order.items.find(i => i.productId === p.id);
          return item ? { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) } : p;
        });
        return {
          ...prev,
          products: updatedProducts,
          branchOrders: prev.branchOrders.map(o => o.id === id ? { ...o, ...updateData } : o)
        };
      }

      return {
        ...prev,
        branchOrders: prev.branchOrders.map(o => o.id === id ? { ...o, ...updateData } : o)
      };
    });
  };

  const deleteBranchOrder = (id: string) => {
    markAsDeleted(id);
    const targetId = toValidUUID(id);
    markAsDeleted(targetId);

    setState(prev => {
      const updated = {
        ...prev,
        branchOrders: prev.branchOrders.filter(o => o.id !== id && o.id !== targetId)
      };
      mockDb.save(updated);
      return updated;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const { error } = await client.from('branch_orders').delete().eq('id', targetId);
          if (error) {
            await client.from('branch_orders').delete().eq('id', id);
          }
        } catch (e) {
          console.warn('Supabase delete branch order err:', e);
        }
      })();
    }
  };

  // Users
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const bulkAddUsers = (newUsersList: Omit<User, 'id'>[]) => {
    const createdUsers = newUsersList.map(u => ({
      ...u,
      id: crypto.randomUUID()
    }));
    setState(prev => ({ ...prev, users: [...prev.users, ...createdUsers] }));
  };

  const deleteUser = (id: string) => {
    const targetUser = state.users.find(u => u.id === id || u.email === id || u.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetUser) {
      markAsDeleted(targetUser.id, targetUser.email, targetUser.name);
    }

    setState(prev => {
      const updated = {
        ...prev,
        users: prev.users.filter(u => u.id !== id && u.id !== targetId && (targetUser ? u.email !== targetUser.email && u.name !== targetUser.name : true))
      };
      mockDb.save(updated);
      return updated;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('users').delete().eq('id', targetId);
          await client.from('users').delete().eq('id', id);
          if (targetUser?.email) {
            await client.from('users').delete().eq('email', targetUser.email);
          }
          if (targetUser?.name) {
            await client.from('users').delete().eq('name', targetUser.name);
          }
        } catch (e) {
          console.warn('Supabase delete user err:', e);
        }
      })();
    }
  };

  // Branches
  const addBranch = (branch: Omit<Branch, 'id'>) => {
    const newBranch = { ...branch, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, branches: [...prev.branches, newBranch] }));
  };

  const bulkAddBranches = (newBranchesList: Omit<Branch, 'id'>[]) => {
    const createdBranches = newBranchesList.map(b => ({
      ...b,
      id: crypto.randomUUID()
    }));
    setState(prev => ({ ...prev, branches: [...prev.branches, ...createdBranches] }));
  };

  const deleteBranch = (id: string) => {
    const targetBranch = state.branches.find(b => b.id === id || b.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetBranch) {
      markAsDeleted(targetBranch.id, targetBranch.name);
    }

    setState(prev => {
      const updated = {
        ...prev,
        branches: prev.branches.filter(b => b.id !== id && b.id !== targetId && (targetBranch ? b.name !== targetBranch.name : true))
      };
      mockDb.save(updated);
      return updated;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('branches').delete().eq('id', targetId);
          await client.from('branches').delete().eq('id', id);
          if (targetBranch?.name) {
            await client.from('branches').delete().eq('name', targetBranch.name);
          }
        } catch (e) {
          console.warn('Supabase delete branch err:', e);
        }
      })();
    }
  };

  // Settings
  const updateSettings = (settings: Partial<typeof state.settings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  };

  const addProductClassification = (name: string) => {
    if (!name || name.trim() === '') return;
    setState(prev => {
      const trimmed = name.trim();
      const current = prev.productClassifications || [];
      if (current.includes(trimmed)) return prev;
      return {
        ...prev,
        productClassifications: [...current, trimmed]
      };
    });
  };

  const deleteProductClassification = (name: string) => {
    markAsDeleted(name);

    setState(prev => {
      const current = prev.productClassifications || [];
      const updated = {
        ...prev,
        productClassifications: current.filter(c => c !== name)
      };
      mockDb.save(updated);
      return updated;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('product_classifications').delete().eq('name', name);
          await client.from('categories').delete().eq('name', name);
        } catch (e) {
          console.warn('Supabase delete classification err:', e);
        }
      })();
    }
  };

  // Inventory Counts
  const requestInventoryCount = (productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const newCount: any = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      warehouseQuantityAtRequest: product.currentStock
    };

    setState(prev => ({
      ...prev,
      inventoryCounts: [...prev.inventoryCounts, newCount]
    }));
  };

  const requestGeneralInventoryCount = () => {
    setState(prev => {
      const newCounts = prev.products.map(product => ({
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        warehouseQuantityAtRequest: product.currentStock
      }));

      return {
        ...prev,
        inventoryCounts: [...prev.inventoryCounts, ...newCounts]
      };
    });
  };

  const completeInventoryCount = (countId: string, quantity: number) => {
    setState(prev => {
      const count = prev.inventoryCounts.find(c => c.id === countId);
      if (!count) return prev;

      const updatedProducts = prev.products.map(p => 
        p.id === count.productId ? { ...p, currentStock: quantity } : p
      );

      return {
        ...prev,
        products: updatedProducts,
        inventoryCounts: prev.inventoryCounts.map(c => 
          c.id === countId ? { ...c, status: 'completed', countedQuantity: quantity } : c
        )
      };
    });
  };

  const createDistribution = (
    items: Distribution['items'], 
    type: DistributionType = 'general', 
    recipients?: Record<string, string>
  ) => {
    const newDistribution: Distribution = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      recipients,
      items,
      createdAt: new Date().toISOString()
    };

    setState(prev => {
      // Deduct from warehouse stock
      const updatedProducts = prev.products.map(p => {
        const distItem = items.find(i => i.productId === p.id);
        if (distItem) {
          const totalDistQuantity = distItem.quantityPerBranch.reduce((acc, q) => acc + q.quantity, 0);
          return { ...p, currentStock: Math.max(0, p.currentStock - totalDistQuantity) };
        }
        return p;
      });

      // Create branch orders for each branch involved
      const branchOrders: BranchOrder[] = [];
      const branchIds = new Set<string>();
      items.forEach(item => {
        item.quantityPerBranch.forEach(q => branchIds.add(q.branchId));
      });

      branchIds.forEach(branchId => {
        const branchItems = items.map(item => ({
          productId: item.productId,
          quantity: item.quantityPerBranch.find(q => q.branchId === branchId)?.quantity || 0
        })).filter(i => i.quantity > 0);

        if (branchItems.length > 0) {
          const totalValue = branchItems.reduce((acc, item) => {
            const product = state.products.find(p => p.id === item.productId);
            return acc + (product ? product.price * item.quantity : 0);
          }, 0);

          branchOrders.push({
            id: Math.random().toString(36).substr(2, 9),
            branchId,
            items: branchItems,
            status: 'approved', // Distributions start as approved for logistics to pick
            totalValue,
            createdAt: new Date().toISOString()
          });
        }
      });

      return {
        ...prev,
        products: updatedProducts,
        branchOrders: [...prev.branchOrders, ...branchOrders],
        distributions: [...prev.distributions, newDistribution]
      };
    });
  };

  const updateBranchOrderItems = (id: string, items: { productId: string, quantity: number }[]) => {
    setState(prev => {
      const order = prev.branchOrders.find(o => o.id === id);
      if (!order) return prev;
      
      const totalValue = items.reduce((acc, item) => {
        const product = prev.products.find(p => p.id === item.productId);
        return acc + (product ? product.price * item.quantity : 0);
      }, 0);

      return {
        ...prev,
        branchOrders: prev.branchOrders.map(o => o.id === id ? { ...o, items, totalValue } : o)
      };
    });
  };

  const reportOrderDiscrepancy = (id: string, items: { productId: string, quantity: number }[]) => {
    setState(prev => {
      const order = prev.branchOrders.find(o => o.id === id);
      if (!order) return prev;
      
      const totalValue = items.reduce((acc, item) => {
        const product = prev.products.find(p => p.id === item.productId);
        return acc + (product ? product.price * item.quantity : 0);
      }, 0);

      return {
        ...prev,
        branchOrders: prev.branchOrders.map(o => o.id === id ? { ...o, items, totalValue, status: 'discrepancy' } : o)
      };
    });
  };

  return {
    ...state,
    login,
    logout,
    addProduct,
    bulkAddProducts,
    deleteProduct,
    updateProduct,
    addSupplier,
    deleteSupplier,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    createBranchOrder,
    updateBranchOrderStatus,
    updateBranchOrderItems,
    deleteBranchOrder,
    addUser,
    bulkAddUsers,
    deleteUser,
    addBranch,
    bulkAddBranches,
    deleteBranch,
    updateSettings,
    addProductClassification,
    deleteProductClassification,
    requestInventoryCount,
    requestGeneralInventoryCount,
    completeInventoryCount,
    createDistribution,
    saveBranchLimits,
    checkBranchOrderLimits,
    globalSearch,
    setGlobalSearch,
    resetDb: mockDb.reset
  };
}
