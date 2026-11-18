import { Product, Supplier, PurchaseOrder, Branch, BranchOrder, User, UserRole, Distribution, BranchLimits, DeliveryRoute } from '../types';
import { DEFAULT_LOJAS_RAMOS_LOGO } from '../utils/lojasRamosLogos';
import { isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'ramox_data';
const SESSION_KEY = 'ramox_session_v1';
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

export const DEFAULT_DELIVERY_ROUTES: DeliveryRoute[] = [
  { dayKey: 'monday', dayName: 'Segunda-feira', branchIds: [] },
  { dayKey: 'tuesday', dayName: 'Terça-feira', branchIds: [] },
  { dayKey: 'wednesday', dayName: 'Quarta-feira', branchIds: [] },
  { dayKey: 'thursday', dayName: 'Quinta-feira', branchIds: [] },
  { dayKey: 'friday', dayName: 'Sexta-feira', branchIds: [] },
  { dayKey: 'saturday', dayName: 'Sábado', branchIds: [] },
];

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
  deliveryRoutes: DeliveryRoute[];
}

const initialState: DbState = {
  products: [
    { id: '1', name: 'Arroz 5kg', code: 'ARR001', category: 'Alimentos', unit: 'un', price: 25.90, currentStock: 150, minStock: 50, image: '' },
    { id: '2', name: 'Feijão 1kg', code: 'FEI001', category: 'Alimentos', unit: 'un', price: 8.50, currentStock: 200, minStock: 40, image: '' },
    { id: '3', name: 'Óleo de Soja', code: 'OLE001', category: 'Alimentos', unit: 'un', price: 6.20, currentStock: 80, minStock: 30, image: '' },
    { id: 'epi-1', name: 'Luva de Proteção Nitrílica', code: 'EPI001', category: 'EPIs', unit: 'par', price: 18.90, currentStock: 300, minStock: 50, image: '' },
    { id: 'epi-2', name: 'Capacete de Segurança Abafador', code: 'EPI002', category: 'EPIs', unit: 'un', price: 45.00, currentStock: 120, minStock: 20, image: '' },
    { id: 'epi-3', name: 'Óculos de Proteção Incolor', code: 'EPI003', category: 'EPIs', unit: 'un', price: 12.50, currentStock: 250, minStock: 30, image: '' },
    { id: 'epi-4', name: 'Bota de Segurança de Couro', code: 'EPI004', category: 'EPIs', unit: 'par', price: 89.90, currentStock: 90, minStock: 15, image: '' },
    { id: 'epi-5', name: 'Máscara PFF2 N95', code: 'EPI005', category: 'EPIs', unit: 'cx', price: 35.00, currentStock: 400, minStock: 50, image: '' },
  ],
  suppliers: [
    { id: '1', name: 'Distribuidora Alimentos S.A.', code: 'FORN001', cnpj: '12.345.678/0001-90', contact: 'contato@distalimentos.com' },
    { id: '2', name: 'Logística Express', code: 'FORN002', cnpj: '98.765.432/0001-10', contact: 'comercial@logexpress.com' },
  ],
  purchaseOrders: [],
  branches: [],
  branchOrders: [],
  users: [
    { id: '1', name: 'Admin Master', email: 'admin@ramox.com', password: '123', role: 'admin' },
    { id: '2', name: 'Logística Operador', email: 'log@ramox.com', password: '123', role: 'logistics' },
    { id: '3', name: 'Gerente Centro', email: 'centro@ramox.com', password: '123', role: 'branch', branchId: '1' },
    { id: '4', name: 'Gerente Norte', email: 'pedidoslojasramos@gmail.com', password: '123', role: 'branch', branchId: '2' },
  ],
  currentUser: null,
  settings: {
    companyLogo: DEFAULT_LOJAS_RAMOS_LOGO,
    vignetteEnabled: true,
    vignetteWords: ['Agilidade', 'Precisão', 'Controle'],
  },
  inventoryCounts: [],
  distributions: [],
  branchLimits: [],
  productClassifications: ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Descartáveis', 'EPIs'],
  deliveryRoutes: DEFAULT_DELIVERY_ROUTES,
};

export function isRecordDeleted(_id: string | undefined | null): boolean {
  // Never exclude records based on local browser cache - Supabase is the single source of truth
  return false;
}

export const mockDb = {
  get: (): DbState => {
    let restoredUser: User | null = null;
    let cachedData: Partial<DbState> | null = null;

    if (typeof window !== 'undefined') {
      try {
        const rawSession = localStorage.getItem(SESSION_KEY);
        if (rawSession) {
          const session = JSON.parse(rawSession);
          if (session && session.user && session.lastActivity) {
            const now = Date.now();
            if (now - Number(session.lastActivity) < INACTIVITY_TIMEOUT_MS) {
              restoredUser = session.user;
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          }
        }
      } catch (e) {
        console.warn('Error restoring session:', e);
      }

      try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (rawData) {
          cachedData = JSON.parse(rawData);
        }
      } catch (e) {
        console.warn('Error restoring local storage cache:', e);
      }
    }

    const supabaseActive = isSupabaseConfigured();
    const mergedProducts = ((cachedData && Array.isArray(cachedData.products)) ? cachedData.products : initialState.products)
      .map(p => ({ ...p, image: '' }));
    const resolvedBranches = supabaseActive
      ? []
      : ((cachedData && Array.isArray(cachedData.branches)) ? cachedData.branches : initialState.branches);

    return {
      ...initialState,
      ...(cachedData || {}),
      branches: resolvedBranches,
      products: mergedProducts,
      currentUser: restoredUser
    };
  },
  save: (state: DbState) => {
    if (typeof window === 'undefined') return;
    try {
      const supabaseActive = isSupabaseConfigured();
      // Save ultra-lightweight offline snapshot without product images; branches come strictly from Supabase when configured
      const sanitizedProducts = (state.products || []).map(p => ({ ...p, image: '' }));
      const snapshot = {
        ...state,
        branches: supabaseActive ? [] : (state.branches || []),
        products: sanitizedProducts,
        currentUser: null // Session is saved in SESSION_KEY
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Could not save local cache snapshot to localStorage:', e);
    }
  },
  reset: () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      }
    } catch (e) {
      console.error('Error resetting:', e);
    }
  },
  clearCache: () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      }
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }
};
