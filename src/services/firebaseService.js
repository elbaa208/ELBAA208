import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off,
  query,
  orderByChild,
  equalTo,
  limitToLast
} from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { database, auth } from '../config/firebase';

// Authentication Services
export const authService = {
  // Sign in user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Create new user
  signUp: async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save additional user data to database
      await set(ref(database, `users/${user.uid}`), {
        ...userData,
        email: user.email,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};

// Database Services
export const dbService = {
  // Generic CRUD operations
  create: async (path, data) => {
    try {
      const newRef = push(ref(database, path));
      await set(newRef, {
        ...data,
        id: newRef.key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: newRef.key };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Read data
  read: async (path) => {
    try {
      const snapshot = await get(ref(database, path));
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update data
  update: async (path, data) => {
    try {
      await update(ref(database, path), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete data
  delete: async (path) => {
    try {
      await remove(ref(database, path));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Listen to data changes
  listen: (path, callback) => {
    const dataRef = ref(database, path);
    onValue(dataRef, callback);
    return () => off(dataRef, 'value', callback);
  },

  // Query data
  query: async (path, orderBy, equalToValue, limit) => {
    try {
      let queryRef = ref(database, path);
      
      if (orderBy) {
        queryRef = query(queryRef, orderByChild(orderBy));
      }
      
      if (equalToValue !== undefined) {
        queryRef = query(queryRef, equalTo(equalToValue));
      }
      
      if (limit) {
        queryRef = query(queryRef, limitToLast(limit));
      }
      
      const snapshot = await get(queryRef);
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: true, data: {} };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Product Services
export const productService = {
  // Add new product
  addProduct: async (productData) => {
    return await dbService.create('products', productData);
  },

  // Get all products
  getProducts: async () => {
    return await dbService.read('products');
  },

  // Get product by ID
  getProduct: async (id) => {
    return await dbService.read(`products/${id}`);
  },

  // Update product
  updateProduct: async (id, productData) => {
    return await dbService.update(`products/${id}`, productData);
  },

  // Delete product
  deleteProduct: async (id) => {
    return await dbService.delete(`products/${id}`);
  },

  // Listen to products changes
  listenToProducts: (callback) => {
    return dbService.listen('products', callback);
  },

  // Search products
  searchProducts: async (searchTerm) => {
    const result = await dbService.read('products');
    if (result.success && result.data) {
      const products = Object.values(result.data).filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { success: true, data: products };
    }
    return result;
  }
};

// Customer Services
export const customerService = {
  // Add new customer
  addCustomer: async (customerData) => {
    return await dbService.create('customers', customerData);
  },

  // Get all customers
  getCustomers: async () => {
    return await dbService.read('customers');
  },

  // Get customer by ID
  getCustomer: async (id) => {
    return await dbService.read(`customers/${id}`);
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    return await dbService.update(`customers/${id}`, customerData);
  },

  // Delete customer
  deleteCustomer: async (id) => {
    return await dbService.delete(`customers/${id}`);
  },

  // Listen to customers changes
  listenToCustomers: (callback) => {
    return dbService.listen('customers', callback);
  }
};

// Transaction Services
export const transactionService = {
  // Add new transaction
  addTransaction: async (transactionData) => {
    return await dbService.create('transactions', transactionData);
  },

  // Get all transactions
  getTransactions: async () => {
    return await dbService.read('transactions');
  },

  // Get transaction by ID
  getTransaction: async (id) => {
    return await dbService.read(`transactions/${id}`);
  },

  // Get transactions by date range
  getTransactionsByDateRange: async (startDate, endDate) => {
    const result = await dbService.read('transactions');
    if (result.success && result.data) {
      const transactions = Object.values(result.data).filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
      });
      return { success: true, data: transactions };
    }
    return result;
  },

  // Listen to transactions changes
  listenToTransactions: (callback) => {
    return dbService.listen('transactions', callback);
  }
};

// Inventory Services
export const inventoryService = {
  // Update stock level
  updateStock: async (productId, quantity, operation = 'set') => {
    try {
      const productResult = await productService.getProduct(productId);
      if (productResult.success && productResult.data) {
        let newStock;
        const currentStock = productResult.data.stock || 0;
        
        switch (operation) {
          case 'add':
            newStock = currentStock + quantity;
            break;
          case 'subtract':
            newStock = Math.max(0, currentStock - quantity);
            break;
          default:
            newStock = quantity;
        }
        
        return await productService.updateProduct(productId, { stock: newStock });
      }
      return { success: false, error: 'Product not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get low stock products
  getLowStockProducts: async (threshold = 10) => {
    const result = await productService.getProducts();
    if (result.success && result.data) {
      const lowStockProducts = Object.values(result.data).filter(product =>
        (product.stock || 0) <= threshold
      );
      return { success: true, data: lowStockProducts };
    }
    return result;
  }
};

// Analytics Services
export const analyticsService = {
  // Get sales summary
  getSalesSummary: async (startDate, endDate) => {
    const result = await transactionService.getTransactionsByDateRange(startDate, endDate);
    if (result.success && result.data) {
      const transactions = result.data;
      const summary = {
        totalSales: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
        totalTransactions: transactions.length,
        averageTransaction: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + (t.total || 0), 0) / transactions.length : 0,
        topProducts: this.getTopProducts(transactions)
      };
      return { success: true, data: summary };
    }
    return result;
  },

  // Get top selling products
  getTopProducts: (transactions) => {
    const productSales = {};
    transactions.forEach(transaction => {
      if (transaction.items) {
        transaction.items.forEach(item => {
          if (productSales[item.productId]) {
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.total;
          } else {
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              revenue: item.total
            };
          }
        });
      }
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }
};

