import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  FileText
} from 'lucide-react';
import { analyticsService, transactionService, productService, customerService } from '../services/firebaseService';

const Reports = ({ user }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [salesData, setSalesData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Load sales analytics
      const salesResult = await analyticsService.getSalesSummary(dateRange.startDate, dateRange.endDate);
      if (salesResult.success) {
        setSalesData(salesResult.data);
      }
      
      // Load product data
      const productsResult = await productService.getProducts();
      if (productsResult.success && productsResult.data) {
        const products = Object.values(productsResult.data);
        setProductData({
          totalProducts: products.length,
          lowStockProducts: products.filter(p => p.stock <= (p.minStock || 0)).length,
          outOfStockProducts: products.filter(p => p.stock === 0).length,
          totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
          categories: [...new Set(products.map(p => p.category).filter(Boolean))].length
        });
      }
      
      // Load customer data
      const customersResult = await customerService.getCustomers();
      if (customersResult.success && customersResult.data) {
        const customers = Object.values(customersResult.data);
        const thisMonth = new Date();
        const newCustomers = customers.filter(c => {
          const created = new Date(c.createdAt);
          return created.getMonth() === thisMonth.getMonth() && 
                 created.getFullYear() === thisMonth.getFullYear();
        });
        
        setCustomerData({
          totalCustomers: customers.length,
          newCustomers: newCustomers.length,
          activeCustomers: customers.filter(c => c.totalPurchases > 0).length,
          totalLoyaltyPoints: customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)
        });
      }
      
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (reportType) => {
    let csvContent = '';
    let filename = '';
    
    switch (reportType) {
      case 'sales':
        csvContent = [
          ['Metric', 'Value'].join(','),
          ['Total Sales', salesData?.totalSales || 0],
          ['Total Transactions', salesData?.totalTransactions || 0],
          ['Average Transaction', salesData?.averageTransaction || 0],
          ['Date Range', `${dateRange.startDate} to ${dateRange.endDate}`]
        ].join('\n');
        filename = 'sales-report.csv';
        break;
        
      case 'products':
        csvContent = [
          ['Metric', 'Value'].join(','),
          ['Total Products', productData?.totalProducts || 0],
          ['Low Stock Products', productData?.lowStockProducts || 0],
          ['Out of Stock Products', productData?.outOfStockProducts || 0],
          ['Total Inventory Value', productData?.totalValue || 0],
          ['Categories', productData?.categories || 0]
        ].join('\n');
        filename = 'products-report.csv';
        break;
        
      case 'customers':
        csvContent = [
          ['Metric', 'Value'].join(','),
          ['Total Customers', customerData?.totalCustomers || 0],
          ['New Customers This Month', customerData?.newCustomers || 0],
          ['Active Customers', customerData?.activeCustomers || 0],
          ['Total Loyalty Points', customerData?.totalLoyaltyPoints || 0]
        ].join('\n');
        filename = 'customers-report.csv';
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <Button onClick={loadReportData}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="products">Product Report</TabsTrigger>
          <TabsTrigger value="customers">Customer Report</TabsTrigger>
          <TabsTrigger value="financial">Financial Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {salesData?.totalSales?.toLocaleString() || 0} DA
                </div>
                <p className="text-xs text-muted-foreground">
                  {salesData?.totalTransactions || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {productData?.totalProducts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {productData?.lowStockProducts || 0} low stock
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {customerData?.totalCustomers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customerData?.newCustomers || 0} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {productData?.totalValue?.toLocaleString() || 0} DA
                </div>
                <p className="text-xs text-muted-foreground">
                  Total stock value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesData?.topProducts?.length > 0 ? (
                  <div className="space-y-3">
                    {salesData.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.productId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{product.productName}</p>
                          <p className="text-xs text-gray-600">Qty: {product.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{product.revenue.toLocaleString()} DA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No sales data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Stock Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Stock</span>
                    <span className="font-bold text-green-600">
                      {(productData?.totalProducts || 0) - (productData?.outOfStockProducts || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Stock</span>
                    <span className="font-bold text-yellow-600">
                      {productData?.lowStockProducts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Out of Stock</span>
                    <span className="font-bold text-red-600">
                      {productData?.outOfStockProducts || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Transaction</span>
                    <span className="font-bold">
                      {salesData?.averageTransaction?.toLocaleString() || 0} DA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Customers</span>
                    <span className="font-bold">
                      {customerData?.activeCustomers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Categories</span>
                    <span className="font-bold">
                      {productData?.categories || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Sales Report</h2>
            <Button onClick={() => exportReport('sales')}>
              <Download className="w-4 h-4 mr-2" />
              Export Sales Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {salesData?.totalSales?.toLocaleString() || 0} DA
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Period: {dateRange.startDate} to {dateRange.endDate}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {salesData?.totalTransactions || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Number of sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {salesData?.averageTransaction?.toLocaleString() || 0} DA
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Per transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {salesData?.totalSales && salesData?.totalTransactions ? 
                    Math.round((salesData.totalSales / Math.max(1, Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24))))).toLocaleString() 
                    : 0} DA
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Revenue per day
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {salesData?.topProducts?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Quantity Sold</th>
                        <th className="text-left p-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.topProducts.map((product, index) => (
                        <tr key={product.productId} className="border-b">
                          <td className="p-2">#{index + 1}</td>
                          <td className="p-2 font-medium">{product.productName}</td>
                          <td className="p-2">{product.quantity}</td>
                          <td className="p-2 font-bold text-green-600">
                            {product.revenue.toLocaleString()} DA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No sales data available for this period</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Product Report</h2>
            <Button onClick={() => exportReport('products')}>
              <Download className="w-4 h-4 mr-2" />
              Export Product Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {productData?.totalProducts || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Active products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {productData?.totalValue?.toLocaleString() || 0} DA
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Total stock value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {productData?.lowStockProducts || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Need restocking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {productData?.outOfStockProducts || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Unavailable items
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Customer Report</h2>
            <Button onClick={() => exportReport('customers')}>
              <Download className="w-4 h-4 mr-2" />
              Export Customer Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {customerData?.totalCustomers || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Registered customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {customerData?.newCustomers || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  New registrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {customerData?.activeCustomers || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  With purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loyalty Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {customerData?.totalLoyaltyPoints?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Total points issued
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Financial Report</h2>
            <Button onClick={() => exportReport('financial')}>
              <Download className="w-4 h-4 mr-2" />
              Export Financial Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Financial performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-green-600">
                      {salesData?.totalSales?.toLocaleString() || 0} DA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Transactions:</span>
                    <span className="font-bold">
                      {salesData?.totalTransactions || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Transaction:</span>
                    <span className="font-bold">
                      {salesData?.averageTransaction?.toLocaleString() || 0} DA
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Summary</CardTitle>
                <CardDescription>Current asset valuation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Inventory Value:</span>
                    <span className="font-bold text-blue-600">
                      {productData?.totalValue?.toLocaleString() || 0} DA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Products:</span>
                    <span className="font-bold">
                      {productData?.totalProducts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Product Categories:</span>
                    <span className="font-bold">
                      {productData?.categories || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

