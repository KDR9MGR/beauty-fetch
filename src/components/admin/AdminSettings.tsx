import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { 
  Settings, 
  Save, 
  DollarSign, 
  Truck, 
  Clock, 
  Globe, 
  Mail, 
  Shield,
  AlertTriangle
} from 'lucide-react';

interface AppSettings {
  // Delivery Settings
  delivery_base_fee: number;
  delivery_per_mile_rate: number;
  max_delivery_distance: number;
  min_order_amount: number;
  free_delivery_threshold: number;
  
  // Business Hours
  business_hours: {
    monday: { isOpen: boolean; openTime: string; closeTime: string };
    tuesday: { isOpen: boolean; openTime: string; closeTime: string };
    wednesday: { isOpen: boolean; openTime: string; closeTime: string };
    thursday: { isOpen: boolean; openTime: string; closeTime: string };
    friday: { isOpen: boolean; openTime: string; closeTime: string };
    saturday: { isOpen: boolean; openTime: string; closeTime: string };
    sunday: { isOpen: boolean; openTime: string; closeTime: string };
  };
  
  // Payment Settings
  stripe_enabled: boolean;
  paypal_enabled: boolean;
  cash_on_delivery_enabled: boolean;
  tax_rate: number;
  platform_commission_rate: number;
  
  // Email Settings
  welcome_email_enabled: boolean;
  order_confirmation_enabled: boolean;
  delivery_notification_enabled: boolean;
  marketing_email_enabled: boolean;
  
  // Security Settings
  two_factor_required_for_admin: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
  session_timeout_minutes: number;
  
  // Feature Flags
  reviews_enabled: boolean;
  loyalty_program_enabled: boolean;
  referral_program_enabled: boolean;
  live_chat_enabled: boolean;
  
  // Content Settings
  app_name: string;
  app_description: string;
  support_email: string;
  support_phone: string;
  terms_url: string;
  privacy_url: string;
}

