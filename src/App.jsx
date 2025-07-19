import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Settings as SettingsIcon, 
  BarChart3,
  Menu,
  X,
  Home,
  LogOut,
  Calculator,
  Warehouse,
  Truck
} from 'lucide-react'
import './App.css'

// Import components
import LoginPage from './components/LoginPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import PointOfSale from './components/PointOfSale.jsx'
import ProductManagement from './components/ProductManagement.jsx'
import CustomerManagement from './components/CustomerManagement.jsx'
import Reports from './components/Reports.jsx'
import Settings from './components/Settings.jsx'
import InventoryManagement from './components/InventoryManagement.jsx'
import SupplierManagement from './components/SupplierManagement.jsx'

// Login Component
function LoginForm({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simple demo login - in real app, this would validate against Firebase Auth
    if (credentials.username && credentials.password) {
      onLogin({ 
        username: credentials.username, 
        role: 'admin',
        uid: 'demo-user-' + Date.now(),
        email: credentials.username + '@store.com'
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">Store Management System</CardTitle>
          <CardDescription>نظام إدارة المحلات التجارية</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username / اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password / كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login / تسجيل الدخول
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>Username: admin | Password: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main App Component
function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check for saved user session
  useEffect(() => {
    const savedUser = localStorage.getItem('storeUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('storeUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('storeUser')
    setCurrentPage('dashboard')
  }

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'pos', name: 'Point of Sale', icon: Calculator },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'inventory', name: 'Inventory', icon: Warehouse },
    { id: 'suppliers', name: 'Suppliers', icon: Truck },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: SettingsIcon }
  ]

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'pos':
        return <PointOfSale user={user} />
      case 'products':
        return <ProductManagement user={user} />
      case 'customers':
        return <CustomerManagement user={user} />
      case 'inventory':
        return <InventoryManagement user={user} />
      case 'suppliers':
        return <SupplierManagement user={user} />
      case 'reports':
        return <Reports user={user} />
      case 'settings':
        return <Settings user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-blue-900">Store Manager</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="mt-6">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
                currentPage === item.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.username}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{user.role}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default App

