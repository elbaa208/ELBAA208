import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  BarChart3
} from 'lucide-react';
import { productService, inventoryService } from '../services/firebaseService';

const InventoryManagement = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add',
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, filterType, products]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const result = await productService.getProducts();
      if (result.success && result.data) {
        const productsArray = Object.values(result.data);
        setProducts(productsArray);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    switch (filterType) {
      case 'low-stock':
        filtered = filtered.filter(p => p.stock <= (p.minStock || 0));
        break;
      case 'out-of-stock':
        filtered = filtered.filter(p => p.stock === 0);
        break;
      case 'in-stock':
        filtered = filtered.filter(p => p.stock > 0);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    setFilteredProducts(filtered);
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !adjustmentData.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const quantity = parseInt(adjustmentData.quantity);
      const operation = adjustmentData.type === 'add' ? 'add' : 'subtract';
      
      const result = await inventoryService.updateStock(selectedProduct.id, quantity, operation);
      
      if (result.success) {
        // Log the adjustment
        const adjustmentLog = {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          type: adjustmentData.type,
          quantity: quantity,
          reason: adjustmentData.reason,
          notes: adjustmentData.notes,
          userId: user.uid,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        };
        
        await dbService.create('inventory-adjustments', adjustmentLog);
        
        alert('Stock adjusted successfully!');
        resetAdjustmentForm();
        loadInventory();
      } else {
        alert('Error adjusting stock: ' + result.error);
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock: ' + error.message);
    }
  };

  const resetAdjustmentForm = () => {
    setAdjustmentData({
      type: 'add',
      quantity: '',
      reason: '',
      notes: ''
    });
    setSelectedProduct(null);
    setShowAdjustForm(false);
  };

  const openAdjustmentForm = (product) => {
    setSelectedProduct(product);
    setShowAdjustForm(true);
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) {
      return { status: 'Out of Stock', color: 'destructive' };
    } else if (product.stock <= (product.minStock || 0)) {
      return { status: 'Low Stock', color: 'default' };
    } else {
      return { status: 'In Stock', color: 'secondary' };
    }
  };

  const getInventoryStats = () => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const lowStock = products.filter(p => p.stock <= (p.minStock || 0) && p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    return { totalProducts, inStock, lowStock, outOfStock, totalValue };
  };

  const exportInventory = () => {
    const csvContent = [
      ['Product Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Price', 'Total Value', 'Status'].join(','),
      ...filteredProducts.map(p => {
        const status = getStockStatus(p);
        return [
          p.name,
          p.sku,
          p.category,
          p.stock,
          p.minStock || 0,
          p.price,
          p.price * p.stock,
          status.status
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = getInventoryStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventory}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadInventory}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalValue.toLocaleString()} DA
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
          <TabsTrigger value="adjustments">Stock Adjustments</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Products</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory ({filteredProducts.length})</CardTitle>
              <CardDescription>Current stock levels and product information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Current Stock</th>
                      <th className="text-left p-2">Min Stock</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const status = getStockStatus(product);
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-600">{product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 font-mono text-sm">{product.sku}</td>
                          <td className="p-2">
                            <Badge variant="secondary">{product.category}</Badge>
                          </td>
                          <td className="p-2">
                            <span className="font-bold text-lg">{product.stock}</span>
                          </td>
                          <td className="p-2">{product.minStock || 0}</td>
                          <td className="p-2">
                            <Badge variant={status.color}>{status.status}</Badge>
                          </td>
                          <td className="p-2 font-medium">
                            {(product.price * product.stock).toLocaleString()} DA
                          </td>
                          <td className="p-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openAdjustmentForm(product)}
                            >
                              Adjust
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Adjustments</CardTitle>
              <CardDescription>Add or remove stock with proper tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Stock adjustments are tracked automatically when you use the "Adjust" button in the inventory table.
                All adjustments are logged with timestamps and reasons for audit purposes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Stock Alerts
              </CardTitle>
              <CardDescription>Products that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Out of Stock */}
                {products.filter(p => p.stock === 0).length > 0 && (
                  <div>
                    <h3 className="font-medium text-red-600 mb-2">Out of Stock ({products.filter(p => p.stock === 0).length})</h3>
                    <div className="space-y-2">
                      {products.filter(p => p.stock === 0).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => openAdjustmentForm(product)}
                          >
                            Restock
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Low Stock */}
                {products.filter(p => p.stock <= (p.minStock || 0) && p.stock > 0).length > 0 && (
                  <div>
                    <h3 className="font-medium text-yellow-600 mb-2">Low Stock ({products.filter(p => p.stock <= (p.minStock || 0) && p.stock > 0).length})</h3>
                    <div className="space-y-2">
                      {products.filter(p => p.stock <= (p.minStock || 0) && p.stock > 0).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              SKU: {product.sku} | Current: {product.stock} | Min: {product.minStock || 0}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openAdjustmentForm(product)}
                          >
                            Restock
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {products.filter(p => p.stock === 0 || (p.stock <= (p.minStock || 0) && p.stock > 0)).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No stock alerts at this time</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Modal */}
      {showAdjustForm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Adjust Stock</CardTitle>
              <CardDescription>
                {selectedProduct.name} (Current: {selectedProduct.stock})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={adjustmentData.type}
                    onChange={(e) => setAdjustmentData({...adjustmentData, type: e.target.value})}
                  >
                    <option value="add">Add Stock</option>
                    <option value="subtract">Remove Stock</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={adjustmentData.quantity}
                    onChange={(e) => setAdjustmentData({...adjustmentData, quantity: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <select
                    id="reason"
                    className="w-full p-2 border rounded-md"
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="restock">Restock</option>
                    <option value="damaged">Damaged goods</option>
                    <option value="expired">Expired products</option>
                    <option value="theft">Theft/Loss</option>
                    <option value="return">Customer return</option>
                    <option value="correction">Inventory correction</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full p-2 border rounded-md"
                    rows="3"
                    value={adjustmentData.notes}
                    onChange={(e) => setAdjustmentData({...adjustmentData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetAdjustmentForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {adjustmentData.type === 'add' ? <Plus className="w-4 h-4 mr-2" /> : <Minus className="w-4 h-4 mr-2" />}
                    Adjust Stock
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;

