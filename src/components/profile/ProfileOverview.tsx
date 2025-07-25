import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Mail, Phone, Calendar, MapPin, Package, Heart, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface ProfileOverviewProps {
  user: User;
  profile: any;
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({ user, profile }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const quickStats = [
    {
      label: 'Total Orders',
      value: '12',
      icon: Package,
      color: 'bg-blue-500',
      href: '/profile/orders'
    },
    {
      label: 'Saved Addresses',
      value: '2',
      icon: MapPin,
      color: 'bg-green-500',
      href: '/profile/addresses'
    },
    {
      label: 'Wishlist Items',
      value: '8',
      icon: Heart,
      color: 'bg-pink-500',
      href: '/profile/wishlist'
    },
    {
      label: 'Payment Methods',
      value: '1',
      icon: CreditCard,
      color: 'bg-purple-500',
      href: '/profile/payment'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                Welcome back, {profile?.first_name || 'there'}!
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Here's an overview of your account activity
              </CardDescription>
            </div>
            <Link to="/profile/settings">
              <Button variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Account Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-600">Email Address</p>
              </div>
              {user.email_confirmed_at && (
                <Badge variant="secondary" className="text-green-600">
                  Verified
                </Badge>
              )}
            </div>
            
            {profile?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{profile.phone}</p>
                  <p className="text-sm text-gray-600">Phone Number</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">{formatDate(user.created_at!)}</p>
                <p className="text-sm text-gray-600">Member Since</p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/profile/settings">
                <Button variant="outline" size="sm" className="w-full">
                  Update Information
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-gray-600">2 days ago</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Added to Wishlist</p>
                  <p className="text-sm text-gray-600">1 week ago</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Address Updated</p>
                  <p className="text-sm text-gray-600">2 weeks ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/profile/orders">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                View Orders
              </Button>
            </Link>
            
            <Link to="/track-order">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            </Link>
            
            <Link to="/profile/addresses">
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Manage Addresses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 