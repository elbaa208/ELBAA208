import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Search, 
  Scan, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Receipt,
  User,
  Calculator
} from 'lucide-react';
import { productService, transactionService, customerService } from '../services/firebaseService';

const PointOfSale = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const productsResult = await productService.getProducts();
      if (productsResult.success && productsResult.data) {
        const productsArray = Object.values(productsResult.data);
        setProducts(productsArray);
        setFilteredProducts(productsArray);
      }
      
      // Load customers
      const customersResult = await customerService.getCustomers();
      if (customersResult.success && customersResult.data) {
        setCustomers(Object.values(customersResult.data));
      }
      
    } catch (error) {
      console.error('Error loading POS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    );
    setFilteredProducts(filtered);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Product is out of stock');
      return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Cannot add more items than available in stock');
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      alert('Cannot exceed available stock');
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.19; // 19% VAT
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const processPayment = async (paymentMethod) => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    
    setProcessing(true);
    
    try {
      const transactionData = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: getSubtotal(),
        tax: getTax(),
        total: getTotal(),
        paymentMethod,
        cashierId: user.uid,
        cashierName: user.email
      };
      
      const result = await transactionService.addTransaction(transactionData);
      
      if (result.success) {
        // Update inventory
        for (const item of cart) {
          await inventoryService.updateStock(item.id, item.quantity, 'subtract');
        }
        
        alert('Payment processed successfully!');
        clearCart();
        loadData(); // Refresh product data
      } else {
        alert('Payment failed: ' + result.error);
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = () => {
    const receiptContent = `
      STORE RECEIPT
      =============
      Date: ${new Date().toLocaleString()}
      Cashier: ${user.email}
      Customer: ${selectedCustomer?.name || 'Walk-in Customer'}
      
      ITEMS:
      ${cart.map(item => 
        `${item.name} x${item.quantity} @ ${item.price.toLocaleString()} DA = ${(item.price * item.quantity).toLocaleString()} DA`
      ).join('\n')}
      
      Subtotal: ${getSubtotal().toLocaleString()} DA
      Tax (19%): ${getTax().toLocaleString()} DA
      TOTAL: ${getTotal().toLocaleString()} DA
      
      Thank you for your business!
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre>${receiptContent}</pre>`);
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Point of Sale
            </CardTitle>
            <CardDescription>Select products to add to cart</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products by name, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Scan className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    product.stock <= 0 ? 'opacity-50' : ''
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">SKU: {product.sku}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-600">
                        {product.price.toLocaleString()} DA
                      </span>
                      <Badge variant={product.stock <= 10 ? 'destructive' : 'secondary'}>
                        {product.stock}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart and Payment Section */}
      <div className="space-y-4">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(customer || null);
              }}
            >
              <option value="">Walk-in Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </span>
              {cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Clear
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.price.toLocaleString()} DA each
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        {cart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{getSubtotal().toLocaleString()} DA</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (19%):</span>
                <span>{getTax().toLocaleString()} DA</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">{getTotal().toLocaleString()} DA</span>
              </div>
              
              {/* Payment Methods */}
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => processPayment('cash')}
                  disabled={processing}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Cash Payment
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => processPayment('card')}
                  disabled={processing}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card Payment
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => processPayment('mobile')}
                  disabled={processing}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile Payment
                </Button>
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={printReceipt}
                  disabled={cart.length === 0}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PointOfSale;

