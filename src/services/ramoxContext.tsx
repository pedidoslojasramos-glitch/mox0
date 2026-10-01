import React, { useState, useEffect, useRef } from 'react';
import { mockDb, isRecordDeleted } from './mockDb';
import { Product, Supplier, PurchaseOrder, Branch, BranchOrder, User, UserRole, Distribution, DistributionType, BranchLimits, DeliveryRoute } from '../types';
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

const CANCELLED_ORDERS_KEY = 'ramox_cancelled_orders_v1';
const CANCELLED_DIST_BRANCHES_KEY = 'ramox_cancelled_dist_branches_v1';

export function getCancelledOrderIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(CANCELLED_ORDERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

export function markAsCancelled(...ids: (string | undefined | null)[]) {
  try {
    if (typeof window === 'undefined') return;
    const set = getCancelledOrderIds();
    ids.forEach(id => {
      if (id) {
        const str = id.toString().trim().toLowerCase();
        if (str) {
          set.add(str);
          const uuid = toValidUUID(str);
          if (uuid) set.add(uuid.toLowerCase());
        }
      }
    });
    localStorage.setItem(CANCELLED_ORDERS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function isOrderCancelled(id: string | undefined | null): boolean {
  if (!id) return false;
  const set = getCancelledOrderIds();
  const clean = id.toString().trim().toLowerCase();
  if (set.has(clean)) return true;
  const uuid = toValidUUID(id.toString()).toLowerCase();
  return set.has(uuid);
}

export function getCancelledDistBranches(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(CANCELLED_DIST_BRANCHES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

export function markDistBranchCancelled(distId?: string, branchId?: string) {
  try {
    if (typeof window === 'undefined' || !distId || !branchId) return;
    const set = getCancelledDistBranches();
    const cleanDist = distId.toString().trim().toLowerCase();
    const cleanBranch = branchId.toString().trim().toLowerCase();
    set.add(`${cleanDist}_${cleanBranch}`);
    const branchUuid = toValidUUID(cleanBranch).toLowerCase();
    if (branchUuid) {
      set.add(`${cleanDist}_${branchUuid}`);
    }
    localStorage.setItem(CANCELLED_DIST_BRANCHES_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function isDistBranchCancelled(distId?: string, branchId?: string): boolean {
  if (!distId || !branchId) return false;
  const set = getCancelledDistBranches();
  const cleanDist = distId.toString().trim().toLowerCase();
  const cleanBranch = branchId.toString().trim().toLowerCase();
  if (set.has(`${cleanDist}_${cleanBranch}`)) return true;
  const branchUuid = toValidUUID(cleanBranch).toLowerCase();
  if (branchUuid && set.has(`${cleanDist}_${branchUuid}`)) return true;
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
  if (!currentState || !Array.isArray(currentState.distributions) || currentState.distributions.length === 0) {
    return currentState;
  }

  const products: Product[] = currentState.products || [];
  const branches: Branch[] = currentState.branches || [];
  let branchOrders: BranchOrder[] = Array.isArray(currentState.branchOrders) ? [...currentState.branchOrders] : [];
  let hasChanges = false;

  const getCanonicalBranch = (bId: string): Branch | undefined => {
    if (!bId) return undefined;
    const clean = bId.toString().trim().toLowerCase();
    return branches.find(b => 
      b.id.toLowerCase() === clean || 
      toValidUUID(b.id) === toValidUUID(bId) ||
      b.name.toLowerCase() === clean ||
      (b.code && b.code.toLowerCase() === clean)
    );
  };

  currentState.distributions.forEach((dist: Distribution) => {
    if (!dist || !Array.isArray(dist.items)) return;

    // Map: canonicalBranchId -> Map<canonicalProductId, quantity>
    const branchExpectedItems = new Map<string, Map<string, number>>();

    dist.items.forEach(item => {
      if (!item || !Array.isArray(item.quantityPerBranch)) return;
      const prod = findProductHelper(products, item.productId);
      const canonicalProdId = prod ? prod.id : item.productId;

      item.quantityPerBranch.forEach(q => {
        if (!q || !q.quantity || Number(q.quantity) <= 0) return;
        const branch = getCanonicalBranch(q.branchId);
        const canonicalBId = branch ? branch.id : q.branchId;

        if (!branchExpectedItems.has(canonicalBId)) {
          branchExpectedItems.set(canonicalBId, new Map<string, number>());
        }
        const pMap = branchExpectedItems.get(canonicalBId)!;
        pMap.set(canonicalProdId, (pMap.get(canonicalProdId) || 0) + Number(q.quantity));
      });
    });

    branchExpectedItems.forEach((expectedProdMap, canonicalBranchId) => {
      const branch = getCanonicalBranch(canonicalBranchId);
      const distIdClean = (dist.id || '').toUpperCase();

      // If this distribution for this branch was explicitly cancelled or deleted, never recreate or reactivate it!
      if (isDistBranchCancelled(dist.id, canonicalBranchId)) {
        return;
      }

      // Find existing order for this branch that came from this distribution
      const orderIndex = branchOrders.findIndex(o => {
        if (!o) return false;
        const matchesBranch = o.branchId === canonicalBranchId || 
                              toValidUUID(o.branchId) === toValidUUID(canonicalBranchId) ||
                              (branch && o.branchId === branch.id);
        if (!matchesBranch) return false;

        const hasDistTag = (o.notes && distIdClean && o.notes.toUpperCase().includes(distIdClean)) ||
                           (o.notes && o.notes.toLowerCase().includes('distribuição')) ||
                           (o.approvedBy && o.approvedBy.toLowerCase().includes('distribuição'));

        return hasDistTag;
      });

      if (orderIndex >= 0) {
        const existingOrder = branchOrders[orderIndex];

        // If existing order was cancelled (rejected) or marked deleted, honor the cancellation!
        if (existingOrder.status === 'rejected' || isOrderCancelled(existingOrder.id) || isDeleted(existingOrder.id)) {
          markDistBranchCancelled(dist.id, canonicalBranchId);
          if (existingOrder.status !== 'rejected') {
            branchOrders[orderIndex] = { ...existingOrder, status: 'rejected' };
            hasChanges = true;
          }
          return;
        }

        const currentItemsMap = new Map<string, number>();

        (existingOrder.items || []).forEach(it => {
          if (!it) return;
          const p = findProductHelper(products, it.productId);
          const pId = p ? p.id : it.productId;
          currentItemsMap.set(pId, (currentItemsMap.get(pId) || 0) + (Number(it.quantity) || 0));
        });

        let orderModified = false;
        expectedProdMap.forEach((expQty, pId) => {
          const curQty = currentItemsMap.get(pId) || 0;
          if (curQty < expQty) {
            currentItemsMap.set(pId, expQty);
            orderModified = true;
          }
        });

        if (orderModified) {
          const newItems: { productId: string; quantity: number }[] = [];
          currentItemsMap.forEach((quantity, productId) => {
            newItems.push({ productId, quantity });
          });
          const totalValue = newItems.reduce((acc, it) => {
            const prod = findProductHelper(products, it.productId);
            return acc + (prod ? prod.price * it.quantity : 0);
          }, 0);

          branchOrders[orderIndex] = {
            ...existingOrder,
            items: newItems,
            totalValue: totalValue > 0 ? totalValue : existingOrder.totalValue,
            orderType: dist.type === 'epi' ? 'epi' : 'distribution',
            notes: existingOrder.notes || (dist.type === 'epi' ? `Distribuição de EPIs (Lote #${distIdClean})` : `Distribuição em Massa (Lote #${distIdClean})`)
          };
          hasChanges = true;
        }
      } else {
        // If this distribution for this branch was previously cancelled or marked deleted, DO NOT recreate it!
        if (isDistBranchCancelled(dist.id, canonicalBranchId)) {
          return;
        }

        // Missing order for this branch from this distribution! Restore it so it appears in the separation panel
        const newOrderId = Math.random().toString(36).substr(2, 9);
        const branchItems: { productId: string; quantity: number }[] = [];
        expectedProdMap.forEach((quantity, productId) => {
          branchItems.push({ productId, quantity });
        });

        const totalValue = branchItems.reduce((acc, it) => {
          const prod = findProductHelper(products, it.productId);
          return acc + (prod ? prod.price * it.quantity : 0);
        }, 0);

        const recipient = dist.recipients?.[canonicalBranchId] || 
                          dist.recipients?.[toValidUUID(canonicalBranchId)] || 
                          branch?.manager || 
                          undefined;

        branchOrders.push({
          id: newOrderId,
          branchId: canonicalBranchId,
          items: branchItems,
          status: 'approved',
          totalValue,
          createdAt: dist.createdAt || new Date().toISOString(),
          approvedBy: dist.type === 'epi' ? 'Distribuição de EPIs' : 'Distribuição Central (Em Lote)',
          approvedAt: dist.createdAt || new Date().toISOString(),
          notes: dist.type === 'epi'
            ? `Distribuição de EPIs (Lote #${distIdClean})`
            : `Distribuição em Massa (Lote #${distIdClean})`,
          recipientName: recipient,
          orderType: dist.type === 'epi' ? 'epi' : 'distribution'
        });
        hasChanges = true;
      }
    });
  });

  if (hasChanges) {
    const updated = { ...currentState, branchOrders };
    mockDb.save(updated);
    return updated;
  }

  return currentState;
}

export function useRamox() {
  const [state, setState] = useState(() => reconcileDistributionOrders(mockDb.get()));
  const [globalSearch, setGlobalSearch] = useState('');
  const isInitialLoadCompleteRef = useRef(false);

  const refreshData = async () => {
    // 1. Re-sync from localStorage / mockDb immediately with reconciliation
    const freshLocal = reconcileDistributionOrders(mockDb.get());
    setState(prev => ({
      ...prev,
      ...freshLocal,
      currentUser: prev.currentUser || freshLocal.currentUser
    }));

    // 2. Fetch from Supabase if client is connected
    const client = getSupabase();
    if (!client) return;

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
            .map((o: any) => {
              // Try to map UUID branchId back to canonical branch ID if found in updated.branches
              const matchingBranch = updated.branches.find(b => 
                b.id === o.branch_id || 
                toValidUUID(b.id) === toValidUUID(o.branch_id) || 
                b.id === o.branchId ||
                toValidUUID(b.id) === toValidUUID(o.branchId)
              );
              const branchId = matchingBranch ? matchingBranch.id : (o.branch_id || o.branchId);

              // Parse items if string
              let rawItems = o.items;
              if (typeof rawItems === 'string') {
                try {
                  rawItems = JSON.parse(rawItems);
                } catch (e) {
                  rawItems = [];
                }
              }

              const safeItems = Array.isArray(rawItems) ? rawItems.map((it: any) => {
                const prod = findProductHelper(updated.products, it.productId);
                return {
                  productId: prod ? prod.id : it.productId,
                  quantity: Number(it.quantity) || 0
                };
              }) : [];

              return {
                id: o.id,
                branchId,
                status: o.status,
                totalValue: Number(o.total_value ?? o.totalValue) || 0,
                items: safeItems,
                createdAt: o.created_at || o.createdAt,
                approvedBy: o.approved_by || o.approvedBy || undefined,
                approvedAt: o.approved_at || o.approvedAt || undefined,
                notes: o.notes || undefined,
                recipientName: o.recipient_name || o.recipientName || undefined,
                orderType: o.order_type || o.orderType || undefined
              };
            });

          const localOnlyOrders = (prev.branchOrders || []).filter(lo => 
            lo && !isDeleted(lo.id) &&
            !mappedOrders.some(so => so.id === lo.id || toValidUUID(so.id) === toValidUUID(lo.id))
          );

          // If local orders have advanced operational statuses (e.g. approved, picking, loading), do not regress them
          const operationalStatusOrder = ['pending', 'discrepancy', 'approved', 'picking', 'picked', 'invoiced', 'loading', 'shipped', 'delivered', 'rejected'];
          const mergedOrders = mappedOrders.map(so => {
            const localMatch = (prev.branchOrders || []).find(lo => 
              lo.id === so.id || 
              toValidUUID(lo.id) === toValidUUID(so.id) ||
              lo.id.toLowerCase().trim() === so.id.toLowerCase().trim()
            );
            if (localMatch) {
              // Critical: If local was rejected (cancelled) OR remote was rejected OR order is cancelled in storage, status MUST remain 'rejected'!
              let preferredStatus: BranchOrder['status'] = so.status;
              if (
                localMatch.status === 'rejected' ||
                so.status === 'rejected' ||
                isOrderCancelled(localMatch.id) ||
                isOrderCancelled(so.id)
              ) {
                preferredStatus = 'rejected';
              } else {
                const localIndex = operationalStatusOrder.indexOf(localMatch.status);
                const remoteIndex = operationalStatusOrder.indexOf(so.status);
                preferredStatus = (localIndex > remoteIndex) ? localMatch.status : so.status;
              }

              // If localMatch has items and remote has fewer/empty items, preserve localMatch items so separation is complete
              const preferredItems = (localMatch.items && localMatch.items.length >= (so.items?.length || 0))
                ? localMatch.items
                : so.items;

              return {
                ...so,
                ...localMatch,
                status: preferredStatus,
                items: preferredItems,
                approvedBy: localMatch.approvedBy || so.approvedBy,
                approvedAt: localMatch.approvedAt || so.approvedAt,
                notes: localMatch.notes || so.notes,
                recipientName: localMatch.recipientName || so.recipientName,
                orderType: localMatch.orderType || so.orderType
              };
            }
            return so;
          });

          updated.branchOrders = [...mergedOrders, ...localOnlyOrders];
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

        const reconciled = reconcileDistributionOrders(updated);
        mockDb.save(reconciled);
        return reconciled;
      });
    } catch (e) {
      console.warn('Erro ao carregar dados do Supabase:', e);
    } finally {
      isInitialLoadCompleteRef.current = true;
    }
  };

  // Initial fetch from Supabase if connected
  useEffect(() => {
    refreshData();
  }, []);

  // Save to local storage & sync to Supabase on state change with debounce
  useEffect(() => {
    mockDb.save(state);

    if (!isInitialLoadCompleteRef.current) {
      return;
    }

    const client = getSupabase();
    if (!client) return;

    // Debounce background network syncing to avoid thread locking & high CPU/network contention
    const timer = setTimeout(async () => {
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
    }, 1200);

    return () => clearTimeout(timer);
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
    if (status !== 'rejected') {
      unmarkAsDeleted(id, targetUUID);
    } else {
      markAsCancelled(id, targetUUID);
    }

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

      if (status === 'rejected') {
        const distId = extractDistIdFromOrder(targetOrder);
        if (distId) {
          markDistBranchCancelled(distId, targetOrder.branchId);
        }
      }

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
          await Promise.allSettled([
            client.from('branch_orders').update(updatePayload).eq('id', targetUUID),
            client.from('branch_orders').update(updatePayload).eq('id', id)
          ]);

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

  const batchUpdateBranchOrderStatus = (ids: string[], status: BranchOrder['status'], approvedBy?: string) => {
    if (!ids || ids.length === 0) return;
    if (status !== 'rejected') {
      ids.forEach(id => unmarkAsDeleted(id, toValidUUID(id)));
    } else {
      ids.forEach(id => markAsCancelled(id, toValidUUID(id)));
    }
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
          const distId = extractDistIdFromOrder(o);
          if (distId) {
            markDistBranchCancelled(distId, o.branchId);
          }
          if (oldStatus !== 'rejected') {
            updatedProducts = updatedProducts.map(p => {
              const item = o.items.find(i => i.productId === p.id);
              return item ? { ...p, currentStock: p.currentStock + item.quantity } : p;
            });
          }
        } else if ((oldStatus as string) === 'rejected' && (status as string) !== 'rejected') {
          updatedProducts = updatedProducts.map(p => {
            const item = o.items.find(i => i.productId === p.id);
            return item ? { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) } : p;
          });
        }

        return { ...o, ...updateData };
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
          for (const id of ids) {
            const uId = toValidUUID(id);
            await Promise.allSettled([
              client.from('branch_orders').update(updatePayload).eq('id', uId),
              client.from('branch_orders').update(updatePayload).eq('id', id)
            ]);
          }
        } catch (e) {
          console.warn('Supabase batch update branch orders err:', e);
        }
      })();
    }
  };

  const deleteBranchOrder = (id: string) => {
    markAsDeleted(id);
    const targetId = toValidUUID(id);
    markAsDeleted(targetId);
    markAsCancelled(id, targetId);

    let updatedProductsList: Product[] | null = null;
    let deletedOrder: BranchOrder | null = null;

    setState(prev => {
      const targetOrder = prev.branchOrders.find(o => o.id === id || toValidUUID(o.id) === targetId);
      deletedOrder = targetOrder || null;
      let updatedProducts = prev.products;

      if (targetOrder) {
        const distId = extractDistIdFromOrder(targetOrder);
        if (distId) {
          markDistBranchCancelled(distId, targetOrder.branchId);
        }
      }

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
          await Promise.allSettled([
            client.from('branch_orders').delete().eq('id', targetId),
            client.from('branch_orders').delete().eq('id', id)
          ]);
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

      const updatedState = {
        ...prev,
        products: updatedProducts,
        inventoryCounts: prev.inventoryCounts.map(c => 
          c.id === countId ? { ...c, status: 'completed' as const, countedQuantity: quantity } : c
        )
      };
      mockDb.save(updatedState);
      return updatedState;
    });
  };

  const cancelInventoryCount = (countId: string) => {
    setState(prev => {
      const updatedState = {
        ...prev,
        inventoryCounts: prev.inventoryCounts.map(c => 
          c.id === countId ? { ...c, status: 'cancelled' as const } : c
        )
      };
      mockDb.save(updatedState);
      return updatedState;
    });
  };

  const cancelAllPendingInventoryCounts = () => {
    setState(prev => {
      const updatedState = {
        ...prev,
        inventoryCounts: prev.inventoryCounts.map(c => 
          c.status === 'pending' ? { ...c, status: 'cancelled' as const } : c
        )
      };
      mockDb.save(updatedState);
      return updatedState;
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

      const reconciled = reconcileDistributionOrders(newState);
      mockDb.save(reconciled);
      return reconciled;
    });

    // Sync newly created orders and stock to Supabase
    const client = getSupabase();
    if (client && newlyCreatedBranchOrders.length > 0) {
      (async () => {
        try {
          for (const bo of newlyCreatedBranchOrders) {
            const orderPayload = {
              id: toValidUUID(bo.id),
              branch_id: toValidUUID(bo.branchId),
              items: bo.items,
              status: bo.status,
              total_value: bo.totalValue,
              created_at: bo.createdAt,
              approved_by: bo.approvedBy,
              approved_at: bo.approvedAt
            };
            await client.from('branch_orders').upsert(orderPayload);
          }

          if (updatedProductsList && updatedProductsList.length > 0) {
            for (const item of items) {
              const prod = findProductHelper(updatedProductsList, item.productId);
              if (prod) {
                await client.from('products').update({ current_stock: prod.currentStock }).eq('id', toValidUUID(prod.id));
              }
            }
          }
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
