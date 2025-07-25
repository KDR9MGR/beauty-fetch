import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Package, 
  MapPin, 
  CreditCard, 
  Heart, 
  Settings, 
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { ProfileOrders } from '@/components/profile/ProfileOrders';
import { ProfileAddresses } from '@/components/profile/ProfileAddresses';
import { ProfilePayment } from '@/components/profile/ProfilePayment';
import { ProfileWishlist } from '@/components/profile/ProfileWishlist';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { ProfileOverview } from '@/components/profile/ProfileOverview';

const Profile = () => {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(section || 'overview');

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Update active tab when URL changes
  React.useEffect(() => {
    const newTab = section || 'overview'; // Default to 'overview' when section is undefined
    setActiveTab(newTab);
  }, [section]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="h-64 bg-gray-300 rounded"></div>
                <div className="lg:col-span-3 h-96 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'overview') {
      navigate('/profile');
    } else {
      navigate(`/profile/${tabId}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">My Account</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    <div className="w-20 h-20 bg-beauty-purple text-white rounded-full flex items-center justify-center text-2xl font-bold">
                      {profile?.first_name?.[0] || user.email?.[0] || 'U'}
                    </div>
                  </div>
                  <CardTitle className="text-lg">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile?.first_name || user.email}
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                            activeTab === tab.id 
                              ? 'bg-beauty-purple/10 text-beauty-purple border-r-2 border-beauty-purple' 
                              : 'text-gray-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Render content based on activeTab instead of using Tabs component */}
              {activeTab === 'overview' && <ProfileOverview user={user} profile={profile} />}
              {activeTab === 'orders' && <ProfileOrders user={user} />}
              {activeTab === 'addresses' && <ProfileAddresses user={user} />}
              {activeTab === 'payment' && <ProfilePayment user={user} />}
              {activeTab === 'wishlist' && <ProfileWishlist user={user} />}
              {activeTab === 'settings' && <ProfileSettings user={user} profile={profile} />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile; 