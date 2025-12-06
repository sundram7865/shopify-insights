export interface User {
  id: string;
  email: string;
  tenantId: string;
  isShopifyConnected: boolean;
  token?: string;
}

export interface StatsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
}

export interface TopCustomer {
  email: string;
  orders: number;
  totalSpent: number;
}

export interface CustomerSegment {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatRate: number;
}

export interface SalesDataPoint {
  date: string;
  sales: number;
}