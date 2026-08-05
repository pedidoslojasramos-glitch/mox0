import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Product, Supplier, PurchaseOrder, Branch, BranchOrder, User, UserRole, Distribution, DistributionType, BranchLimits } from '../types';
import { getSupabase } from '../lib/supabase';

export function toValidUUID(id: string): string {
  if (!id) {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : '10000000-1000-4000-8000-100000000000';
  }

  // Check if string is already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }

  // Default mappings for standard mock IDs
  if (id === '1') return '88888888-8888-8888-8888-888888888888';
  if (id === '2') return '99999999-9999-9999-9999-999999999999';
  if (id === '3') return 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if (id === '4') return 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  if (/^\d+$/.test(id)) {
    return `00000000-0000-0000-0000-${id.padStart(12, '0')}`;
  }

  // Generate fallback UUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useRamox() {
  const [state, setState] = useState(mockDb.get());
  const [globalSearch, setGlobalSearch] = useState('');

  // Initial fetch from Supabase if connected
  useEffect(() => {
    async function loadFromSupabase() {
      const client = getSupabase();
      if (!client) return;

      try {
        const [
          { data: dbBranches },
          { data: dbSuppliers },
          { data: dbProducts },
          { data: dbUsers, error: errUsers },
          { data: dbBranchOrders }
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
          if (dbBranches && dbBranches.length > 0) {
            updated.branches = dbBranches.map((b: any) => ({
              id: b.id,
              name: b.name,
              location: b.location || '',
              manager: b.manager || ''
            }));
          }
          if (dbSuppliers && dbSuppliers.length > 0) {
            updated.suppliers = dbSuppliers.map((s: any) => ({
              id: s.id,
              name: s.name,
              code: s.code,
              cnpj: s.cnpj || '',
              contact: s.contact || ''
            }));
          }
          if (dbProducts && dbProducts.length > 0) {
            updated.products = dbProducts.map((p: any) => ({
              id: p.id,
              name: p.name,
              code: p.code,
              category: p.category,
              unit: p.unit,
              price: Number(p.price) || 0,
              currentStock: p.current_stock || 0,
              minStock: p.minStock || 0,
              image: p.image || ''
            }));
          }

          // MERGE users: preserve locally created users that are not yet in Supabase
          if (dbUsers && dbUsers.length > 0) {
            const fetchedUsers = dbUsers.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              branchId: u.branch_id || undefined
            }));

            const existingEmails = new Set(fetchedUsers.map((u: any) => u.email.toLowerCase().trim()));
            const localOnlyUsers = prev.users.filter(u => !existingEmails.has(u.email.toLowerCase().trim()));

            updated.users = [...fetchedUsers, ...localOnlyUsers];
          }

          if (dbBranchOrders && dbBranchOrders.length > 0) {
            updated.branchOrders = dbBranchOrders.map((o: any) => ({
              id: o.id,
              branchId: o.branch_id,
              status: o.status,
              totalValue: Number(o.total_value) || 0,
              items: o.items || [],
              createdAt: o.created_at,
              approvedBy: o.approved_by || undefined,
              approvedAt: o.approved_at || undefined
            }));
          }
          return updated;
        });
      } catch (e) {
        console.warn('Erro ao carregar dados do Supabase:', e);
      }
    }

    loadFromSupabase();
  }, []);

  // Save to local storage & sync to Supabase on state change
  useEffect(() => {
    mockDb.save(state);

    const client = getSupabase();
    if (client) {
      // Background sync to Supabase
      const sync = async () => {
        try {
          if (state.branches.length > 0) {
            const payload = state.branches.map(b => ({
              id: toValidUUID(b.id),
              name: b.name,
              location: b.location || '',
              manager: b.manager || ''
            }));
            await client.from('branches').upsert(payload);
          }

          if (state.suppliers.length > 0) {
            const payload = state.suppliers.map(s => ({
              id: toValidUUID(s.id),
              name: s.name,
              code: s.code,
              cnpj: s.cnpj || '',
              contact: s.contact || ''
            }));
            await client.from('suppliers').upsert(payload);
          }

          if (state.products.length > 0) {
            const payload = state.products.map(p => ({
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

          if (state.users.length > 0) {
            const payload = state.users.map(u => ({
              id: toValidUUID(u.id),
              name: u.name,
              email: u.email,
              role: u.role,
              branch_id: u.branchId ? toValidUUID(u.branchId) : null
            }));

            // Upsert individually to guarantee each user (like CARLOS PEREIRA) is saved
            for (const userRow of payload) {
              const { error: singleErr } = await client.from('users').upsert(userRow, { onConflict: 'email' });
              if (singleErr) {
                console.warn(`Erro ao sincronizar usuário ${userRow.email}:`, singleErr.message);
              }
            }
          }

          if (state.branchOrders.length > 0) {
            const payload = state.branchOrders.map(o => ({
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
    const user = state.users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
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
    setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    const client = getSupabase();
    if (client) {
      const targetId = toValidUUID(id);
      (async () => {
        try {
          const { error } = await client.from('products').delete().eq('id', targetId);
          if (error) {
            await client.from('products').delete().eq('id', id);
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
    setState(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }));
    const client = getSupabase();
    if (client) {
      const targetId = toValidUUID(id);
      (async () => {
        try {
          const { error } = await client.from('suppliers').delete().eq('id', targetId);
          if (error) {
            await client.from('suppliers').delete().eq('id', id);
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
    setState(prev => ({
      ...prev,
      branchOrders: prev.branchOrders.filter(o => o.id !== id)
    }));
    const client = getSupabase();
    if (client) {
      const targetId = toValidUUID(id);
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
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
    const client = getSupabase();
    if (client) {
      const targetId = toValidUUID(id);
      (async () => {
        try {
          const { error } = await client.from('users').delete().eq('id', targetId);
          if (error) {
            await client.from('users').delete().eq('id', id);
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
    setState(prev => ({ ...prev, branches: prev.branches.filter(b => b.id !== id) }));
    const client = getSupabase();
    if (client) {
      const targetId = toValidUUID(id);
      (async () => {
        try {
          const { error } = await client.from('branches').delete().eq('id', targetId);
          if (error) {
            await client.from('branches').delete().eq('id', id);
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
    setState(prev => {
      const current = prev.productClassifications || [];
      return {
        ...prev,
        productClassifications: current.filter(c => c !== name)
      };
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
