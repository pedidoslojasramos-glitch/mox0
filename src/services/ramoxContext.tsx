import React, { useState, useEffect, useRef } from 'react';
import { mockDb, isRecordDeleted } from './mockDb';
import { Product, Supplier, PurchaseOrder, Branch, BranchOrder, User, UserRole, Distribution, DistributionType, BranchLimits, DeliveryRoute } from '../types';
import { DEFAULT_LOJAS_RAMOS_LOGO } from '../utils/lojasRamosLogos';
import { getSupabase } from '../lib/supabase';
import { toast } from 'sonner';

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

// No client-side local caching of deleted/cancelled IDs - database is the single source of truth
export function getDeletedIds(): Set<string> {
  return new Set();
}

export function markAsDeleted(..._ids: (string | undefined | null)[]) {
  // Database-authoritative deletion - no local machine state
}

export function unmarkAsDeleted(..._ids: (string | undefined | null)[]) {
  // No-op
}

export function isDeleted(_id: string | undefined | null): boolean {
  return false;
}

export function getCancelledOrderIds(): Set<string> {
  return new Set();
}

export function markAsCancelled(..._ids: (string | undefined | null)[]) {
  // Status is persisted directly to Supabase status = 'rejected'
}

export function isOrderCancelled(_id: string | undefined | null): boolean {
  return false;
}

export function getCancelledDistBranches(): Set<string> {
  return new Set();
}

export function markDistBranchCancelled(_distId?: string, _branchId?: string) {
  // No-op
}

export function isDistBranchCancelled(_distId?: string, _branchId?: string): boolean {
  return false;
}

