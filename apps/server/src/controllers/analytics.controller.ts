import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// Helper: Standardize date handling
const parseDate = (dateStr: any) => (dateStr ? new Date(dateStr) : undefined);


export const getStats = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query as any;

    const [totalOrders, totalCustomers, totalRevenue] = await Promise.all([
      prisma.order.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.aggregate({
        where: { tenantId },
        _sum: { totalPrice: true }
      })
    ]);

    const revenue = Number(totalRevenue._sum.totalPrice || 0);
    const aov = totalOrders > 0 ? (revenue / totalOrders).toFixed(2) : 0;

    res.json({
      totalOrders,
      totalCustomers,
      totalRevenue: revenue,
      averageOrderValue: Number(aov)
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// 2. Get Sales Trend (With Date Filtering)
export const getSalesOverTime = async (req: Request, res: Response) => {
  try {
    const { tenantId, startDate, endDate } = req.query as any;

    // Build dynamic filter
    const dateFilter: any = { tenantId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = parseDate(startDate);
      if (endDate) dateFilter.createdAt.lte = parseDate(endDate);
    }

    const orders = await prisma.order.findMany({
      where: dateFilter,
      select: { createdAt: true, totalPrice: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by Date (YYYY-MM-DD)
    const salesByDate: Record<string, number> = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0] || '' ;
      salesByDate[date] = (salesByDate[date] || 0) + Number(order.totalPrice);
    });

    // Format for Chart.js
    const chartData = Object.entries(salesByDate).map(([date, sales]) => ({
      date,
      sales
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Trend Error:", error);
    res.status(500).json({ error: "Failed to fetch sales trend" });
  }
};

// 3. Get Top 5 Customers
export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query as any;

    const topCustomers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: 5,
      select: { 
        email: true, 
        totalSpent: true, 
        _count: { select: { orders: true } } 
      }
    });

    res.json(topCustomers.map(c => ({
      email: c.email,
      totalSpent: c.totalSpent,
      orders: c._count.orders
    })));
  } catch (error) {
    console.error("Top Customers Error:", error);
    res.status(500).json({ error: "Failed to fetch top customers" });
  }
};

// 4. Get Customer Segments (Repeat vs New)
export const getCustomerSegments = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query as any;

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: { _count: { select: { orders: true } } }
    });

    const total = customers.length;
    if (total === 0) return res.json({ total: 0, new: 0, returning: 0, repeatRate: 0 });

    const returningCount = customers.filter(c => c._count.orders > 1).length;
    const newCount = total - returningCount;
    const repeatRate = ((returningCount / total) * 100).toFixed(1);

    res.json({
      totalCustomers: total,
      newCustomers: newCount,
      returningCustomers: returningCount,
      repeatRate: Number(repeatRate)
    });
  } catch (error) {
    console.error("Segments Error:", error);
    res.status(500).json({ error: "Failed to fetch segments" });
  }
};