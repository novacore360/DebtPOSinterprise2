// src/components/Dashboard.jsx
import React, { useMemo } from 'react';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Clock, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Calendar
} from 'lucide-react';

// Styling constants
const S = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 20,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statLabel: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: 11, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    fontWeight: 600 
  },
  statValue: { 
    color: '#fff', 
    fontSize: 26, 
    fontWeight: 800, 
    margin: '6px 0 0' 
  },
};

function StatCard({ label, value, icon: Icon, color, subtext, trend }) {
  return (
    <div 
      style={{ 
        ...S.card, 
        borderLeft: `3px solid ${color}`,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        <div style={S.statLabel}>{label}</div>
        <div style={S.statValue}>{value}</div>
        {subtext && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
            {subtext}
          </div>
        )}
        {trend && (
          <div style={{ 
            color: trend > 0 ? '#1cc88a' : '#e74a3b', 
            fontSize: 11, 
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
          </div>
        )}
      </div>
      <div style={{
        width: 48, 
        height: 48, 
        borderRadius: 12,
        background: `${color}20`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
      }}>
        <Icon size={22} color={color} />
      </div>
    </div>
  );
}

function RecentTransactionRow({ transaction, customer }) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding: '10px 8px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4e73df20, #1cc88a20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={12} color="#4e73df" />
          </div>
          {customer?.name || transaction.customer_name || 'Unknown'}
        </div>
      </td>
      <td style={{ padding: '10px 8px', color: '#1cc88a', fontWeight: 600 }}>
        ₱{(transaction.total_amount || 0).toFixed(2)}
      </td>
      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} />
          {new Date(transaction.purchase_date).toLocaleDateString()}
        </div>
      </td>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ position: 'relative' }}>
          <span 
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
              padding: '3px 10px', 
              borderRadius: 20, 
              fontSize: 11, 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: transaction.status === 'paid' 
                ? 'rgba(28,200,138,0.2)' 
                : 'rgba(246,194,62,0.2)',
              color: transaction.status === 'paid' ? '#1cc88a' : '#f6c23e',
              cursor: 'help',
            }}>
            {transaction.status === 'paid' ? <CheckCircle size={10} /> : <Clock size={10} />}
            {transaction.status || 'pending'}
          </span>
          {showTooltip && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              background: '#1e2035',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}>
              {transaction.status === 'paid' ? 'Payment completed' : 'Awaiting payment'}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function LowStockProductCard({ product }) {
  const percentage = ((product.stock || 0) / (product.lowStockThreshold || 5)) * 100;
  const isOutOfStock = (product.stock || 0) === 0;
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: isOutOfStock ? 'rgba(231,74,59,0.2)' : 'rgba(246,194,62,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={12} color={isOutOfStock ? '#e74a3b' : '#f6c23e'} />
          </div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{product.name}</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 32 }}>
          {product.productCode} • {product.category || 'Uncategorized'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          background: isOutOfStock ? 'rgba(231,74,59,0.2)' : 'rgba(246,194,62,0.2)',
          color: isOutOfStock ? '#e74a3b' : '#f6c23e',
          marginBottom: 6,
        }}>
          {product.stock || 0} left
        </div>
        <div style={{
          width: 60,
          height: 3,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(100, percentage)}%`,
            height: '100%',
            background: isOutOfStock ? '#e74a3b' : '#f6c23e',
            borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ products, customers, purchases }) {
  // Calculate statistics from Firebase data structure
  const stats = useMemo(() => {
    // Total sales (revenue)
    const totalSales = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    // Calculate total cost and profit from product_data
    let totalCost = 0;
    let totalItemsSold = 0;
    
    purchases.forEach(purchase => {
      const items = purchase.product_data || [];
      items.forEach(item => {
        totalCost += (item.cost_price || 0) * item.quantity;
        totalItemsSold += item.quantity;
      });
    });
    
    const totalProfit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    
    // Pending payments
    const pendingPayments = purchases.filter(p => p.status !== 'paid').length;
    const pendingAmount = purchases
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    // Paid vs Pending
    const paidCount = purchases.filter(p => p.status === 'paid').length;
    const paidAmount = purchases
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    // Recent transactions (last 10)
    const recentTransactions = [...purchases]
      .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))
      .slice(0, 10);
    
    // Low stock products (stock <= threshold)
    const lowStockProducts = products.filter(p => 
      (p.stock || 0) <= (p.lowStockThreshold || 5)
    );
    
    // Out of stock products
    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
    
    // Average order value
    const avgOrderValue = purchases.length > 0 ? totalSales / purchases.length : 0;
    
    // Calculate trends (compare with previous period - last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const sixtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    const recentSales = purchases
      .filter(p => new Date(p.purchase_date) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    const previousSales = purchases
      .filter(p => new Date(p.purchase_date) >= sixtyDaysAgo && new Date(p.purchase_date) < thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    const salesTrend = previousSales > 0 
      ? ((recentSales - previousSales) / previousSales) * 100 
      : 0;
    
    return {
      totalSales,
      totalCost,
      totalProfit,
      profitMargin,
      pendingPayments,
      pendingAmount,
      paidCount,
      paidAmount,
      recentTransactions,
      lowStockProducts,
      outOfStockProducts,
      avgOrderValue,
      salesTrend,
      totalItemsSold,
      totalOrders: purchases.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
    };
  }, [purchases, products, customers]);

  // Get customer name helper
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  // Quick stats for the top row (mobile friendly)
  const quickStats = [
    { 
      label: 'Total Revenue', 
      value: `₱${stats.totalSales.toFixed(2)}`, 
      icon: DollarSign, 
      color: '#4e73df',
      subtext: `${stats.totalOrders} orders`,
      trend: stats.salesTrend,
    },
    { 
      label: 'Total Profit', 
      value: `₱${stats.totalProfit.toFixed(2)}`, 
      icon: TrendingUp, 
      color: '#1cc88a',
      subtext: `${stats.profitMargin.toFixed(1)}% margin`,
    },
    { 
      label: 'Avg Order', 
      value: `₱${stats.avgOrderValue.toFixed(2)}`, 
      icon: CreditCard, 
      color: '#36b9cc',
      subtext: `${stats.totalItemsSold} items sold`,
    },
    { 
      label: 'Pending', 
      value: `₱${stats.pendingAmount.toFixed(2)}`, 
      icon: Clock, 
      color: '#f6c23e',
      subtext: `${stats.pendingPayments} orders pending`,
    },
  ];

  // Secondary stats
  const secondaryStats = [
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: '#858796' },
    { label: 'Products', value: stats.totalProducts, icon: Package, color: '#f6c23e' },
    { label: 'Paid Orders', value: stats.paidCount, icon: CheckCircle, color: '#1cc88a' },
    { label: 'Low Stock', value: stats.lowStockProducts.length, icon: AlertCircle, color: '#e74a3b' },
  ];

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ 
          color: '#fff', 
          margin: 0, 
          fontSize: "clamp(16px, 4vw, 22px)",
          fontWeight: 700,
        }}>
          Dashboard Overview
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4, fontSize: 13 }}>
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        {quickStats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        {secondaryStats.map((stat, idx) => (
          <div key={idx} style={{
            ...S.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{stat.label}</div>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{stat.value}</div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${stat.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <stat.icon size={18} color={stat.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: 20 
      }}>
        {/* Recent Transactions Table */}
        <div style={S.card}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <h6 style={{ color: '#fff', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={16} color="#4e73df" /> 
              Recent Transactions
            </h6>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              Last {stats.recentTransactions.length} orders
            </span>
          </div>
          
          {stats.recentTransactions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: 'rgba(255,255,255,0.3)' 
            }}>
              <ShoppingCart size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No transactions yet</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Start by creating a new purchase</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Customer</th>
                    <th style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: 'right', padding: '8px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Amount</th>
                    <th style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Date</th>
                    <th style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: 'center', padding: '8px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((transaction) => (
                    <RecentTransactionRow 
                      key={transaction.id}
                      transaction={transaction}
                      customer={customers.find(c => c.id === transaction.customer_id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {stats.recentTransactions.length > 0 && (
            <div style={{ 
              marginTop: 16, 
              paddingTop: 12, 
              borderTop: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                Showing {Math.min(10, stats.recentTransactions.length)} of {stats.totalOrders} orders
              </span>
            </div>
          )}
        </div>

        {/* Low Stock Alerts & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Low Stock Alerts */}
          <div style={S.card}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <h6 style={{ color: '#fff', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} color="#e74a3b" /> 
                Low Stock Alerts
              </h6>
              {stats.lowStockProducts.length > 0 && (
                <span style={{ 
                  background: 'rgba(231,74,59,0.2)', 
                  color: '#e74a3b', 
                  padding: '2px 8px', 
                  borderRadius: 20, 
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {stats.lowStockProducts.length} product{stats.lowStockProducts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {stats.lowStockProducts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '30px 20px', 
                color: 'rgba(255,255,255,0.3)' 
              }}>
                <CheckCircle size={32} style={{ marginBottom: 12, opacity: 0.5, color: '#1cc88a' }} />
                <p style={{ fontSize: 13 }}>All products are well-stocked!</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Great inventory management 👍</p>
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {stats.lowStockProducts.map((product) => (
                  <LowStockProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Summary */}
          <div style={S.card}>
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#1cc88a" /> 
              Performance Summary
            </h6>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Profit Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Profit Margin</span>
                  <span style={{ color: '#1cc88a', fontSize: 12, fontWeight: 600 }}>
                    {stats.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(100, stats.profitMargin)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #1cc88a, #4e73df)',
                    borderRadius: 3,
                  }} />
                </div>
              </div>
              
              {/* Stats Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 12,
                marginTop: 8,
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Total Orders</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{stats.totalOrders}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Items Sold</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{stats.totalItemsSold}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Paid Orders</div>
                  <div style={{ color: '#1cc88a', fontSize: 20, fontWeight: 700 }}>{stats.paidCount}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Pending</div>
                  <div style={{ color: '#f6c23e', fontSize: 20, fontWeight: 700 }}>{stats.pendingPayments}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