export function extractDistIdFromOrder(order?: { notes?: string; approvedBy?: string } | null): string | undefined {
  if (!order) return undefined;
  const text = `${order.notes || ''} ${order.approvedBy || ''}`;
  const match = text.match(/Lote\s*#?([A-Za-z0-9_-]+)/i);
  return match ? match[1].toLowerCase() : undefined;
}

export function findProductHelper(products: Product[], productIdOrCode?: string): Product | undefined {
  if (!productIdOrCode || !products || products.length === 0) return undefined;
  const clean = productIdOrCode.toString().trim().toLowerCase();
  const uuid = toValidUUID(clean);

  // 1. Direct match on id
  let match = products.find(p => p.id.toLowerCase() === clean);
  if (match) return match;

  // 2. Match on UUID
  if (uuid) {
    match = products.find(p => toValidUUID(p.id).toLowerCase() === uuid.toLowerCase());
    if (match) return match;
  }

  // 3. Match on code
  match = products.find(p => p.code && p.code.toLowerCase().trim() === clean);
  if (match) return match;

  // 4. Match on name
  match = products.find(p => p.name && p.name.toLowerCase().trim() === clean);
  if (match) return match;

  return undefined;
}

export function reconcileDistributionOrders(currentState: any): any {
  // State is loaded authoritatively from Supabase
  return currentState;
}

export function useRamox() {
  const [state, setState] = useState(() => reconcileDistributionOrders(mockDb.get()));
  const [globalSearch, setGlobalSearch] = useState('');
  const isInitialLoadCompleteRef = useRef(false);

  const refreshData = async () => {
    const client = getSupabase();
    if (!client) {
      const freshLocal = reconcileDistributionOrders(mockDb.get());
      setState(prev => ({
        ...prev,
        ...freshLocal,
        currentUser: prev.currentUser || freshLocal.currentUser
      }));
      return;
    }

    try {
      const [
        { data: dbBranches, error: errBranches },
        { data: dbSuppliers, error: errSuppliers },
        { data: dbProducts, error: errProducts },
        { data: dbUsers, error: errUsers },
        { data: dbBranchOrders, error: errOrders },
        { data: dbPurchaseOrders, error: errPO },
        { data: dbDistributions, error: errDist },
        { data: dbInventoryCounts, error: errCounts },
        { data: dbLimits, error: errLimits },
        { data: dbSettings, error: errSettings }
      ] = await Promise.all([
        client.from('branches').select('*'),
        client.from('suppliers').select('*'),
        client.from('products').select('*'),
        client.from('users').select('*'),
        client.from('branch_orders').select('*'),
        client.from('purchase_orders').select('*'),
        client.from('distributions').select('*'),
        client.from('inventory_counts').select('*'),
        client.from('branch_limits').select('*'),
        client.from('app_settings').select('*')
      ]);

      if (errUsers) console.warn('Supabase fetch users error:', errUsers);

      setState(prev => {
        let updated = { ...prev };

        if (!errBranches && Array.isArray(dbBranches)) {
          updated.branches = dbBranches
            .filter((b: any) => b && b.id && !isDeleted(b.id))
            .map((b: any) => ({
              id: b.id,
              name: b.name,
              location: b.location || '',
              manager: b.manager || '',
              code: b.code || undefined
            }));
        }

        if (!errSuppliers && Array.isArray(dbSuppliers)) {
          updated.suppliers = dbSuppliers
            .filter((s: any) => s && s.id && !isDeleted(s.id))
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
            .filter((p: any) => p && p.id && !isDeleted(p.id))
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
          const mappedUsers = dbUsers
            .filter((u: any) => u && u.id && !isDeleted(u.id))
            .map((u: any) => {
              const localUser = prev.users?.find(lu => 
                lu.id === u.id || 
                toValidUUID(lu.id) === toValidUUID(u.id) || 
                (lu.email && u.email && lu.email.toLowerCase().trim() === u.email.toLowerCase().trim())
              );

              const userPassword = (u.password && String(u.password).trim() !== '')
                ? String(u.password).trim()
                : (localUser?.password ? String(localUser.password).trim() : '123');

              const rawBranchId = u.branch_id || u.branchId || localUser?.branchId;
              const matchingBranch = updated.branches.find(b => 
                b.id === rawBranchId || 
                toValidUUID(b.id) === toValidUUID(rawBranchId) || 
                b.name === rawBranchId
              );
              const userBranchId = matchingBranch ? matchingBranch.id : (rawBranchId || undefined);

              return {
                id: localUser?.id || u.id,
                name: localUser?.name || u.name || 'Usuário',
                email: u.email || localUser?.email || '',
                role: u.role || localUser?.role || 'branch',
                password: userPassword,
                branchId: userBranchId
              };
            });

          if (!mappedUsers.some(u => u && u.email && u.email.toLowerCase().trim() === 'admin@ramox.com')) {
            mappedUsers.unshift({
              id: '1',
              name: 'Admin Master',
              email: 'admin@ramox.com',
              password: '123',
              role: 'admin',
              branchId: undefined
            });
          }

          updated.users = mappedUsers;
        }

        if (!errOrders && Array.isArray(dbBranchOrders)) {
          const mappedOrders: BranchOrder[] = dbBranchOrders
            .filter((o: any) => o && o.id)
            .map((o: any) => {
              const matchingBranch = updated.branches.find(b => 
                b.id === o.branch_id || 
                toValidUUID(b.id) === toValidUUID(o.branch_id) || 
                b.id === o.branchId ||
                toValidUUID(b.id) === toValidUUID(o.branchId)
              );
              const branchId = matchingBranch ? matchingBranch.id : (o.branch_id || o.branchId);

              let rawItems = o.items;
              if (typeof rawItems === 'string') {
                try {
                  rawItems = JSON.parse(rawItems);
                } catch (e) {
                  rawItems = [];
                }
              }

              let safeItems: { productId: string; quantity: number }[] = [];
              let orderNotes = o.notes;
              let orderRecipient = o.recipient_name || o.recipientName;
              let orderType = o.order_type || o.orderType;

              if (rawItems && typeof rawItems === 'object' && !Array.isArray(rawItems) && Array.isArray(rawItems.orderItems)) {
                safeItems = rawItems.orderItems.map((it: any) => {
                  const prod = findProductHelper(updated.products, it.productId);
                  return {
                    productId: prod ? prod.id : it.productId,
                    quantity: Number(it.quantity) || 0
                  };
                });
                if (!orderNotes && rawItems.notes) orderNotes = rawItems.notes;
                if (!orderRecipient && rawItems.recipientName) orderRecipient = rawItems.recipientName;
                if (!orderType && rawItems.orderType) orderType = rawItems.orderType;
              } else if (Array.isArray(rawItems)) {
                safeItems = rawItems.map((it: any) => {
                  const prod = findProductHelper(updated.products, it.productId);
                  return {
                    productId: prod ? prod.id : it.productId,
                    quantity: Number(it.quantity) || 0
                  };
                });
              }

              return {
                id: o.id,
                branchId,
                status: o.status,
                totalValue: Number(o.total_value ?? o.totalValue) || 0,
                items: safeItems,
                createdAt: o.created_at || o.createdAt,
                approvedBy: o.approved_by || o.approvedBy || undefined,
                approvedAt: o.approved_at || o.approvedAt || undefined,
                notes: orderNotes || undefined,
                recipientName: orderRecipient || undefined,
                orderType: orderType || undefined
              };
            });

          updated.branchOrders = mappedOrders;
        }

        if (!errPO && Array.isArray(dbPurchaseOrders)) {
          updated.purchaseOrders = dbPurchaseOrders
            .filter((po: any) => po && po.id)
            .map((po: any) => {
              let parsedItems = po.items;
              if (typeof parsedItems === 'string') {
                try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
              }
              return {
                id: po.id,
                supplierId: po.supplier_id || po.supplierId,
                status: po.status,
                totalValue: Number(po.total_value ?? po.totalValue) || 0,
                items: Array.isArray(parsedItems) ? parsedItems : [],
                createdAt: po.created_at || po.createdAt
              };
            });
        }

        if (!errDist && Array.isArray(dbDistributions)) {
          updated.distributions = dbDistributions
            .filter((d: any) => d && d.id)
            .map((d: any) => {
              let parsedItems = d.items;
              if (typeof parsedItems === 'string') {
                try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
              }
              if (parsedItems && typeof parsedItems === 'object' && !Array.isArray(parsedItems) && Array.isArray(parsedItems.items)) {
                return {
                  id: d.id,
                  type: parsedItems.type || 'general',
                  recipients: parsedItems.recipients || {},
                  items: parsedItems.items,
                  createdAt: d.created_at
                };
              }
              return {
                id: d.id,
                type: 'general',
                items: Array.isArray(parsedItems) ? parsedItems : [],
                createdAt: d.created_at
              };
            });
        }

        if (!errCounts && Array.isArray(dbInventoryCounts)) {
          updated.inventoryCounts = dbInventoryCounts
            .filter((c: any) => c && c.id)
            .map((c: any) => ({
              id: c.id,
              productId: c.product_id,
              requestedAt: c.requested_at,
              status: c.status,
              countedQuantity: c.counted_quantity !== null && c.counted_quantity !== undefined ? Number(c.counted_quantity) : undefined,
              warehouseQuantityAtRequest: Number(c.warehouse_quantity_at_request) || 0
            }));
        }

        if (!errLimits && Array.isArray(dbLimits)) {
          updated.branchLimits = dbLimits.map((l: any) => ({
            branchId: l.branch_id,
            maxOrderBudget: Number(l.max_order_budget) || 0,
            productMonthlyLimits: l.product_monthly_limits || {}
          }));
        }

        if (!errSettings && Array.isArray(dbSettings)) {
          const companyRow = dbSettings.find((s: any) => s.key === 'company_settings');
          if (companyRow && companyRow.value && typeof companyRow.value === 'object') {
            updated.settings = {
              companyLogo: companyRow.value.companyLogo || prev.settings?.companyLogo || DEFAULT_LOJAS_RAMOS_LOGO,
              vignetteEnabled: companyRow.value.vignetteEnabled !== false,
              vignetteWords: Array.isArray(companyRow.value.vignetteWords) ? companyRow.value.vignetteWords : (prev.settings?.vignetteWords || ['Agilidade', 'Precisão', 'Controle'])
            };
          }

          const classRow = dbSettings.find((s: any) => s.key === 'product_classifications');
          if (classRow && Array.isArray(classRow.value)) {
            updated.productClassifications = classRow.value;
          }

          const routesRow = dbSettings.find((s: any) => s.key === 'delivery_routes');
          if (routesRow && Array.isArray(routesRow.value)) {
            updated.deliveryRoutes = routesRow.value;
          }
        }

        return updated;
      });
    } catch (e) {
      console.warn('Erro ao sincronizar dados com o Supabase:', e);
    } finally {
      isInitialLoadCompleteRef.current = true;
    }
  };

  // 1. Initial fetch from database
  useEffect(() => {
    refreshData();
  }, []);

  // 2. Realtime subscription + Polling Heartbeat (every 3.5 seconds) for 100% synchronization across all users
  useEffect(() => {
    const heartbeat = setInterval(() => {
      refreshData();
    }, 3500);

    const handleFocus = () => {
      refreshData();
    };

    const handleRefreshReq = () => {
      refreshData();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('ramox-refresh-requested', handleRefreshReq);

    const client = getSupabase();
    let channel: any = null;
    if (client) {
      try {
        channel = client.channel('ramox-realtime-db-sync')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            refreshData();
          })
          .subscribe();
      } catch (e) {
        console.warn('Erro ao subscrever canal Realtime:', e);
      }
    }

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('ramox-refresh-requested', handleRefreshReq);
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, []);

  const login = (email: string, password?: string) => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    let user = state.users.find(u => u && u.email && u.email.toLowerCase().trim() === cleanEmail);
    
    // Fallback if Admin Master user wasn't present in state yet
    if (!user && cleanEmail === 'admin@ramox.com') {
      user = {
        id: '1',
        name: 'Admin Master',
        email: 'admin@ramox.com',
        password: '123',
        role: 'admin'
      };
      // Register into state.users
      setState(prev => ({
        ...prev,
        users: [user!, ...prev.users.filter(u => u.id !== '1' && u.email !== 'admin@ramox.com')]
      }));
    }

    if (user) {
      if (user.password && password !== undefined && String(user.password).trim() !== String(password).trim()) {
        return false;
      }
      const now = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem('ramox_session_v1', JSON.stringify({ user, lastActivity: now }));
      }
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ramox_session_v1');
    }
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // 20-minute inactivity session manager
  useEffect(() => {
    if (!state.currentUser) return;

    const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
    let lastActivity = Date.now();

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 5000) {
        lastActivity = now;
        if (typeof window !== 'undefined' && state.currentUser) {
          localStorage.setItem('ramox_session_v1', JSON.stringify({
            user: state.currentUser,
            lastActivity: now
          }));
        }
      } else {
        lastActivity = now;
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'focus'];
    events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const now = Date.now();
      let latestActivity = lastActivity;
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('ramox_session_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.lastActivity) {
              latestActivity = Math.max(lastActivity, Number(parsed.lastActivity));
            }
          }
        }
      } catch (e) {}

      if (now - latestActivity >= INACTIVITY_TIMEOUT_MS) {
        logout();
        toast.info('Sessão encerrada por inatividade (20 minutos).');
      }
    }, 10000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateActivity));
      clearInterval(interval);
    };
  }, [state.currentUser]);

  // Products
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const payload = {
            id: toValidUUID(newProduct.id),
            name: newProduct.name,
            code: newProduct.code,
            category: newProduct.category,
            unit: newProduct.unit,
            price: newProduct.price,
            current_stock: newProduct.currentStock,
            min_stock: newProduct.minStock,
            image: newProduct.image || ''
          };
          await client.from('products').upsert(payload);
          refreshData();
        } catch (e) {
          console.warn('Supabase addProduct err:', e);
        }
      })();
    }
  };

  const bulkAddProducts = (newProductsList: Omit<Product, 'id'>[]) => {
    const createdProducts = newProductsList.map(p => ({
      ...p,
      id: Math.random().toString(36).substr(2, 9)
    }));

    setState(prev => ({
      ...prev,
      products: [...prev.products, ...createdProducts]
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const payload = createdProducts.map(p => ({
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
          refreshData();
        } catch (e) {
          console.warn('Supabase bulkAddProducts err:', e);
        }
      })();
    }
  };

  const deleteProduct = (id: string) => {
    const targetProduct = state.products.find(p => p.id === id || p.code === id || p.name === id);
    const targetId = toValidUUID(id);

    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id && p.id !== targetId && (targetProduct ? p.code !== targetProduct.code && p.name !== targetProduct.name : true))
    }));

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
          refreshData();
        } catch (e) {
          console.warn('Supabase delete product err:', e);
        }
      })();
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        (p.id === id || toValidUUID(p.id) === toValidUUID(id) || (p.code && p.code === id))
          ? { ...p, ...updates }
          : p
      )
    }));

    const client = getSupabase();
    if (client) {
      try {
        const productToUpdate = state.products.find(p => 
          p.id === id || toValidUUID(p.id) === toValidUUID(id) || (p.code && p.code === id)
        );
        if (productToUpdate) {
          const updated = { ...productToUpdate, ...updates };
          const payload: any = {
            name: updated.name,
            code: updated.code,
            category: updated.category,
            unit: updated.unit,
            price: Number(updated.price) || 0,
            current_stock: Number(updated.currentStock) || 0,
            min_stock: Number(updated.minStock) || 0,
            image: updated.image || '',
            updated_at: new Date().toISOString()
          };

          const exactId = productToUpdate.id;
          const { error: updErr } = await client.from('products').update(payload).eq('id', exactId);
          if (updErr) {
            const validUuid = toValidUUID(exactId);
            await client.from('products').update(payload).eq('id', validUuid);
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ramox-refresh-requested'));
          }
          await refreshData();
          return true;
        }
      } catch (e) {
        console.warn('Supabase updateProduct err:', e);
        return false;
      }
    }
    return true;
  };

  // Suppliers
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupplier]
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const payload = {
            id: toValidUUID(newSupplier.id),
            name: newSupplier.name,
            code: newSupplier.code,
            cnpj: newSupplier.cnpj || '',
            contact: newSupplier.contact || ''
          };
          await client.from('suppliers').upsert(payload);
          refreshData();
        } catch (e) {
          console.warn('Supabase addSupplier err:', e);
        }
      })();
    }
  };

  const deleteSupplier = (id: string) => {
    const targetSupplier = state.suppliers.find(s => s.id === id || s.code === id || s.name === id);
    const targetId = toValidUUID(id);

    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id && s.id !== targetId && (targetSupplier ? s.code !== targetSupplier.code && s.name !== targetSupplier.name : true))
    }));

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
          refreshData();
        } catch (e) {
          console.warn('Supabase delete supplier err:', e);
        }
      })();
    }
  };

  // Purchase Orders
  const createPurchaseOrder = (supplierId: string, items: { productId: string, quantity: number }[]) => {
    const totalValue = items.reduce((acc, item) => {
      const product = state.products.find(p => p.id === item.productId || toValidUUID(p.id) === toValidUUID(item.productId));
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);

    const newOrderId = crypto.randomUUID ? crypto.randomUUID() : toValidUUID(Math.random().toString(36).substr(2, 9));
    const newOrder: PurchaseOrder = {
      id: newOrderId,
      supplierId,
      items,
      status: 'pending',
      totalValue,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({ ...prev, purchaseOrders: [...prev.purchaseOrders, newOrder] }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('purchase_orders').upsert({
            id: toValidUUID(newOrder.id),
            supplier_id: toValidUUID(supplierId),
            status: 'pending',
            total_value: totalValue,
            items: items,
            created_at: newOrder.createdAt
          });
          refreshData();
        } catch (e) {
          console.warn('Supabase createPurchaseOrder err:', e);
        }
      })();
    }
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    const targetUUID = toValidUUID(id);
    let updatedProductsList: Product[] | null = null;
    let targetPO: PurchaseOrder | null = null;

    setState(prev => {
      const order = prev.purchaseOrders.find(o => 
        o.id === id || 
        toValidUUID(o.id) === targetUUID ||
        (o.id && id && o.id.toLowerCase().trim() === id.toLowerCase().trim())
      );
      if (!order) return prev;
      targetPO = order;

      let updatedProducts = prev.products;
      if (status === 'received' && order.status !== 'received') {
        updatedProducts = prev.products.map(p => {
          const item = order.items.find(i => i.productId === p.id || toValidUUID(i.productId) === toValidUUID(p.id));
          return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
        });
      }

      updatedProductsList = updatedProducts;

      const updatedOrders = prev.purchaseOrders.map(o => 
        (o.id === order.id || o.id === id || toValidUUID(o.id) === targetUUID) 
          ? { ...o, status } 
          : o
      );

      return {
        ...prev,
        products: updatedProducts,
        purchaseOrders: updatedOrders
      };
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const { error } = await client.from('purchase_orders').update({ status }).eq('id', targetUUID);
          if (error) {
            await client.from('purchase_orders').update({ status }).eq('id', id);
          }

          if (status === 'received' && targetPO && updatedProductsList) {
            for (const item of (targetPO as PurchaseOrder).items) {
              const prod = (updatedProductsList as Product[]).find(p => p.id === item.productId || toValidUUID(p.id) === toValidUUID(item.productId));
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
          refreshData();
        } catch (e) {
          console.warn('Supabase update purchase order status err:', e);
        }
      })();
    }
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

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('branch_limits').upsert({
            branch_id: toValidUUID(branchId),
            max_order_budget: maxOrderBudget,
            product_monthly_limits: productMonthlyLimits
          }, { onConflict: 'branch_id' });
          refreshData();
        } catch (e) {
          console.warn('Supabase saveBranchLimits err:', e);
        }
      })();
    }
  };

  const createBranchOrder = (branchId: string, items: { productId: string, quantity: number }[], status: BranchOrder['status'] = 'pending') => {
    if (status === 'pending') {
      const checkResult = checkBranchOrderLimits(branchId, items);
      if (!checkResult.allowed) {
        return { success: false, reason: checkResult.reason };
      }
    }

    // Check stock availability
    for (const item of items) {
      const product = state.products.find(p => p.id === item.productId);
      if (product && product.currentStock < item.quantity) {
        return {
          success: false,
          reason: `Estoque disponível insuficiente para o produto "${product.name}". Estoque atual: ${product.currentStock} ${product.unit}(s), solicitado: ${item.quantity}.`
        };
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

    unmarkAsDeleted(newOrder.id, toValidUUID(newOrder.id));

    let updatedProducts = state.products;
    if (status !== 'rejected') {
      // Deduct/reserve quantity immediately from available stock
      updatedProducts = state.products.map(p => {
        const item = items.find(i => i.productId === p.id);
        if (item) {
          return {
            ...p,
            currentStock: Math.max(0, p.currentStock - item.quantity)
          };
        }
        return p;
      });
    }

    setState(prev => ({
      ...prev,
      products: updatedProducts,
      branchOrders: [...prev.branchOrders, newOrder]
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const targetUUID = toValidUUID(newOrder.id);
          const orderPayload = {
            id: targetUUID,
            branch_id: toValidUUID(branchId),
            items: items,
            status: status,
            total_value: totalValue,
            created_at: newOrder.createdAt
          };
          await client.from('branch_orders').upsert(orderPayload);

          if (status !== 'rejected') {
            for (const item of items) {
              const prod = updatedProducts.find(p => p.id === item.productId || toValidUUID(p.id) === toValidUUID(item.productId));
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
          refreshData();
        } catch (e) {
          console.warn('Supabase createBranchOrder err:', e);
        }
      })();
    }

    return { success: true };
  };

  const updateBranchOrderStatus = (id: string, status: BranchOrder['status'], approvedBy?: string) => {
    const targetUUID = toValidUUID(id);

    let updatedProductsList: Product[] | null = null;
    let affectedOrder: BranchOrder | null = null;

    setState(prev => {
      const targetOrder = prev.branchOrders.find(o => 
        o.id === id || 
        toValidUUID(o.id) === targetUUID ||
        (o.id && id && o.id.toLowerCase().trim() === id.toLowerCase().trim())
      );
      if (!targetOrder) return prev;

      affectedOrder = targetOrder;
      const oldStatus = targetOrder.status;

      const updateData: Partial<BranchOrder> = { status };
      if (status === 'approved' && approvedBy) {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = new Date().toISOString();
      }

      let updatedProducts = prev.products;

      // If transition is to 'rejected' (cancelled) from active status: return reserved stock to available stock!
      if (status === 'rejected' && oldStatus !== 'rejected') {
        updatedProducts = prev.products.map(p => {
          const item = targetOrder.items.find(i => i.productId === p.id || toValidUUID(i.productId) === toValidUUID(p.id));
          return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
        });
      }
      // If re-activated from 'rejected' to active status: deduct/reserve stock again
      else if (oldStatus === 'rejected' && status !== 'rejected') {
        updatedProducts = prev.products.map(p => {
          const item = targetOrder.items.find(i => i.productId === p.id || toValidUUID(i.productId) === toValidUUID(p.id));
          return item ? { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) } : p;
        });
      }

      updatedProductsList = updatedProducts;

      const updatedOrders = prev.branchOrders.map(o => {
        if (
          o.id === targetOrder.id || 
          o.id === id || 
          toValidUUID(o.id) === targetUUID ||
          (o.id && id && o.id.toLowerCase().trim() === id.toLowerCase().trim())
        ) {
          return { ...o, ...updateData };
        }
        return o;
      });

      return {
        ...prev,
        products: updatedProducts,
        branchOrders: updatedOrders
      };
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const updatePayload: any = { status };
          if (status === 'approved' && approvedBy) {
            updatePayload.approved_by = approvedBy;
            updatePayload.approved_at = new Date().toISOString();
          }
          await Promise.allSettled([
            client.from('branch_orders').update(updatePayload).eq('id', targetUUID),
            client.from('branch_orders').update(updatePayload).eq('id', id)
          ]);

          if (affectedOrder && updatedProductsList) {
            for (const item of (affectedOrder as BranchOrder).items) {
              const prod = (updatedProductsList as Product[]).find(p => p.id === item.productId || toValidUUID(p.id) === toValidUUID(item.productId));
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
          refreshData();
        } catch (e) {
          console.warn('Supabase update branch order status err:', e);
        }
      })();
    }
  };

  const batchUpdateBranchOrderStatus = (ids: string[], status: BranchOrder['status'], approvedBy?: string) => {
    if (!ids || ids.length === 0) return;
    const targetUUIDs = new Set(ids.map(id => toValidUUID(id)));
    const idSet = new Set(ids.map(id => id.toLowerCase().trim()));

    setState(prev => {
      let updatedProducts = prev.products;
      const nowIso = new Date().toISOString();

      const updatedOrders = prev.branchOrders.map(o => {
        const match = idSet.has(o.id.toLowerCase().trim()) || targetUUIDs.has(toValidUUID(o.id));
        if (!match) return o;

        const oldStatus = o.status;
        const updateData: Partial<BranchOrder> = { status };
        if (status === 'approved' && approvedBy) {
          updateData.approvedBy = approvedBy;
          updateData.approvedAt = nowIso;
        }

        // Adjust reserved stock if rejecting or reactivating
        if (status === 'rejected') {
          if (oldStatus !== 'rejected') {
            updatedProducts = updatedProducts.map(p => {
              const item = o.items.find(i => i.productId === p.id || toValidUUID(i.productId) === toValidUUID(p.id));
              return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
            });
          }
        } else if ((oldStatus as string) === 'rejected' && (status as string) !== 'rejected') {
          updatedProducts = updatedProducts.map(p => {
            const item = o.items.find(i => i.productId === p.id || toValidUUID(i.productId) === toValidUUID(p.id));
            return item ? { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) } : p;
          });
        }

        return { ...o, ...updateData };
      });

      return {
        ...prev,
        products: updatedProducts,
        branchOrders: updatedOrders
      };
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const updatePayload: any = { status };
          if (status === 'approved' && approvedBy) {
            updatePayload.approved_by = approvedBy;
            updatePayload.approved_at = new Date().toISOString();
          }
          for (const id of ids) {
            const uId = toValidUUID(id);
            await Promise.allSettled([
              client.from('branch_orders').update(updatePayload).eq('id', uId),
              client.from('branch_orders').update(updatePayload).eq('id', id)
            ]);
          }
          refreshData();
        } catch (e) {
          console.warn('Supabase batch update branch orders err:', e);
        }
      })();
    }
  };

  const deleteBranchOrder = (id: string) => {
    const targetId = toValidUUID(id);

    let updatedProductsList: Product[] | null = null;
    let deletedOrder: BranchOrder | null = null;

    setState(prev => {
      const targetOrder = prev.branchOrders.find(o => o.id === id || toValidUUID(o.id) === targetId);
      deletedOrder = targetOrder || null;
      let updatedProducts = prev.products;

      if (targetOrder && targetOrder.status !== 'rejected') {
        // Return reserved stock
        updatedProducts = prev.products.map(p => {
          const item = targetOrder.items.find(i => i.productId === p.id || toValidUUID(i.productId) === toValidUUID(p.id));
          return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
        });
      }

      updatedProductsList = updatedProducts;

      return {
        ...prev,
        products: updatedProducts,
        branchOrders: prev.branchOrders.filter(o => o.id !== id && toValidUUID(o.id) !== targetId)
      };
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          if (deletedOrder && (deletedOrder as BranchOrder).status !== 'rejected' && updatedProductsList) {
            for (const item of (deletedOrder as BranchOrder).items) {
              const prod = (updatedProductsList as Product[]).find(p => p.id === item.productId || toValidUUID(p.id) === toValidUUID(item.productId));
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
          await Promise.allSettled([
            client.from('branch_orders').delete().eq('id', targetId),
            client.from('branch_orders').delete().eq('id', id)
          ]);
          refreshData();
        } catch (e) {
          console.warn('Supabase delete branch order err:', e);
        }
      })();
    }
  };

  // Users
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      password: user.password ? String(user.password).trim() : '123'
    };
    unmarkAsDeleted(newUser.id, toValidUUID(newUser.id), newUser.email);
    setState(prev => {
      const updatedState = { ...prev, users: [...prev.users, newUser] };
      mockDb.save(updatedState);
      return updatedState;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const targetBranch = state.branches.find(b => 
            b.id === newUser.branchId || 
            toValidUUID(b.id) === toValidUUID(newUser.branchId) || 
            b.name.toLowerCase().trim() === (newUser.branchId || '').toLowerCase().trim()
          );
          const resolvedBranchId = targetBranch ? toValidUUID(targetBranch.id) : null;

          const userRow = {
            id: toValidUUID(newUser.id),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            password: newUser.password ? String(newUser.password).trim() : '123456',
            branch_id: resolvedBranchId
          };
          let { error } = await client.from('users').upsert(userRow, { onConflict: 'email' });
          if (error) {
            let rowToTry = { ...userRow };
            if (error.message.includes('password')) delete (rowToTry as any).password;
            if (error.code === '23503' || error.message.includes('foreign key')) rowToTry.branch_id = null;
            let res2 = await client.from('users').upsert(rowToTry, { onConflict: 'email' });
            if (res2.error && (res2.error.code === '23503' || res2.error.message.includes('foreign key') || res2.error.message.includes('password'))) {
              rowToTry.branch_id = null;
              delete (rowToTry as any).password;
              await client.from('users').upsert(rowToTry, { onConflict: 'email' });
            }
          }
        } catch (e) {
          console.warn('Supabase add user err:', e);
        }
      })();
    }
  };

  const bulkAddUsers = (newUsersList: Omit<User, 'id'>[]) => {
    const createdUsers = newUsersList.map(u => ({
      ...u,
      id: crypto.randomUUID(),
      password: u.password ? String(u.password).trim() : '123'
    }));
    createdUsers.forEach(u => unmarkAsDeleted(u.id, toValidUUID(u.id), u.email));

    setState(prev => {
      const updatedState = { ...prev, users: [...prev.users, ...createdUsers] };
      mockDb.save(updatedState);
      return updatedState;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          for (const u of createdUsers) {
            const targetBranch = state.branches.find(b => 
              b.id === u.branchId || 
              toValidUUID(b.id) === toValidUUID(u.branchId) || 
              b.name.toLowerCase().trim() === (u.branchId || '').toLowerCase().trim()
            );
            const resolvedBranchId = targetBranch ? toValidUUID(targetBranch.id) : null;

            const userRow = {
              id: toValidUUID(u.id),
              name: u.name,
              email: u.email,
              role: u.role,
              password: u.password ? String(u.password).trim() : '123456',
              branch_id: resolvedBranchId
            };
            let { error } = await client.from('users').upsert(userRow, { onConflict: 'email' });
            if (error) {
              let rowToTry = { ...userRow };
              if (error.message.includes('password')) delete (rowToTry as any).password;
              if (error.code === '23503' || error.message.includes('foreign key')) rowToTry.branch_id = null;
              let res2 = await client.from('users').upsert(rowToTry, { onConflict: 'email' });
              if (res2.error && (res2.error.code === '23503' || res2.error.message.includes('foreign key') || res2.error.message.includes('password'))) {
                rowToTry.branch_id = null;
                delete (rowToTry as any).password;
                await client.from('users').upsert(rowToTry, { onConflict: 'email' });
              }
            }
          }
        } catch (e) {
          console.warn('Supabase bulk add users err:', e);
        }
      })();
    }
  };

  const updateUser = (id: string, updatedFields: Partial<Omit<User, 'id'>>) => {
    unmarkAsDeleted(id, toValidUUID(id), updatedFields.email);
    setState(prev => {
      const targetUser = prev.users.find(u => 
        u.id === id || 
        toValidUUID(u.id) === toValidUUID(id) || 
        (u.email && updatedFields.email && u.email.toLowerCase().trim() === updatedFields.email.toLowerCase().trim())
      );
      const matchedId = targetUser ? targetUser.id : id;

      const updatedUsers = prev.users.map(u => {
        if (u.id === matchedId || u.id === id || toValidUUID(u.id) === toValidUUID(id)) {
          return { ...u, ...updatedFields };
        }
        return u;
      });

      let updatedCurrentUser = prev.currentUser;
      if (prev.currentUser && (prev.currentUser.id === matchedId || prev.currentUser.id === id || toValidUUID(prev.currentUser.id) === toValidUUID(id))) {
        updatedCurrentUser = { ...prev.currentUser, ...updatedFields };
        if (typeof window !== 'undefined') {
          localStorage.setItem('ramox_session_v1', JSON.stringify({
            user: updatedCurrentUser,
            lastActivity: Date.now()
          }));
        }
      }

      const updatedState = {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser
      };
      mockDb.save(updatedState);
      return updatedState;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const userToUpdate = state.users.find(u => 
            u.id === id || 
            toValidUUID(u.id) === toValidUUID(id) || 
            (u.email && updatedFields.email && u.email.toLowerCase().trim() === updatedFields.email.toLowerCase().trim())
          );
          if (userToUpdate) {
            const targetId = toValidUUID(userToUpdate.id);
            const newName = updatedFields.name ?? userToUpdate.name;
            const newEmail = updatedFields.email ?? userToUpdate.email;
            const newRole = updatedFields.role ?? userToUpdate.role;
            const newPassword = updatedFields.password ?? userToUpdate.password ?? '123456';
            const rawBranchId = updatedFields.branchId !== undefined ? updatedFields.branchId : userToUpdate.branchId;

            const targetBranch = state.branches.find(b => 
              b.id === rawBranchId || 
              toValidUUID(b.id) === toValidUUID(rawBranchId) || 
              b.name.toLowerCase().trim() === (rawBranchId || '').toLowerCase().trim()
            );
            const resolvedBranchId = targetBranch ? toValidUUID(targetBranch.id) : null;

            const payload = {
              id: targetId,
              name: newName,
              email: newEmail,
              role: newRole,
              password: newPassword,
              branch_id: resolvedBranchId
            };

            let { error } = await client.from('users').upsert(payload, { onConflict: 'email' });
            if (error) {
              let rowToTry = { ...payload };
              if (error.message.includes('password')) delete (rowToTry as any).password;
              if (error.code === '23503' || error.message.includes('foreign key')) rowToTry.branch_id = null;
              let res2 = await client.from('users').upsert(rowToTry, { onConflict: 'email' });
              if (res2.error && (res2.error.code === '23503' || res2.error.message.includes('foreign key') || res2.error.message.includes('password'))) {
                rowToTry.branch_id = null;
                delete (rowToTry as any).password;
                await client.from('users').upsert(rowToTry, { onConflict: 'email' });
              }
            }
          }
        } catch (e) {
          console.warn('Supabase update user err:', e);
        }
      })();
    }
  };

  const deleteUser = (id: string) => {
    const targetUser = state.users.find(u => u.id === id || u.email === id || u.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetUser) {
      markAsDeleted(targetUser.id, toValidUUID(targetUser.id));
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
        } catch (e) {
          console.warn('Supabase delete user err:', e);
        }
      })();
    }
  };

  // Branches
  const addBranch = (branch: Omit<Branch, 'id'>) => {
    const newBranch = { ...branch, id: crypto.randomUUID() };
    unmarkAsDeleted(newBranch.id, toValidUUID(newBranch.id));
    setState(prev => {
      const updatedState = { ...prev, branches: [...prev.branches, newBranch] };
      mockDb.save(updatedState);
      return updatedState;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const payload = {
            id: toValidUUID(newBranch.id),
            name: newBranch.name,
            location: newBranch.location || '',
            manager: newBranch.manager || ''
          };
          await client.from('branches').upsert(payload);
        } catch (e) {
          console.warn('Supabase addBranch err:', e);
        }
      })();
    }
  };

  const bulkAddBranches = (newBranchesList: Omit<Branch, 'id'>[]) => {
    const createdBranches = newBranchesList.map(b => ({
      ...b,
      id: crypto.randomUUID()
    }));
    createdBranches.forEach(b => unmarkAsDeleted(b.id, toValidUUID(b.id)));

    setState(prev => {
      const updatedState = { ...prev, branches: [...prev.branches, ...createdBranches] };
      mockDb.save(updatedState);
      return updatedState;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const payload = createdBranches.map(b => ({
            id: toValidUUID(b.id),
            name: b.name,
            location: b.location || '',
            manager: b.manager || ''
          }));
          await client.from('branches').upsert(payload);
        } catch (e) {
          console.warn('Supabase bulkAddBranches err:', e);
        }
      })();
    }
  };

  const deleteBranch = (id: string) => {
    const targetBranch = state.branches.find(b => b.id === id || b.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetBranch) {
      markAsDeleted(targetBranch.id, toValidUUID(targetBranch.id));
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
  const updateSettings = (settingsUpdates: Partial<typeof state.settings>) => {
    setState(prev => {
      const updated = { ...prev.settings, ...settingsUpdates };
      const client = getSupabase();
      if (client) {
        (async () => {
          try {
            await client.from('app_settings').upsert({
              key: 'company_settings',
              value: updated,
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            refreshData();
          } catch (e) {
            console.warn('Supabase updateSettings err:', e);
          }
        })();
      }
      return { ...prev, settings: updated };
    });
  };

  const addProductClassification = (name: string) => {
    if (!name || name.trim() === '') return;
    const trimmed = name.trim();
    const current = state.productClassifications || [];
    if (current.includes(trimmed)) return;
    const updated = [...current, trimmed];

    setState(prev => ({
      ...prev,
      productClassifications: updated
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('app_settings').upsert({
            key: 'product_classifications',
            value: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
          refreshData();
        } catch (e) {
          console.warn('Supabase addProductClassification err:', e);
        }
      })();
    }
  };

  const deleteProductClassification = (name: string) => {
    const current = state.productClassifications || [];
    const updated = current.filter(c => c !== name);

    setState(prev => ({
      ...prev,
      productClassifications: updated
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('app_settings').upsert({
            key: 'product_classifications',
            value: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
          refreshData();
        } catch (e) {
          console.warn('Supabase deleteProductClassification err:', e);
        }
      })();
    }
  };

  // Inventory Counts
  const requestInventoryCount = (productId: string) => {
    const product = state.products.find(p => p.id === productId || toValidUUID(p.id) === toValidUUID(productId));
    if (!product) return;

    const newCountId = crypto.randomUUID ? crypto.randomUUID() : toValidUUID(Math.random().toString(36).substr(2, 9));
    const nowIso = new Date().toISOString();
    const newCount = {
      id: newCountId,
      productId: product.id,
      requestedAt: nowIso,
      status: 'pending' as const,
      warehouseQuantityAtRequest: product.currentStock
    };

    setState(prev => ({
      ...prev,
      inventoryCounts: [
        ...prev.inventoryCounts.filter(c => (c.productId !== product.id && toValidUUID(c.productId) !== toValidUUID(product.id)) || c.status !== 'pending'),
        newCount
      ]
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('inventory_counts').upsert({
            id: toValidUUID(newCount.id),
            product_id: toValidUUID(product.id),
            requested_at: newCount.requestedAt,
            status: 'pending',
            warehouse_quantity_at_request: product.currentStock
          });
          refreshData();
        } catch (e) {
          console.warn('Supabase requestInventoryCount err:', e);
        }
      })();
    }
  };

  const requestGeneralInventoryCount = () => {
    const nowIso = new Date().toISOString();
    const newCounts = state.products.map(product => ({
      id: crypto.randomUUID ? crypto.randomUUID() : toValidUUID(Math.random().toString(36).substr(2, 9)),
      productId: product.id,
      requestedAt: nowIso,
      status: 'pending' as const,
      warehouseQuantityAtRequest: product.currentStock
    }));

    setState(prev => ({
      ...prev,
      inventoryCounts: [
        ...prev.inventoryCounts.filter(c => c.status !== 'pending'),
        ...newCounts
      ]
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const rows = newCounts.map(c => ({
            id: toValidUUID(c.id),
            product_id: toValidUUID(c.productId),
            requested_at: c.requestedAt,
            status: 'pending',
            warehouse_quantity_at_request: c.warehouseQuantityAtRequest
          }));
          await client.from('inventory_counts').upsert(rows);
          refreshData();
        } catch (e) {
          console.warn('Supabase requestGeneralInventoryCount err:', e);
        }
      })();
    }
  };

  const completeInventoryCount = (countId: string, quantity: number) => {
    const count = state.inventoryCounts.find(c => c.id === countId || toValidUUID(c.id) === toValidUUID(countId));
    if (!count) return;

    setState(prev => {
      const updatedProducts = prev.products.map(p => 
        (p.id === count.productId || toValidUUID(p.id) === toValidUUID(count.productId)) ? { ...p, currentStock: quantity } : p
      );

      return {
        ...prev,
        products: updatedProducts,
        inventoryCounts: prev.inventoryCounts.map(c => 
          (c.id === countId || toValidUUID(c.id) === toValidUUID(countId)) 
            ? { ...c, status: 'completed' as const, countedQuantity: quantity } 
            : c
        )
      };
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const targetCountId = toValidUUID(countId);
          await Promise.allSettled([
            client.from('inventory_counts').update({ status: 'completed', counted_quantity: quantity }).eq('id', targetCountId),
            client.from('inventory_counts').update({ status: 'completed', counted_quantity: quantity }).eq('id', countId),
            client.from('products').update({ current_stock: quantity }).eq('id', toValidUUID(count.productId)),
            client.from('products').update({ current_stock: quantity }).eq('id', count.productId)
          ]);
          refreshData();
        } catch (e) {
          console.warn('Supabase completeInventoryCount err:', e);
        }
      })();
    }
  };

  const cancelInventoryCount = (countId: string) => {
    setState(prev => ({
      ...prev,
      inventoryCounts: prev.inventoryCounts.filter(c => 
        c.id !== countId && toValidUUID(c.id) !== toValidUUID(countId)
      )
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const targetCountId = toValidUUID(countId);
          await Promise.allSettled([
            client.from('inventory_counts').delete().eq('id', targetCountId),
            client.from('inventory_counts').delete().eq('id', countId)
          ]);
          refreshData();
        } catch (e) {
          console.warn('Supabase cancelInventoryCount err:', e);
        }
      })();
    }
  };

  const cancelAllPendingInventoryCounts = () => {
    setState(prev => ({
      ...prev,
      inventoryCounts: prev.inventoryCounts.filter(c => c.status !== 'pending')
    }));

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('inventory_counts').delete().eq('status', 'pending');
          refreshData();
        } catch (e) {
          console.warn('Supabase cancelAllPendingInventoryCounts err:', e);
        }
      })();
    }
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

    let newlyCreatedBranchOrders: BranchOrder[] = [];
    let updatedProductsList: Product[] = [];

    setState(prev => {
      // Helper to resolve canonical branch from any representation
      const getCanonicalBranch = (bId: string): Branch | undefined => {
        if (!bId) return undefined;
        const clean = bId.toString().trim().toLowerCase();
        return prev.branches.find(b => 
          b.id.toLowerCase() === clean || 
          toValidUUID(b.id) === toValidUUID(bId) ||
          b.name.toLowerCase() === clean ||
          (b.code && b.code.toLowerCase() === clean)
        );
      };

      // Deduct from warehouse stock
      const updatedProducts = prev.products.map(p => {
        const distItem = items.find(i => 
          i.productId === p.id || 
          toValidUUID(i.productId) === toValidUUID(p.id) ||
          (p.code && p.code.toLowerCase() === i.productId.toLowerCase())
        );
        if (distItem) {
          const totalDistQuantity = distItem.quantityPerBranch.reduce((acc, q) => acc + (Number(q.quantity) || 0), 0);
          return { ...p, currentStock: Math.max(0, p.currentStock - totalDistQuantity) };
        }
        return p;
      });
      updatedProductsList = updatedProducts;

      // Group all participating branches by their canonical ID so each branch receives ONE complete order
      const canonicalBranchMap = new Map<string, Branch>();
      items.forEach(item => {
        (item.quantityPerBranch || []).forEach(q => {
          if (q && Number(q.quantity) > 0) {
            const branch = getCanonicalBranch(q.branchId);
            const canonicalId = branch ? branch.id : q.branchId;
            const branchObj = branch || {
              id: canonicalId,
              name: `Filial #${canonicalId}`,
              location: 'Unidade da Rede',
              manager: ''
            };
            canonicalBranchMap.set(canonicalId, branchObj);
          }
        });
      });

      const branchOrders: BranchOrder[] = [];
      const nowIso = new Date().toISOString();

      canonicalBranchMap.forEach((branch, canonicalBranchId) => {
        // Collect all items destined for this branch, grouping by resolved product ID
        const itemMapByProduct = new Map<string, number>();

        items.forEach(item => {
          if (!item) return;
          // Find allocation for this branch by ID, UUID, code or name
          const qEntries = (item.quantityPerBranch || []).filter(q => {
            if (!q) return false;
            const b = getCanonicalBranch(q.branchId);
            const qBId = (q.branchId || '').toString().trim().toLowerCase();
            const targetBId = canonicalBranchId.toString().trim().toLowerCase();
            return (b && b.id.toLowerCase() === targetBId) || 
                   qBId === targetBId ||
                   toValidUUID(q.branchId) === toValidUUID(canonicalBranchId) ||
                   (branch.code && qBId === branch.code.toLowerCase().trim()) ||
                   (branch.name && qBId === branch.name.toLowerCase().trim());
          });

          const totalAllocQty = qEntries.reduce((sum, q) => sum + (Number(q.quantity) || 0), 0);

          if (totalAllocQty > 0) {
            const prod = findProductHelper(prev.products, item.productId);
            const resolvedProductId = prod ? prod.id : item.productId;
            const cur = itemMapByProduct.get(resolvedProductId) || 0;
            itemMapByProduct.set(resolvedProductId, cur + totalAllocQty);
          }
        });

        const branchItems: { productId: string; quantity: number }[] = [];
        itemMapByProduct.forEach((quantity, productId) => {
          branchItems.push({ productId, quantity });
        });

        if (branchItems.length > 0) {
          const totalValue = branchItems.reduce((acc, item) => {
            const product = findProductHelper(prev.products, item.productId);
            return acc + (product ? product.price * item.quantity : 0);
          }, 0);

          const newOrderId = Math.random().toString(36).substr(2, 9);
          unmarkAsDeleted(newOrderId, toValidUUID(newOrderId));

          const recipient = recipients?.[canonicalBranchId] || 
                            recipients?.[toValidUUID(canonicalBranchId)] || 
                            branch.manager || 
                            undefined;

          branchOrders.push({
            id: newOrderId,
            branchId: canonicalBranchId,
            items: branchItems,
            status: 'approved', // Distributions start as approved for logistics to pick
            totalValue,
            createdAt: nowIso,
            approvedBy: type === 'epi' ? 'Distribuição de EPIs' : 'Distribuição Central (Em Lote)',
            approvedAt: nowIso,
            notes: type === 'epi'
              ? `Distribuição de EPIs (Lote #${newDistribution.id.toUpperCase()})`
              : `Distribuição em Massa (Lote #${newDistribution.id.toUpperCase()})`,
            recipientName: recipient,
            orderType: type === 'epi' ? 'epi' : 'distribution'
          });
        }
      });

      newlyCreatedBranchOrders = branchOrders;

      const newState = {
        ...prev,
        products: updatedProducts,
        branchOrders: [...prev.branchOrders, ...branchOrders],
        distributions: [...prev.distributions, newDistribution]
      };

      return newState;
    });

    // Sync newly created distribution, orders and stock to Supabase
    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          await client.from('distributions').upsert({
            id: toValidUUID(newDistribution.id),
            items: JSON.stringify({
              type,
              recipients,
              items
            }),
            created_at: newDistribution.createdAt
          });

          if (newlyCreatedBranchOrders.length > 0) {
            for (const bo of newlyCreatedBranchOrders) {
              const orderPayload = {
                id: toValidUUID(bo.id),
                branch_id: toValidUUID(bo.branchId),
                items: {
                  orderItems: bo.items,
                  notes: bo.notes,
                  orderType: bo.orderType,
                  recipientName: bo.recipientName
                },
                status: bo.status,
                total_value: bo.totalValue,
                created_at: bo.createdAt,
                approved_by: bo.approvedBy,
                approved_at: bo.approvedAt
              };
              await client.from('branch_orders').upsert(orderPayload);
            }
          }

          if (updatedProductsList && updatedProductsList.length > 0) {
            for (const item of items) {
              const prod = findProductHelper(updatedProductsList, item.productId);
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
          refreshData();
        } catch (e) {
          console.warn('Supabase createDistribution sync err:', e);
        }
      })();
    }
  };

  const updateBranchOrderItems = (id: string, items: { productId: string, quantity: number }[]) => {
    const targetUUID = toValidUUID(id);

    let updatedProductsList: Product[] | null = null;

    setState(prev => {
      const order = prev.branchOrders.find(o => 
        o.id === id || 
        toValidUUID(o.id) === targetUUID ||
        (o.id && id && o.id.toLowerCase().trim() === id.toLowerCase().trim())
      );
      if (!order) return prev;
      
      let updatedProducts = prev.products;

      // If order is active (not rejected), adjust stock difference
      if (order.status !== 'rejected') {
        const oldMap = new Map<string, number>();
        order.items.forEach(i => oldMap.set(i.productId, (oldMap.get(i.productId) || 0) + i.quantity));

        const newMap = new Map<string, number>();
        items.forEach(i => newMap.set(i.productId, (newMap.get(i.productId) || 0) + i.quantity));

        const allProductIds = new Set([...oldMap.keys(), ...newMap.keys()]);

        updatedProducts = prev.products.map(p => {
          if (allProductIds.has(p.id)) {
            const oldQty = oldMap.get(p.id) || 0;
            const newQty = newMap.get(p.id) || 0;
            const diff = oldQty - newQty; // positive diff means return to stock, negative means deduct
            return {
              ...p,
              currentStock: Math.max(0, p.currentStock + diff)
            };
          }
          return p;
        });
      }

      updatedProductsList = updatedProducts;

      const totalValue = items.reduce((acc, item) => {
        const product = updatedProducts.find(p => p.id === item.productId);
        return acc + (product ? product.price * item.quantity : 0);
      }, 0);

      const updatedOrders = prev.branchOrders.map(o => 
        (o.id === order.id || o.id === id || toValidUUID(o.id) === targetUUID)
          ? { ...o, items, totalValue } 
          : o
      );

      return {
        ...prev,
        products: updatedProducts,
        branchOrders: updatedOrders
      };
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const totalValue = items.reduce((acc, item) => {
            const product = state.products.find(p => p.id === item.productId);
            return acc + (product ? product.price * item.quantity : 0);
          }, 0);
          const { error } = await client.from('branch_orders').update({ items, total_value: totalValue }).eq('id', targetUUID);
          if (error) {
            await client.from('branch_orders').update({ items, total_value: totalValue }).eq('id', id);
          }

          if (updatedProductsList) {
            for (const prod of (updatedProductsList as Product[])) {
              await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
            }
          }
          refreshData();
        } catch (e) {
          console.warn('Supabase update branch order items err:', e);
        }
      })();
    }
  };

  const reportOrderDiscrepancy = (id: string, items: { productId: string, quantity: number }[]) => {
    const targetUUID = toValidUUID(id);
    setState(prev => {
      const order = prev.branchOrders.find(o => o.id === id || toValidUUID(o.id) === targetUUID);
      if (!order) return prev;
      
      const totalValue = items.reduce((acc, item) => {
        const product = prev.products.find(p => p.id === item.productId || toValidUUID(p.id) === toValidUUID(item.productId));
        return acc + (product ? product.price * item.quantity : 0);
      }, 0);

      return {
        ...prev,
        branchOrders: prev.branchOrders.map(o => (o.id === id || toValidUUID(o.id) === targetUUID) ? { ...o, items, totalValue, status: 'discrepancy' } : o)
      };
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const totalValue = items.reduce((acc, item) => {
            const product = state.products.find(p => p.id === item.productId || toValidUUID(p.id) === toValidUUID(item.productId));
            return acc + (product ? product.price * item.quantity : 0);
          }, 0);
          await Promise.allSettled([
            client.from('branch_orders').update({ items, total_value: totalValue, status: 'discrepancy' }).eq('id', targetUUID),
            client.from('branch_orders').update({ items, total_value: totalValue, status: 'discrepancy' }).eq('id', id)
          ]);
          refreshData();
        } catch (e) {
          console.warn('Supabase reportOrderDiscrepancy err:', e);
        }
      })();
    }
  };

  const syncRoutesToDb = async (updatedRoutes: DeliveryRoute[]) => {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('app_settings').upsert({
          key: 'delivery_routes',
          value: updatedRoutes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
        refreshData();
      } catch (e) {
        console.warn('Supabase syncRoutes err:', e);
      }
    }
  };

  const addBranchToRoute = (dayKey: string, branchId: string) => {
    setState(prev => {
      const currentRoutes = prev.deliveryRoutes || [];
      const updatedRoutes = currentRoutes.map(r => {
        if (r.dayKey === dayKey) {
          if (r.branchIds.includes(branchId)) return r;
          return { ...r, branchIds: [...r.branchIds, branchId] };
        }
        return r;
      });
      syncRoutesToDb(updatedRoutes);
      return { ...prev, deliveryRoutes: updatedRoutes };
    });
  };

  const removeBranchFromRoute = (dayKey: string, branchId: string) => {
    setState(prev => {
      const currentRoutes = prev.deliveryRoutes || [];
      const updatedRoutes = currentRoutes.map(r => {
        if (r.dayKey === dayKey) {
          return { ...r, branchIds: r.branchIds.filter(id => id !== branchId) };
        }
        return r;
      });
      syncRoutesToDb(updatedRoutes);
      return { ...prev, deliveryRoutes: updatedRoutes };
    });
  };

  const updateRouteDetails = (dayKey: string, details: { driverName?: string; vehiclePlate?: string; notes?: string }) => {
    setState(prev => {
      const currentRoutes = prev.deliveryRoutes || [];
      const updatedRoutes = currentRoutes.map(r => {
        if (r.dayKey === dayKey) {
          return { ...r, ...details };
        }
        return r;
      });
      syncRoutesToDb(updatedRoutes);
      return { ...prev, deliveryRoutes: updatedRoutes };
    });
  };

  const clearRouteDay = (dayKey: string) => {
    setState(prev => {
      const currentRoutes = prev.deliveryRoutes || [];
      const updatedRoutes = currentRoutes.map(r => {
        if (r.dayKey === dayKey) {
          return { ...r, branchIds: [] };
        }
        return r;
      });
      syncRoutesToDb(updatedRoutes);
      return { ...prev, deliveryRoutes: updatedRoutes };
    });
  };

  const setRouteBranches = (dayKey: string, branchIds: string[]) => {
    setState(prev => {
      const currentRoutes = prev.deliveryRoutes || [];
      const updatedRoutes = currentRoutes.map(r => {
        if (r.dayKey === dayKey) {
          return { ...r, branchIds };
        }
        return r;
      });
      syncRoutesToDb(updatedRoutes);
      return { ...prev, deliveryRoutes: updatedRoutes };
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
    batchUpdateBranchOrderStatus,
    updateBranchOrderItems,
    deleteBranchOrder,
    addUser,
    bulkAddUsers,
    updateUser,
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
    cancelInventoryCount,
    cancelAllPendingInventoryCounts,
    createDistribution,
    saveBranchLimits,
    checkBranchOrderLimits,
    addBranchToRoute,
    removeBranchFromRoute,
    updateRouteDetails,
    clearRouteDay,
    setRouteBranches,
    globalSearch,
    setGlobalSearch,
    refreshData,
    resetDb: mockDb.reset
  };
}
