export type UserRole = 'admin' | 'branch' | 'logistics';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  branchId?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  price: number;
  currentStock: number;
  minStock: number;
  image?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  cnpj: string;
  contact: string;
}

export type POStatus = 'pending' | 'approved' | 'checked' | 'received';

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  status: POStatus;
  totalValue: number;
  createdAt: any; // Timestamp
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
}

export interface BranchLimits {
  branchId: string;
  maxOrderBudget: number; // verba total por pedido
  productMonthlyLimits: { [productId: string]: number }; // quantidade maxima mensal por produto
}

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'picking' | 'picked' | 'invoiced' | 'loading' | 'shipped' | 'delivered' | 'discrepancy';

export interface BranchOrder {
  id: string;
  branchId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  status: OrderStatus;
  totalValue: number;
  createdAt: any; // Timestamp
  approvedBy?: string;
  approvedAt?: string;
}

export type DistributionType = 'general' | 'epi';

export interface Distribution {
  id: string;
  type?: DistributionType;
  recipients?: { [branchId: string]: string };
  items: {
    productId: string;
    quantityPerBranch: {
      branchId: string;
      quantity: number;
      recipientName?: string;
    }[];
  }[];
  createdAt: any;
}
