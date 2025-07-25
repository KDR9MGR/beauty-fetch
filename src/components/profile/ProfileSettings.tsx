import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bell, Lock, Globe, Trash2, Camera } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from '@/components/ui/sonner';

interface ProfileSettingsProps {
  user: SupabaseUser;
  profile: any;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, profile }) => {
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    email: user.email || '',
    phone: profile?.phone || '',
    dateOfBirth: profile?.date_of_birth || '',
    avatar: profile?.avatar_url || ''
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newProducts: false,
    priceDrops: true,
    newsletter: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    showWishlist: false,
    showReviews: true
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would update the Supabase profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = () => {
    // In a real app, this would trigger password reset
    toast.success('Password reset email sent');
  };

  const handleAvatarUpload = () => {
    // In a real app, this would handle file upload
    toast.success('Avatar upload feature coming soon');
  };

  const handleDeleteAccount = () => {
    // In a real app, this would show a confirmation dialog
    toast.error('Account deletion requires confirmation');
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback className="bg-beauty-purple text-white text-xl">
                {formData.firstName?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" onClick={handleAvatarUpload}>
                <Camera className="h-4 w-4 mr-2" />
                Change Avatar
              </Button>
              <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleProfileUpdate} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">
                  {key === 'orderUpdates' && 'Order Updates'}
                  {key === 'promotions' && 'Promotions & Sales'}
                  {key === 'newProducts' && 'New Product Announcements'}
                  {key === 'priceDrops' && 'Price Drop Alerts'}
                  {key === 'newsletter' && 'Weekly Newsletter'}
                </Label>
                <p className="text-sm text-gray-500">
                  {key === 'orderUpdates' && 'Get notified about order status changes'}
                  {key === 'promotions' && 'Receive emails about sales and special offers'}
                  {key === 'newProducts' && 'Be the first to know about new arrivals'}
                  {key === 'priceDrops' && 'Get alerts when wishlist items go on sale'}
                  {key === 'newsletter' && 'Weekly roundup of beauty tips and trends'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control your privacy and data sharing preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Profile Visibility</Label>
              <p className="text-sm text-gray-500">Who can see your profile information</p>
            </div>
            <Select
              value={privacy.profileVisibility}
              onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="friends">Friends</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Show Wishlist</Label>
              <p className="text-sm text-gray-500">Allow others to see your wishlist</p>
            </div>
            <Switch
              checked={privacy.showWishlist}
              onCheckedChange={(checked) => 
                setPrivacy(prev => ({ ...prev, showWishlist: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Show Reviews</Label>
              <p className="text-sm text-gray-500">Display your product reviews publicly</p>
            </div>
            <Switch
              checked={privacy.showReviews}
              onCheckedChange={(checked) => 
                setPrivacy(prev => ({ ...prev, showReviews: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Password</Label>
              <p className="text-sm text-gray-500">Last changed 30 days ago</p>
            </div>
            <Button variant="outline" onClick={handlePasswordChange}>
              Change Password
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Button variant="outline">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-red-600">Delete Account</Label>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 