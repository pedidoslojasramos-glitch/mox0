import { Product, Supplier, PurchaseOrder, Branch, BranchOrder, User, UserRole, Distribution, BranchLimits } from '../types';

const STORAGE_KEY = 'ramox_data';
const SESSION_KEY = 'ramox_session_v1';
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

interface InventoryCount {
  id: string;
  productId: string;
  requestedAt: string;
  status: 'pending' | 'completed';
  countedQuantity?: number;
  warehouseQuantityAtRequest: number;
}

interface DbState {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  branches: Branch[];
  branchOrders: BranchOrder[];
  users: User[];
  currentUser: User | null;
  settings: {
    companyLogo: string;
    vignetteEnabled: boolean;
    vignetteWords: string[];
  };
  inventoryCounts: InventoryCount[];
  distributions: Distribution[];
  branchLimits: BranchLimits[];
  productClassifications: string[];
}

const initialState: DbState = {
  products: [
    { id: '1', name: 'Arroz 5kg', code: 'ARR001', category: 'Alimentos', unit: 'un', price: 25.90, currentStock: 150, minStock: 50, image: 'https://picsum.photos/seed/rice/200/200' },
    { id: '2', name: 'Feijão 1kg', code: 'FEI001', category: 'Alimentos', unit: 'un', price: 8.50, currentStock: 200, minStock: 40, image: 'https://picsum.photos/seed/beans/200/200' },
    { id: '3', name: 'Óleo de Soja', code: 'OLE001', category: 'Alimentos', unit: 'un', price: 6.20, currentStock: 80, minStock: 30, image: 'https://picsum.photos/seed/oil/200/200' },
    { id: 'epi-1', name: 'Luva de Proteção Nitrílica', code: 'EPI001', category: 'EPIs', unit: 'par', price: 18.90, currentStock: 300, minStock: 50, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300' },
    { id: 'epi-2', name: 'Capacete de Segurança Abafador', code: 'EPI002', category: 'EPIs', unit: 'un', price: 45.00, currentStock: 120, minStock: 20, image: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=300' },
    { id: 'epi-3', name: 'Óculos de Proteção Incolor', code: 'EPI003', category: 'EPIs', unit: 'un', price: 12.50, currentStock: 250, minStock: 30, image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300' },
    { id: 'epi-4', name: 'Bota de Segurança de Couro', code: 'EPI004', category: 'EPIs', unit: 'par', price: 89.90, currentStock: 90, minStock: 15, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
    { id: 'epi-5', name: 'Máscara PFF2 N95', code: 'EPI005', category: 'EPIs', unit: 'cx', price: 35.00, currentStock: 400, minStock: 50, image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=300' },
  ],
  suppliers: [
    { id: '1', name: 'Distribuidora Alimentos S.A.', code: 'FORN001', cnpj: '12.345.678/0001-90', contact: 'contato@distalimentos.com' },
    { id: '2', name: 'Logística Express', code: 'FORN002', cnpj: '98.765.432/0001-10', contact: 'comercial@logexpress.com' },
  ],
  purchaseOrders: [],
  branches: [
    { id: '1', name: 'Filial Centro', location: 'Rua Principal, 100', manager: 'João Silva' },
    { id: '2', name: 'Filial Norte', location: 'Av. das Flores, 500', manager: 'Maria Oliveira' },
  ],
  branchOrders: [],
  users: [
    { id: '1', name: 'Admin Master', email: 'admin@ramox.com', password: '123', role: 'admin' },
    { id: '2', name: 'Logística Operador', email: 'log@ramox.com', password: '123', role: 'logistics' },
    { id: '3', name: 'Gerente Centro', email: 'centro@ramox.com', password: '123', role: 'branch', branchId: '1' },
    { id: '4', name: 'Gerente Norte', email: 'pedidoslojasramos@gmail.com', password: '123', role: 'branch', branchId: '2' },
  ],
  currentUser: null,
  settings: {
    companyLogo: '',
    vignetteEnabled: true,
    vignetteWords: ['Agilidade', 'Precisão', 'Controle'],
  },
  inventoryCounts: [],
  distributions: [],
  branchLimits: [],
  productClassifications: ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Descartáveis', 'EPIs'],
};

const DELETED_KEY = 'ramox_deleted_ids_v1';

export function isRecordDeleted(id: string | undefined | null): boolean {
  if (!id) return false;
  try {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem(DELETED_KEY);
    if (!raw) return false;
    const set = new Set(JSON.parse(raw));
    const clean = id.toString().toLowerCase().trim();
    if (set.has(clean)) return true;

    // Standard static ID mappings
    if (clean === '1' && set.has('88888888-8888-8888-8888-888888888888')) return true;
    if (clean === '2' && set.has('99999999-9999-9999-9999-999999999999')) return true;
    if (clean === '3' && set.has('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')) return true;
    if (clean === '4' && set.has('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')) return true;
  } catch (e) {
    return false;
  }
  return false;
}

export const mockDb = {
  get: (): DbState => {
    try {
      const data = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (!data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialState, _initialized: true }));
        }
        return initialState;
      }
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialState, _initialized: true }));
        }
        return initialState;
      }
      
      const isInitialized = Boolean(parsed && parsed._initialized);

      const loadedUsers = (Array.isArray(parsed.users) ? parsed.users : (isInitialized ? [] : initialState.users))
        .filter((u: any) => u && u.id && !isRecordDeleted(u.id))
        .map((u: any) => ({
          ...u,
          password: u?.password ? String(u.password).trim() : '123'
        }));

      // Guarantee Master Admin user is registered in the users list
      if (!loadedUsers.some((u: any) => u && u.email && u.email.toLowerCase().trim() === 'admin@ramox.com')) {
        loadedUsers.unshift({
          id: '1',
          name: 'Admin Master',
          email: 'admin@ramox.com',
          password: '123',
          role: 'admin'
        });
      }

      const loadedClassifications = (Array.isArray(parsed.productClassifications) 
        ? parsed.productClassifications 
        : (isInitialized ? [] : [...initialState.productClassifications])).filter((c: string) => !isRecordDeleted(c));
      
      if (!isInitialized && !loadedClassifications.includes('EPIs')) {
        loadedClassifications.push('EPIs');
      }

      const loadedProducts = (Array.isArray(parsed.products) ? parsed.products : (isInitialized ? [] : [...initialState.products]))
        .filter((p: any) => p && p.id && !isRecordDeleted(p.id));

      // Only add default EPIs if database has never been initialized
      if (!isInitialized) {
        const hasEpi = loadedProducts.some((p: any) => p && (p.category === 'EPIs' || p.category === 'EPI'));
        if (!hasEpi) {
          initialState.products.filter(p => p.category === 'EPIs').forEach(epi => {
            if (!loadedProducts.some((p: any) => p && p.id === epi.id)) {
              loadedProducts.push(epi);
            }
          });
        }
      }

      const loadedBranches = (Array.isArray(parsed.branches) ? parsed.branches : (isInitialized ? [] : initialState.branches))
        .filter((b: any) => b && b.id && !isRecordDeleted(b.id));

      const loadedSuppliers = (Array.isArray(parsed.suppliers) ? parsed.suppliers : (isInitialized ? [] : initialState.suppliers))
        .filter((s: any) => s && s.id && !isRecordDeleted(s.id));

      const loadedBranchOrders = (Array.isArray(parsed.branchOrders) ? parsed.branchOrders : [])
        .filter((o: any) => o && !isRecordDeleted(o.id));

      const loadedPurchaseOrders = (Array.isArray(parsed.purchaseOrders) ? parsed.purchaseOrders : [])
        .filter((po: any) => po && !isRecordDeleted(po.id));

      let restoredUser: User | null = null;
      if (typeof window !== 'undefined') {
        try {
          const rawSession = localStorage.getItem(SESSION_KEY);
          if (rawSession) {
            const session = JSON.parse(rawSession);
            if (session && session.user && session.lastActivity) {
              const now = Date.now();
              if (now - Number(session.lastActivity) < INACTIVITY_TIMEOUT_MS) {
                const validUser = loadedUsers.find((u: any) => 
                  u && (u.id === session.user.id || (u.email && session.user.email && u.email.toLowerCase() === session.user.email.toLowerCase()))
                );
                if (validUser) {
                  restoredUser = validUser;
                  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: validUser, lastActivity: now }));
                } else {
                  localStorage.removeItem(SESSION_KEY);
                }
              } else {
                localStorage.removeItem(SESSION_KEY);
              }
            }
          }
        } catch (e) {
          console.warn('Error restoring session:', e);
        }
      }

      return {
        ...initialState,
        ...parsed,
        users: loadedUsers,
        currentUser: restoredUser,
        settings: parsed.settings || initialState.settings,
        branchLimits: Array.isArray(parsed.branchLimits) ? parsed.branchLimits : [],
        productClassifications: loadedClassifications,
        products: loadedProducts,
        branches: loadedBranches,
        suppliers: loadedSuppliers,
        purchaseOrders: loadedPurchaseOrders,
        branchOrders: loadedBranchOrders,
        inventoryCounts: Array.isArray(parsed.inventoryCounts) ? parsed.inventoryCounts : [],
        distributions: Array.isArray(parsed.distributions) ? parsed.distributions : [],
      };
    } catch (e) {
      console.error('Error loading mockDb, resetting to initialState:', e);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialState, _initialized: true }));
        }
      } catch (err) {
        // ignore
      }
      return initialState;
    }
  },
  save: (state: DbState) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _initialized: true }));
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  },
  reset: () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialState, _initialized: true }));
        window.location.reload();
      }
    } catch (e) {
      console.error('Error resetting localStorage:', e);
    }
  },
  clearCache: () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DELETED_KEY);
        window.location.reload();
      }
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }
};
