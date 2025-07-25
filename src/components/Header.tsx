import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, Shield, LogOut, ChevronDown, Package, MapPin, CreditCard, Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { CartIcon } from "@/components/CartIcon";
import { DeliveryAnnouncementBanner } from "@/components/DeliveryAnnouncementBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email || "User";
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Stores", href: "/stores" },
    { name: "Explore", href: "/explore" },
  ];

  // Show loading state only during initial load
  const showLoading = loading && !initialized;

  return (
    <>
    <header className="bg-white shadow-sm">
      <DeliveryAnnouncementBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-pink-600">BeautyFetch</h1>
            </Link>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Search products, brands..."
                className="pl-10"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {showLoading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <>
                {/* Admin/Merchant/Driver buttons */}
                {profile?.role === "admin" && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                
                {profile?.role === "store_owner" && (
                  <Link to="/merchant">
                    <Button variant="outline" size="sm">
                      <Package className="h-4 w-4 mr-2" />
                      Merchant
                    </Button>
                  </Link>
                )}
                
                {profile?.role === "driver" && (
                  <Link to="/driver-dashboard">
                    <Button variant="outline" size="sm">
                      <Package className="h-4 w-4 mr-2" />
                      Driver
                    </Button>
                  </Link>
                )}
                
                <CartIcon />
                
                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(profile?.first_name, profile?.last_name, user?.email)}</AvatarFallback>
                      </Avatar>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{getUserDisplayName()}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/profile/orders">
                      <DropdownMenuItem>
                        <Package className="mr-2 h-4 w-4" />
                        Orders
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/profile/addresses">
                      <DropdownMenuItem>
                        <MapPin className="mr-2 h-4 w-4" />
                        Addresses
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/profile/payment">
                      <DropdownMenuItem>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payment Methods
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/profile/wishlist">
                      <DropdownMenuItem>
                        <Heart className="mr-2 h-4 w-4" />
                        Wishlist
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/profile/settings">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="min-w-[90px]">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/merchant/auth">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                      Merchant
                    </Button>
                  </Link>
                  <Link to="/driver/auth">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800">
                      Driver
                    </Button>
                  </Link>
                </div>
                
                <CartIcon />
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {/* Mobile Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10 pr-4 w-full"
                />
              </div>
              
              {/* Mobile Navigation Links */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile User Menu */}
              {user && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center px-3 py-2">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={profile?.avatar_url} alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-beauty-purple text-white">
                          {getInitials(profile?.first_name, profile?.last_name, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{getUserDisplayName()}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                        {profile?.role && (
                          <div className="text-xs text-gray-500 capitalize">
                            {profile.role.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    
                    <Link
                      to="/profile/orders"
                      className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Order History
                    </Link>
                    
                    {profile?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    
                    {profile?.role === "store_owner" && (
                      <Link
                        to="/merchant"
                        className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Merchant Dashboard
                      </Link>
                    )}
                    
                    {profile?.role === "driver" && (
                      <Link
                        to="/driver-dashboard"
                        className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Driver Dashboard
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700 block px-3 py-2 text-base font-medium w-full text-left"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}

              {!user && !showLoading && (
                <Link
                  to="/auth"
                  className="text-gray-700 hover:text-pink-600 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export { Header };
