import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

const parseDate = (dateStr: any) => (dateStr ? new Date(dateStr) : undefined);

export const getStats = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query as any;

    const [totalOrders, totalCustomers, totalRevenue, abandonedCarts] = await Promise.all([
      // Note: Add 'cancelledAt: null' to where clause after updating schema and running 'npx prisma generate'
      prisma.order.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.aggregate({
        where: { tenantId },
        _sum: { totalPrice: true }
      }),
      prisma.checkout.aggregate({
        where: { tenantId, isCompleted: false },
        _sum: { totalPrice: true }
      })
    ]);

    // Fix: Safely access _sum with optional chaining
    const revenue = Number(totalRevenue._sum?.totalPrice ?? 0);
    const lostRevenue = Number(abandonedCarts._sum?.totalPrice ?? 0);
    const aov = totalOrders > 0 ? (revenue / totalOrders).toFixed(2) : 0;

    res.json({
      totalOrders,
      totalCustomers,
      totalRevenue: revenue,
      averageOrderValue: Number(aov),
      lostRevenue
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const getSalesOverTime = async (req: Request, res: Response) => {
  try {
    const { tenantId, startDate, endDate } = req.query as any;

    // Note: Add 'cancelledAt: null' here after schema update
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

    const salesByDate: Record<string, number> = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0] || '' ;
      salesByDate[date] = (salesByDate[date] || 0) + Number(order.totalPrice);
    });

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

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId as string;

        if (!tenantId) {
            return res.status(400).json({ error: "Tenant ID is missing" });
        }

        // 1. Fetch all customers
        const customers = await prisma.customer.findMany({
            where: { tenantId },
            orderBy: { id: 'desc' },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });

        // 2. Aggregate actual lifetime spend from the Order table
        const spendStats = await prisma.order.groupBy({
            by: ['customerId'],
            where: {
                tenantId,
                customerId: { in: customers.map(c => c.id) }
            },
            _sum: { totalPrice: true }
        });

        // 3. Merge spend data into customer list
        const enrichedCustomers = customers.map(customer => {
            const stats = spendStats.find(s => s.customerId === customer.id);
            return {
                ...customer,
                // Flattening these for easier access in UI
                totalOrders: customer._count.orders, 
                totalSpent: Number(stats?._sum.totalPrice ?? 0) 
            };
        });

        res.json(enrichedCustomers);
    } catch (error) {
        console.error("Get Customers Error:", error);
        res.status(500).json({ error: "Failed to fetch customers" });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
      
        const tenantId = req.user?.tenantId as string;

        if (!tenantId) {
            return res.status(400).json({ error: "Tenant ID is missing" });
        }

        const products = await prisma.product.findMany({
            where: { tenantId },
           
            orderBy: { id: 'desc' } 
        });
        res.json(products);
    } catch (error) {
        console.error("Get Products Error:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
};
export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query as any;

    // Logic: Group by CustomerID inside the Order table and sum the prices
    const topSpenders = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        customerId: { not: null },
        // Note: Add 'cancelledAt: null' here after schema update
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 5
    });

    const customerIds = topSpenders.map(g => g.customerId as string);
    
    // Fetch user details (emails) for these IDs
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        tenantId
      },
      select: { id: true, email: true }
    });

    const result = topSpenders.map(spender => {
      const customerInfo = customers.find(c => c.id === spender.customerId);
      // Fix: Cast _count to any to resolve TS error 'Property id does not exist on type true'
      const orderCount = (spender._count as any)?.id ?? 0;
      
      return {
        email: customerInfo?.email || "Unknown",
        // Fix: Safely access _sum
        totalSpent: Number(spender._sum?.totalPrice ?? 0),
        orders: orderCount
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Top Customers Error:", error);
    res.status(500).json({ error: "Failed to fetch top customers" });
  }
};

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

export const getOrders = async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId as string;

        if (!tenantId) {
            return res.status(400).json({ error: "Tenant ID is missing" });
        }

        const orders = await prisma.order.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: {
                        email: true
                        // Removed firstName/lastName as they don't exist in your current schema
                    }
                }
            }
        });

        // Format data for the UI Table
        const formattedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: `#${order.shopifyOrderId}`,
            date: order.createdAt,
            // Since we don't have names, we use Email or "Guest"
            customer: order.customer?.email || 'Guest',
            email: order.customer?.email || 'N/A',
            total: Number(order.totalPrice),
            paymentStatus: 'Paid',
            items: 1 
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};
