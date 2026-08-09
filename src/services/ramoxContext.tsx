import React, { useState, useEffect, useRef } from 'react';
import { mockDb, isRecordDeleted } from './mockDb';
import { Product, Supplier, PurchaseOrder, Branch, BranchOrder, User, UserRole, Distribution, DistributionType, BranchLimits } from '../types';
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

export function unmarkAsDeleted(...ids: (string | undefined | null)[]) {
  try {
    if (typeof window === 'undefined') return;
    const set = getDeletedIds();
    ids.forEach(id => {
      if (id) {
        const str = id.toString().trim().toLowerCase();
        if (str) {
          set.delete(str);
          const uuid = toValidUUID(str);
          if (uuid) set.delete(uuid.toLowerCase());
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
          { data: dbBranchOrders, error: errOrders },
          { data: dbPurchaseOrders, error: errPO }
        ] = await Promise.all([
          client.from('branches').select('*'),
          client.from('suppliers').select('*'),
          client.from('products').select('*'),
          client.from('users').select('*'),
          client.from('branch_orders').select('*'),
          client.from('purchase_orders').select('*')
        ]);

        if (errUsers) console.warn('Supabase fetch users error:', errUsers);

        setState(prev => {
          let updated = { ...prev };

          if (!errBranches && Array.isArray(dbBranches)) {
            const mappedBranches = dbBranches
              .filter((b: any) => b && b.id && !isDeleted(b.id))
              .map((b: any) => ({
                id: b.id,
                name: b.name,
                location: b.location || '',
                manager: b.manager || ''
              }));

            const localOnlyBranches = (prev.branches || []).filter(lb => 
              lb && lb.id && !isDeleted(lb.id) &&
              !mappedBranches.some(sb => sb.id === lb.id || toValidUUID(sb.id) === toValidUUID(lb.id) || sb.name.toLowerCase().trim() === lb.name.toLowerCase().trim())
            );

            updated.branches = [...mappedBranches, ...localOnlyBranches];
          }

          if (!errSuppliers && Array.isArray(dbSuppliers)) {
            const mappedSuppliers = dbSuppliers
              .filter((s: any) => s && s.id && !isDeleted(s.id))
              .map((s: any) => ({
                id: s.id,
                name: s.name,
                code: s.code,
                cnpj: s.cnpj || '',
                contact: s.contact || ''
              }));

            const localOnlySuppliers = (prev.suppliers || []).filter(ls => 
              ls && ls.id && !isDeleted(ls.id) &&
              !mappedSuppliers.some(ss => ss.id === ls.id || toValidUUID(ss.id) === toValidUUID(ls.id) || ss.code === ls.code)
            );

            updated.suppliers = [...mappedSuppliers, ...localOnlySuppliers];
          }

          if (!errProducts && Array.isArray(dbProducts)) {
            const mappedProducts = dbProducts
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

            const localOnlyProducts = (prev.products || []).filter(lp => 
              lp && lp.id && !isDeleted(lp.id) &&
              !mappedProducts.some(sp => sp.id === lp.id || toValidUUID(sp.id) === toValidUUID(lp.id) || sp.code === lp.code)
            );

            updated.products = [...mappedProducts, ...localOnlyProducts];
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

            const localOnlyUsers = (prev.users || []).filter(lu => 
              lu && lu.id && !isDeleted(lu.id) &&
              !mappedUsers.some(su => 
                su.id === lu.id || 
                toValidUUID(su.id) === toValidUUID(lu.id) || 
                (su.email && lu.email && su.email.toLowerCase().trim() === lu.email.toLowerCase().trim())
              )
            );

            const mergedUsers = [...mappedUsers, ...localOnlyUsers];

            // Ensure Admin Master (admin@ramox.com) is preserved
            if (!mergedUsers.some(u => u && u.email && u.email.toLowerCase().trim() === 'admin@ramox.com')) {
              const existingMaster = prev.users?.find(u => u && u.email && u.email.toLowerCase().trim() === 'admin@ramox.com');
              mergedUsers.unshift(existingMaster || {
                id: '1',
                name: 'Admin Master',
                email: 'admin@ramox.com',
                password: '123',
                role: 'admin'
              });
            }

            updated.users = mergedUsers;
          }

          if (!errOrders && Array.isArray(dbBranchOrders)) {
            const mappedOrders = dbBranchOrders
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

            const localOnlyOrders = (prev.branchOrders || []).filter(lo => 
              lo && !isDeleted(lo.id) &&
              !mappedOrders.some(so => so.id === lo.id || toValidUUID(so.id) === toValidUUID(lo.id))
            );

            updated.branchOrders = [...mappedOrders, ...localOnlyOrders];
          }

          if (!errPO && Array.isArray(dbPurchaseOrders)) {
            const mappedPOs = dbPurchaseOrders
              .filter((po: any) => po && !isDeleted(po.id))
              .map((po: any) => ({
                id: po.id,
                supplierId: po.supplier_id || po.supplierId,
                status: po.status,
                totalValue: Number(po.total_value ?? po.totalValue) || 0,
                items: po.items || [],
                createdAt: po.created_at || po.createdAt
              }));

            const localOnlyPOs = (prev.purchaseOrders || []).filter(lpo => 
              lpo && !isDeleted(lpo.id) &&
              !mappedPOs.some(spo => spo.id === lpo.id || toValidUUID(spo.id) === toValidUUID(lpo.id))
            );

            updated.purchaseOrders = [...mappedPOs, ...localOnlyPOs];
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
          const validBranches = state.branches.filter(b => b && b.id && !isDeleted(b.id));
          if (validBranches.length > 0) {
            const payload = validBranches.map(b => ({
              id: toValidUUID(b.id),
              name: b.name,
              location: b.location || '',
              manager: b.manager || ''
            }));
            await client.from('branches').upsert(payload);
          }

          const validSuppliers = state.suppliers.filter(s => s && s.id && !isDeleted(s.id));
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

          const validProducts = state.products.filter(p => p && p.id && !isDeleted(p.id));
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

          const validUsers = state.users.filter(u => u && u.id && !isDeleted(u.id));
          if (validUsers.length > 0) {
            for (const u of validUsers) {
              const targetBranch = state.branches.find(b => 
                b.id === u.branchId || 
                toValidUUID(b.id) === toValidUUID(u.branchId) || 
                b.name.toLowerCase().trim() === (u.branchId || '').toLowerCase().trim()
              );
              const branchIdToUse = targetBranch ? toValidUUID(targetBranch.id) : null;

              const userRow = {
                id: toValidUUID(u.id),
                name: u.name,
                email: u.email,
                role: u.role,
                password: u.password ? String(u.password).trim() : '123456',
                branch_id: branchIdToUse
              };

              let { error } = await client.from('users').upsert(userRow, { onConflict: 'email' });
              if (error) {
                let rowToTry = { ...userRow };
                if (error.message.includes('password')) {
                  delete (rowToTry as any).password;
                }
                if (error.code === '23503' || error.message.includes('foreign key')) {
                  rowToTry.branch_id = null;
                }
                let res2 = await client.from('users').upsert(rowToTry, { onConflict: 'email' });
                if (res2.error && (res2.error.code === '23503' || res2.error.message.includes('foreign key') || res2.error.message.includes('password'))) {
                  rowToTry.branch_id = null;
                  delete (rowToTry as any).password;
                  await client.from('users').upsert(rowToTry, { onConflict: 'email' });
                }
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

          const validPurchaseOrders = state.purchaseOrders.filter(po => po && !isDeleted(po.id));
          if (validPurchaseOrders.length > 0) {
            const payload = validPurchaseOrders.map(po => ({
              id: toValidUUID(po.id),
              supplier_id: toValidUUID(po.supplierId),
              status: po.status,
              total_value: po.totalValue || 0,
              items: po.items,
              created_at: po.createdAt
            }));
            await client.from('purchase_orders').upsert(payload);
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
    unmarkAsDeleted(newProduct.id, toValidUUID(newProduct.id));
    setState(prev => {
      const updatedState = { ...prev, products: [...prev.products, newProduct] };
      mockDb.save(updatedState);
      return updatedState;
    });

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
    createdProducts.forEach(p => unmarkAsDeleted(p.id, toValidUUID(p.id)));

    setState(prev => {
      const updatedState = { ...prev, products: [...prev.products, ...createdProducts] };
      mockDb.save(updatedState);
      return updatedState;
    });

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
        } catch (e) {
          console.warn('Supabase bulkAddProducts err:', e);
        }
      })();
    }
  };

  const deleteProduct = (id: string) => {
    const targetProduct = state.products.find(p => p.id === id || p.code === id || p.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetProduct) {
      markAsDeleted(targetProduct.id, toValidUUID(targetProduct.id));
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
    unmarkAsDeleted(id, toValidUUID(id));
    setState(prev => {
      const updatedState = {
        ...prev,
        products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
      };
      mockDb.save(updatedState);
      return updatedState;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const productToUpdate = state.products.find(p => p.id === id);
          if (productToUpdate) {
            const updated = { ...productToUpdate, ...updates };
            const payload = {
              id: toValidUUID(updated.id),
              name: updated.name,
              code: updated.code,
              category: updated.category,
              unit: updated.unit,
              price: updated.price,
              current_stock: updated.currentStock,
              min_stock: updated.minStock,
              image: updated.image || ''
            };
            await client.from('products').upsert(payload);
          }
        } catch (e) {
          console.warn('Supabase updateProduct err:', e);
        }
      })();
    }
  };

  // Suppliers
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: Math.random().toString(36).substr(2, 9) };
    unmarkAsDeleted(newSupplier.id, toValidUUID(newSupplier.id));
    setState(prev => {
      const updatedState = { ...prev, suppliers: [...prev.suppliers, newSupplier] };
      mockDb.save(updatedState);
      return updatedState;
    });

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
        } catch (e) {
          console.warn('Supabase addSupplier err:', e);
        }
      })();
    }
  };

  const deleteSupplier = (id: string) => {
    const targetSupplier = state.suppliers.find(s => s.id === id || s.code === id || s.name === id);
    const targetId = toValidUUID(id);

    markAsDeleted(id, targetId);
    if (targetSupplier) {
      markAsDeleted(targetSupplier.id, toValidUUID(targetSupplier.id));
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
    const targetUUID = toValidUUID(id);

    setState(prev => {
      const order = prev.purchaseOrders.find(o => 
        o.id === id || 
        toValidUUID(o.id) === targetUUID ||
        (o.id && id && o.id.toLowerCase().trim() === id.toLowerCase().trim())
      );
      if (!order) return prev;

      let updatedProducts = prev.products;
      if (status === 'received' && order.status !== 'received') {
        updatedProducts = prev.products.map(p => {
          const item = order.items.find(i => i.productId === p.id);
          return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
        });
      }

      const updatedOrders = prev.purchaseOrders.map(o => 
        (o.id === order.id || o.id === id || toValidUUID(o.id) === targetUUID) 
          ? { ...o, status } 
          : o
      );

      const newState = {
        ...prev,
        products: updatedProducts,
        purchaseOrders: updatedOrders
      };
      mockDb.save(newState);
      return newState;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          const { error } = await client.from('purchase_orders').update({ status }).eq('id', targetUUID);
          if (error) {
            await client.from('purchase_orders').update({ status }).eq('id', id);
          }
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

    setState(prev => {
      const updatedState = {
        ...prev,
        products: updatedProducts,
        branchOrders: [...prev.branchOrders, newOrder]
      };
      mockDb.save(updatedState);
      return updatedState;
    });

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
              const prod = updatedProducts.find(p => p.id === item.productId);
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
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
          const item = targetOrder.items.find(i => i.productId === p.id);
          return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
        });
      }
      // If re-activated from 'rejected' to active status: deduct/reserve stock again
      else if (oldStatus === 'rejected' && status !== 'rejected') {
        updatedProducts = prev.products.map(p => {
          const item = targetOrder.items.find(i => i.productId === p.id);
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

      const newState = {
        ...prev,
        products: updatedProducts,
        branchOrders: updatedOrders
      };

      mockDb.save(newState);
      return newState;
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
          const { error } = await client.from('branch_orders').update(updatePayload).eq('id', targetUUID);
          if (error) {
            await client.from('branch_orders').update(updatePayload).eq('id', id);
          }

          if (affectedOrder && updatedProductsList) {
            for (const item of (affectedOrder as BranchOrder).items) {
              const prod = (updatedProductsList as Product[]).find(p => p.id === item.productId);
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
        } catch (e) {
          console.warn('Supabase update branch order status err:', e);
        }
      })();
    }
  };

  const deleteBranchOrder = (id: string) => {
    markAsDeleted(id);
    const targetId = toValidUUID(id);
    markAsDeleted(targetId);

    let updatedProductsList: Product[] | null = null;
    let deletedOrder: BranchOrder | null = null;

    setState(prev => {
      const targetOrder = prev.branchOrders.find(o => o.id === id || toValidUUID(o.id) === targetId);
      deletedOrder = targetOrder || null;
      let updatedProducts = prev.products;

      if (targetOrder && targetOrder.status !== 'rejected') {
        // Return reserved stock
        updatedProducts = prev.products.map(p => {
          const item = targetOrder.items.find(i => i.productId === p.id);
          return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
        });
      }

      updatedProductsList = updatedProducts;

      const updated = {
        ...prev,
        products: updatedProducts,
        branchOrders: prev.branchOrders.filter(o => o.id !== id && o.id !== targetId)
      };
      mockDb.save(updated);
      return updated;
    });

    const client = getSupabase();
    if (client) {
      (async () => {
        try {
          if (deletedOrder && (deletedOrder as BranchOrder).status !== 'rejected' && updatedProductsList) {
            for (const item of (deletedOrder as BranchOrder).items) {
              const prod = (updatedProductsList as Product[]).find(p => p.id === item.productId);
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
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

      const newState = {
        ...prev,
        products: updatedProducts,
        branchOrders: updatedOrders
      };
      mockDb.save(newState);
      return newState;
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
        } catch (e) {
          console.warn('Supabase update branch order items err:', e);
        }
      })();
    }
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
    createDistribution,
    saveBranchLimits,
    checkBranchOrderLimits,
    globalSearch,
    setGlobalSearch,
    resetDb: mockDb.reset
  };
}
