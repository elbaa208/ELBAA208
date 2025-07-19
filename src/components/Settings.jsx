import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Bell, 
  Shield, 
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react';
import { authService, dbService } from '../services/firebaseService';

const Settings = ({ user }) => {
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'My Store',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    currency: 'DA',
    taxRate: 19,
    receiptFooter: 'Thank you for your business!',
    lowStockThreshold: 10
  });
  
  const [userSettings, setUserSettings] = useState({
    displayName: user?.email || '',
    email: user?.email || '',
    phone: '',
    language: 'en',
    notifications: true,
    emailNotifications: true
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load store settings
      const storeResult = await dbService.read('settings/store');
      if (storeResult.success && storeResult.data) {
        setStoreSettings({ ...storeSettings, ...storeResult.data });
      }
      
      // Load user settings
      const userResult = await dbService.read(`settings/users/${user.uid}`);
      if (userResult.success && userResult.data) {
        setUserSettings({ ...userSettings, ...userResult.data });
      }
      
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveStoreSettings = async () => {
    try {
      setLoading(true);
      const result = await dbService.update('settings/store', storeSettings);
      if (result.success) {
        alert('Store settings saved successfully!');
      } else {
        alert('Error saving settings: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving store settings:', error);
      alert('Error saving settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveUserSettings = async () => {
    try {
      setLoading(true);
      const result = await dbService.update(`settings/users/${user.uid}`, userSettings);
      if (result.success) {
        alert('User settings saved successfully!');
      } else {
        alert('Error saving settings: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      alert('Error saving settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setLoading(true);
      
      // Export all data
      const [products, customers, transactions] = await Promise.all([
        dbService.read('products'),
        dbService.read('customers'),
        dbService.read('transactions')
      ]);
      
      const exportData = {
        products: products.data || {},
        customers: customers.data || {},
        transactions: transactions.data || {},
        settings: {
          store: storeSettings,
          user: userSettings
        },
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (window.confirm('This will overwrite existing data. Are you sure?')) {
        // Import data
        if (data.products) {
          await dbService.update('products', data.products);
        }
        if (data.customers) {
          await dbService.update('customers', data.customers);
        }
        if (data.transactions) {
          await dbService.update('transactions', data.transactions);
        }
        if (data.settings?.store) {
          await dbService.update('settings/store', data.settings.store);
          setStoreSettings({ ...storeSettings, ...data.settings.store });
        }
        
        alert('Data imported successfully!');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data: ' + error.message);
    } finally {
      setLoading(false);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const clearAllData = async () => {
    if (window.confirm('This will delete ALL data permanently. Are you absolutely sure?')) {
      if (window.confirm('This action cannot be undone. Type "DELETE" to confirm:') && 
          window.prompt('Type DELETE to confirm:') === 'DELETE') {
        try {
          setLoading(true);
          await Promise.all([
            dbService.delete('products'),
            dbService.delete('customers'),
            dbService.delete('transactions')
          ]);
          alert('All data cleared successfully!');
        } catch (error) {
          console.error('Error clearing data:', error);
          alert('Error clearing data: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your store and account preferences</p>
        </div>
        <Button onClick={loadSettings} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-4">
        <TabsList>
          <TabsTrigger value="store">Store Settings</TabsTrigger>
          <TabsTrigger value="user">User Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Information
              </CardTitle>
              <CardDescription>Configure your store details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings({...storeSettings, storeName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Store Phone</Label>
                  <Input
                    id="storePhone"
                    value={storeSettings.storePhone}
                    onChange={(e) => setStoreSettings({...storeSettings, storePhone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Store Email</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={storeSettings.storeEmail}
                    onChange={(e) => setStoreSettings({...storeSettings, storeEmail: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="w-full p-2 border rounded-md"
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings({...storeSettings, currency: e.target.value})}
                  >
                    <option value="DA">Algerian Dinar (DA)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={storeSettings.taxRate}
                    onChange={(e) => setStoreSettings({...storeSettings, taxRate: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={storeSettings.lowStockThreshold}
                    onChange={(e) => setStoreSettings({...storeSettings, lowStockThreshold: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Store Address</Label>
                <textarea
                  id="storeAddress"
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  value={storeSettings.storeAddress}
                  onChange={(e) => setStoreSettings({...storeSettings, storeAddress: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
                <textarea
                  id="receiptFooter"
                  className="w-full p-2 border rounded-md"
                  rows="2"
                  value={storeSettings.receiptFooter}
                  onChange={(e) => setStoreSettings({...storeSettings, receiptFooter: e.target.value})}
                />
              </div>
              
              <Button onClick={saveStoreSettings} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Store Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Profile
              </CardTitle>
              <CardDescription>Manage your personal account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={userSettings.displayName}
                    onChange={(e) => setUserSettings({...userSettings, displayName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={userSettings.phone}
                    onChange={(e) => setUserSettings({...userSettings, phone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    className="w-full p-2 border rounded-md"
                    value={userSettings.language}
                    onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
              
              <Button onClick={saveUserSettings} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications in the app</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings.notifications}
                    onChange={(e) => setUserSettings({...userSettings, notifications: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings.emailNotifications}
                    onChange={(e) => setUserSettings({...userSettings, emailNotifications: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
              </div>
              
              <Button onClick={saveUserSettings} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Change Password</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    For security reasons, password changes are handled through Firebase Authentication.
                  </p>
                  <Button variant="outline">
                    Reset Password via Email
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>User ID:</span>
                      <span className="font-mono">{user?.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Created:</span>
                      <span>{user?.metadata?.creationTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sign In:</span>
                      <span>{user?.metadata?.lastSignInTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>Backup, restore, and manage your store data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Backup Data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Export all your store data including products, customers, and transactions.
                </p>
                <Button onClick={exportData} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Restore Data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Import data from a previous backup. This will overwrite existing data.
                </p>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('import-file').click()}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete all store data. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={clearAllData}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