export const AdminSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    // Default values
    delivery_base_fee: 3.99,
    delivery_per_mile_rate: 1.50,
    max_delivery_distance: 25,
    min_order_amount: 15.00,
    free_delivery_threshold: 35.00,
    
    business_hours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      saturday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
      sunday: { isOpen: true, openTime: '11:00', closeTime: '20:00' },
    },
    
    stripe_enabled: true,
    paypal_enabled: false,
    cash_on_delivery_enabled: true,
    tax_rate: 8.5,
    platform_commission_rate: 5.0,
    
    welcome_email_enabled: true,
    order_confirmation_enabled: true,
    delivery_notification_enabled: true,
    marketing_email_enabled: false,
    
    two_factor_required_for_admin: false,
    password_expiry_days: 90,
    max_login_attempts: 5,
    session_timeout_minutes: 120,
    
    reviews_enabled: true,
    loyalty_program_enabled: false,
    referral_program_enabled: false,
    live_chat_enabled: true,
    
    app_name: 'BeautyFetch',
    app_description: 'Premium beauty products delivered to your door',
    support_email: 'support@beautyfetch.com',
    support_phone: '+1 (555) 123-4567',
    terms_url: '/terms-of-service',
    privacy_url: '/privacy-policy',
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // In real implementation, this would fetch from a settings table
      // For now, we'll use the default values
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In real implementation, this would save to a settings table
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateBusinessHours = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }));
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">App Settings</h2>
          <p className="text-gray-600">Configure application parameters and settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="delivery" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {/* Delivery Settings */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseDeliveryFee">Base Delivery Fee ($)</Label>
                  <Input
                    id="baseDeliveryFee"
                    type="number"
                    step="0.01"
                    value={settings.delivery_base_fee}
                    onChange={(e) => updateSetting('delivery_base_fee', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="perMileRate">Per Mile Rate ($)</Label>
                  <Input
                    id="perMileRate"
                    type="number"
                    step="0.01"
                    value={settings.delivery_per_mile_rate}
                    onChange={(e) => updateSetting('delivery_per_mile_rate', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxDistance">Max Delivery Distance (miles)</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    value={settings.max_delivery_distance}
                    onChange={(e) => updateSetting('max_delivery_distance', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="minOrder">Minimum Order Amount ($)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    step="0.01"
                    value={settings.min_order_amount}
                    onChange={(e) => updateSetting('min_order_amount', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="freeDelivery">Free Delivery Threshold ($)</Label>
                  <Input
                    id="freeDelivery"
                    type="number"
                    step="0.01"
                    value={settings.free_delivery_threshold}
                    onChange={(e) => updateSetting('free_delivery_threshold', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Payment Methods</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stripe Payments</Label>
                      <p className="text-sm text-gray-600">Accept credit/debit cards via Stripe</p>
                    </div>
                    <Switch
                      checked={settings.stripe_enabled}
                      onCheckedChange={(checked) => updateSetting('stripe_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>PayPal Payments</Label>
                      <p className="text-sm text-gray-600">Accept payments via PayPal</p>
                    </div>
                    <Switch
                      checked={settings.paypal_enabled}
                      onCheckedChange={(checked) => updateSetting('paypal_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cash on Delivery</Label>
                      <p className="text-sm text-gray-600">Allow cash payments on delivery</p>
                    </div>
                    <Switch
                      checked={settings.cash_on_delivery_enabled}
                      onCheckedChange={(checked) => updateSetting('cash_on_delivery_enabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="commissionRate">Platform Commission (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.1"
                    value={settings.platform_commission_rate}
                    onChange={(e) => updateSetting('platform_commission_rate', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings.business_hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 font-medium capitalize">{day}</div>
                    <Switch
                      checked={hours.isOpen}
                      onCheckedChange={(checked) => updateBusinessHours(day, 'isOpen', checked)}
                    />
                    {hours.isOpen ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.openTime}
                          onChange={(e) => updateBusinessHours(day, 'openTime', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.closeTime}
                          onChange={(e) => updateBusinessHours(day, 'closeTime', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-500">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Welcome Emails</Label>
                    <p className="text-sm text-gray-600">Send welcome email to new users</p>
                  </div>
                  <Switch
                    checked={settings.welcome_email_enabled}
                    onCheckedChange={(checked) => updateSetting('welcome_email_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Confirmations</Label>
                    <p className="text-sm text-gray-600">Send order confirmation emails</p>
                  </div>
                  <Switch
                    checked={settings.order_confirmation_enabled}
                    onCheckedChange={(checked) => updateSetting('order_confirmation_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Delivery Notifications</Label>
                    <p className="text-sm text-gray-600">Send delivery status updates</p>
                  </div>
                  <Switch
                    checked={settings.delivery_notification_enabled}
                    onCheckedChange={(checked) => updateSetting('delivery_notification_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-600">Send promotional emails</p>
                  </div>
                  <Switch
                    checked={settings.marketing_email_enabled}
                    onCheckedChange={(checked) => updateSetting('marketing_email_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Authentication</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Auth for Admins</Label>
                      <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                    </div>
                    <Switch
                      checked={settings.two_factor_required_for_admin}
                      onCheckedChange={(checked) => updateSetting('two_factor_required_for_admin', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.password_expiry_days}
                    onChange={(e) => updateSetting('password_expiry_days', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.session_timeout_minutes}
                    onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">App Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appName">App Name</Label>
                    <Input
                      id="appName"
                      value={settings.app_name}
                      onChange={(e) => updateSetting('app_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => updateSetting('support_email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      value={settings.support_phone}
                      onChange={(e) => updateSetting('support_phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="termsUrl">Terms of Service URL</Label>
                    <Input
                      id="termsUrl"
                      value={settings.terms_url}
                      onChange={(e) => updateSetting('terms_url', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="privacyUrl">Privacy Policy URL</Label>
                    <Input
                      id="privacyUrl"
                      value={settings.privacy_url}
                      onChange={(e) => updateSetting('privacy_url', e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="appDescription">App Description</Label>
                  <Textarea
                    id="appDescription"
                    value={settings.app_description}
                    onChange={(e) => updateSetting('app_description', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Feature Flags</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reviews & Ratings</Label>
                      <p className="text-sm text-gray-600">Allow customers to review products</p>
                    </div>
                    <Switch
                      checked={settings.reviews_enabled}
                      onCheckedChange={(checked) => updateSetting('reviews_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Loyalty Program</Label>
                      <p className="text-sm text-gray-600">Enable customer loyalty rewards</p>
                    </div>
                    <Switch
                      checked={settings.loyalty_program_enabled}
                      onCheckedChange={(checked) => updateSetting('loyalty_program_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Referral Program</Label>
                      <p className="text-sm text-gray-600">Enable customer referral system</p>
                    </div>
                    <Switch
                      checked={settings.referral_program_enabled}
                      onCheckedChange={(checked) => updateSetting('referral_program_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Live Chat Support</Label>
                      <p className="text-sm text-gray-600">Enable live chat widget</p>
                    </div>
                    <Switch
                      checked={settings.live_chat_enabled}
                      onCheckedChange={(checked) => updateSetting('live_chat_enabled', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 