import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Search, Filter, RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  inventory_quantity: number;
  track_inventory: boolean;
  continue_selling_when_out_of_stock: boolean;
  status: string;
  categories: { name: string } | null;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
  price: number;
}

interface InventoryUpdate {
  id: string;
  store_id: string;
  merchant_id: string;
  update_type: string;
  current_data: {
    product_id: string;
    inventory_quantity: number;
  };
  proposed_data: {
    product_id: string;
    inventory_quantity: number;
  };
  status: string;
  priority: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const MerchantInventory = () => {
  const { userStore, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<InventoryUpdate[]>([]);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    if (userStore) {
      fetchProducts();
      fetchPendingUpdates();
      setupRealtimeSubscription();
    }
  }, [userStore]);

  const setupRealtimeSubscription = () => {
    if (!userStore) return;

    // Subscribe to product updates
    const productsChannel = (supabase as any)
      .channel('products_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${userStore.id}`
        },
        (payload: any) => {
          // Refresh products when changes occur
          fetchProducts();
          setLastSync(new Date());
          
          if (payload.eventType === 'UPDATE') {
            toast.success('Product inventory updated');
          }
        }
      )
      .subscribe();

    // Subscribe to inventory update requests
    const updatesChannel = (supabase as any)
      .channel('inventory_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_store_updates',
          filter: `store_id=eq.${userStore.id} AND update_type=eq.inventory`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            toast.info('Inventory update request submitted');
          } else if (payload.eventType === 'UPDATE' && payload.new.status === 'approved') {
            toast.success('Inventory update approved');
            fetchProducts();
          } else if (payload.eventType === 'UPDATE' && payload.new.status === 'rejected') {
            toast.error('Inventory update rejected');
          }
          fetchPendingUpdates();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(productsChannel);
      (supabase as any).removeChannel(updatesChannel);
    };
  };

  const fetchProducts = async () => {
    if (!userStore) return;

    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .select(`
          *,
          categories(name),
          product_images(image_url, is_primary)
        `)
        .eq('store_id', userStore.id)
        .eq('track_inventory', true)
        .order('inventory_quantity', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUpdates = async () => {
    if (!userStore) return;

    try {
      const { data, error } = await (supabase as any)
        .from('merchant_store_updates')
        .select('*')
        .eq('store_id', userStore.id)
        .eq('update_type', 'inventory')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUpdates(data || []);
    } catch (error) {
      console.error('Error fetching pending updates:', error);
    }
  };

  const updateInventory = async (productId: string, newQuantity: number) => {
    if (!userStore || !user) return;

    setUpdating(productId);
    try {
      // Get current product data
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Submit update for admin approval
      const { error } = await (supabase as any)
        .from('merchant_store_updates')
        .insert({
          store_id: userStore.id,
          merchant_id: user.id,
          update_type: 'inventory',
          current_data: { 
            product_id: productId,
            inventory_quantity: product.inventory_quantity 
          },
          proposed_data: { 
            product_id: productId,
            inventory_quantity: newQuantity 
          },
          status: 'pending',
          priority: newQuantity === 0 ? 'high' : 'normal',
        });

      if (error) throw error;

      // Create notification for admin
      await (supabase as any).from('notifications').insert({
        user_id: null, // Will be filled by trigger for all admins
        title: `Inventory Update Request - ${product.name}`,
        message: `Inventory update request from ${userStore.name}: ${product.inventory_quantity} → ${newQuantity}`,
        type: 'inventory_update',
        related_id: productId
      });

      toast.success('Inventory update submitted for approval');
      fetchPendingUpdates();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to submit inventory update');
    } finally {
      setUpdating(null);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'destructive' };
    if (quantity <= 5) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'default' };
  };

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterStatus || product.status === filterStatus)
    );

  const lowStockProducts = products.filter(p => p.inventory_quantity <= 5);
  const outOfStockProducts = products.filter(p => p.inventory_quantity === 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {outOfStockProducts.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">
              {outOfStockProducts.length} products out of stock
            </p>
            <p className="text-sm text-red-700">
              Update inventory or mark as discontinued
            </p>
          </div>
        </div>
      )}

      {lowStockProducts.length > 0 && outOfStockProducts.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-900">
              {lowStockProducts.length} products low on stock
            </p>
            <p className="text-sm text-yellow-700">
              Consider restocking soon
            </p>
          </div>
        </div>
      )}

      {/* Pending Updates */}
      {pendingUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Inventory Updates</CardTitle>
            <CardDescription>
              Updates awaiting admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingUpdates.map((update) => {
                const product = products.find(p => p.id === update.current_data.product_id);
                return (
                  <div key={update.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {update.current_data.inventory_quantity} → {update.proposed_data.inventory_quantity}
                      </p>
                      {update.admin_notes && (
                        <p className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded">
                          <span className="font-medium">Admin Notes:</span> {update.admin_notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4">
              <select
                className="border rounded-md px-3 py-2"
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value || null)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProducts}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Sync
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Last synced: {lastSync.toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Update product quantities and track stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.inventory_quantity);
                const pendingUpdate = pendingUpdates.find(
                  u => u.current_data.product_id === product.id
                );

                return (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                        {product.product_images?.find(img => img.is_primary)?.image_url ? (
                          <img
                            src={product.product_images.find(img => img.is_primary)?.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover rounded-md"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-600">
                          {product.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant={stockStatus.color as any}>
                        {stockStatus.label}
                      </Badge>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Current: {product.inventory_quantity}</span>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={product.inventory_quantity}
                          className="w-20"
                          onBlur={(e) => {
                            const newValue = parseInt(e.target.value);
                            if (newValue !== product.inventory_quantity && !isNaN(newValue)) {
                              updateInventory(product.id, newValue);
                            }
                          }}
                          disabled={updating === product.id || pendingUpdate !== undefined}
                        />
                        
                        {updating === product.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-beauty-purple"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 