import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Store, Clock, Calendar, Tag, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface BusinessHours {
  monday: { open: string; close: string; isOpen: boolean };
  tuesday: { open: string; close: string; isOpen: boolean };
  wednesday: { open: string; close: string; isOpen: boolean };
  thursday: { open: string; close: string; isOpen: boolean };
  friday: { open: string; close: string; isOpen: boolean };
  saturday: { open: string; close: string; isOpen: boolean };
  sunday: { open: string; close: string; isOpen: boolean };
}

interface StoreFormData {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  businessHours: BusinessHours;
  promotions: Array<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
  }>;
}

interface StoreUpdate {
  id: string;
  store_id: string;
  merchant_id: string;
  update_type: string;
  current_data: any;
  proposed_data: any;
  status: string;
  priority: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const MerchantStoreSettings = () => {
  const { userStore, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    businessHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '09:00', close: '17:00', isOpen: false }
    },
    promotions: []
  });
  const [pendingUpdates, setPendingUpdates] = useState<StoreUpdate[]>([]);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    discountType: 'percentage' as const,
    discountValue: 0,
    isActive: true
  });

  useEffect(() => {
    if (userStore) {
      fetchStoreData();
      fetchPendingUpdates();
      setupRealtimeSubscription();
    }
  }, [userStore]);

  const setupRealtimeSubscription = () => {
    if (!userStore) return;

    // Subscribe to store updates
    const storeChannel = (supabase as any)
      .channel('store_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_store_updates',
          filter: `store_id=eq.${userStore.id}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            toast.info('Store update request submitted');
          } else if (payload.eventType === 'UPDATE' && payload.new.status === 'approved') {
            toast.success('Store update approved');
            fetchStoreData();
          } else if (payload.eventType === 'UPDATE' && payload.new.status === 'rejected') {
            toast.error('Store update rejected');
          }
          fetchPendingUpdates();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(storeChannel);
    };
  };

  const fetchStoreData = async () => {
    if (!userStore) return;

    try {
      const { data, error } = await (supabase as any)
        .from('stores')
        .select('*')
        .eq('id', userStore.id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        businessHours: data.business_hours || {
          monday: { open: '09:00', close: '17:00', isOpen: true },
          tuesday: { open: '09:00', close: '17:00', isOpen: true },
          wednesday: { open: '09:00', close: '17:00', isOpen: true },
          thursday: { open: '09:00', close: '17:00', isOpen: true },
          friday: { open: '09:00', close: '17:00', isOpen: true },
          saturday: { open: '09:00', close: '17:00', isOpen: true },
          sunday: { open: '09:00', close: '17:00', isOpen: false }
        },
        promotions: data.promotions || []
      });
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error('Failed to fetch store data');
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUpdates(data || []);
    } catch (error) {
      console.error('Error fetching pending updates:', error);
    }
  };

  const handleSubmit = async (updateType: string, data: any) => {
    if (!userStore || !user) return;

    setSaving(true);
    try {
      // Get current store data for comparison
      const { data: currentData, error: fetchError } = await (supabase as any)
        .from('stores')
        .select('*')
        .eq('id', userStore.id)
        .single();

      if (fetchError) throw fetchError;

      // Submit update for admin approval
      const { error } = await (supabase as any)
        .from('merchant_store_updates')
        .insert({
          store_id: userStore.id,
          merchant_id: user.id,
          update_type: updateType,
          current_data: currentData,
          proposed_data: data,
          status: 'pending',
          priority: 'normal'
        });

      if (error) throw error;

      // Create notification for admin
      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: null, // Will be filled by trigger for all admins
          title: `Store Update Request - ${userStore.name}`,
          message: `Store update request from ${userStore.name}: ${updateType}`,
          type: 'store_update',
          related_id: userStore.id
        });

      toast.success('Update submitted for approval');
      fetchPendingUpdates();
    } catch (error) {
      console.error('Error submitting update:', error);
      toast.error('Failed to submit update');
    } finally {
      setSaving(false);
    }
  };

  const handlePromotionSubmit = () => {
    const updatedPromotions = [...formData.promotions, newPromotion];
    handleSubmit('promotions', { ...formData, promotions: updatedPromotions });
    setShowPromotionDialog(false);
    setNewPromotion({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      discountType: 'percentage',
      discountValue: 0,
      isActive: true
    });
  };

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
      {/* Pending Updates */}
      {pendingUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Updates</CardTitle>
            <CardDescription>
              Updates awaiting admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUpdates.map((update) => (
                <div key={update.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{update.update_type} Update</p>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(update.created_at).toLocaleDateString()}
                    </p>
                    {update.admin_notes && (
                      <p className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded">
                        <span className="font-medium">Admin Notes:</span> {update.admin_notes}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">Pending Review</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Settings */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="hours">Business Hours</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your store's basic details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Address</Label>
                  <Input
                    placeholder="Street Address"
                    value={formData.address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="City"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="State"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="ZIP Code"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSubmit('basic', formData)}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your store's operating hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(formData.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-24">
                      <Label className="capitalize">{day}</Label>
                    </div>
                    <Switch
                      checked={hours.isOpen}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        businessHours: {
                          ...formData.businessHours,
                          [day]: { ...hours, isOpen: checked }
                        }
                      })}
                    />
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Open</Label>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setFormData({
                            ...formData,
                            businessHours: {
                              ...formData.businessHours,
                              [day]: { ...hours, open: e.target.value }
                            }
                          })}
                          disabled={!hours.isOpen}
                        />
                      </div>
                      <div>
                        <Label>Close</Label>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setFormData({
                            ...formData,
                            businessHours: {
                              ...formData.businessHours,
                              [day]: { ...hours, close: e.target.value }
                            }
                          })}
                          disabled={!hours.isOpen}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={() => handleSubmit('hours', formData)}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Promotions</CardTitle>
                  <CardDescription>
                    Manage your store's promotions and discounts
                  </CardDescription>
                </div>
                <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
                  <DialogTrigger asChild>
                    <Button>Add Promotion</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Promotion</DialogTitle>
                      <DialogDescription>
                        Create a new promotion for your store
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newPromotion.title}
                          onChange={(e) => setNewPromotion({ ...newPromotion, title: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newPromotion.description}
                          onChange={(e) => setNewPromotion({ ...newPromotion, description: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newPromotion.startDate}
                            onChange={(e) => setNewPromotion({ ...newPromotion, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newPromotion.endDate}
                            onChange={(e) => setNewPromotion({ ...newPromotion, endDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="discountType">Discount Type</Label>
                          <select
                            id="discountType"
                            className="w-full border rounded-md px-3 py-2"
                            value={newPromotion.discountType}
                            onChange={(e) => setNewPromotion({
                              ...newPromotion,
                              discountType: e.target.value === 'fixed' ? 'fixed' : 'percentage'
                            })}
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="discountValue">
                            {newPromotion.discountType === 'percentage' ? 'Percentage' : 'Amount'}
                          </Label>
                          <Input
                            id="discountValue"
                            type="number"
                            min="0"
                            max={newPromotion.discountType === 'percentage' ? "100" : undefined}
                            value={newPromotion.discountValue}
                            onChange={(e) => setNewPromotion({
                              ...newPromotion,
                              discountValue: parseFloat(e.target.value)
                            })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={newPromotion.isActive}
                          onCheckedChange={(checked) => setNewPromotion({
                            ...newPromotion,
                            isActive: checked
                          })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>

                      <Button onClick={handlePromotionSubmit} className="w-full">
                        Submit for Approval
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.promotions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active promotions
                  </div>
                ) : (
                  formData.promotions.map((promotion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{promotion.title}</h4>
                        <Badge variant={promotion.isActive ? 'default' : 'secondary'}>
                          {promotion.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{promotion.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-500">Start Date</Label>
                          <p>{new Date(promotion.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">End Date</Label>
                          <p>{new Date(promotion.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Discount Type</Label>
                          <p className="capitalize">{promotion.discountType}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Discount Value</Label>
                          <p>
                            {promotion.discountType === 'percentage'
                              ? `${promotion.discountValue}%`
                              : `$${promotion.discountValue.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 