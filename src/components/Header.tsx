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
      <DeliveryAnnouncementBanner />
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-pink-600">
              BeautyFetch
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products, brands..."
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {showLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
            ) : (
              <>
                {user ? (
                  <>
                    {/* Show admin button for admin users */}
                    {profile?.role === "admin" && (
                      <Link to="/admin">
                        <Button variant="outline" size="sm">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    
                    {/* Show merchant button for store owners */}
                    {profile?.role === "store_owner" && (
                      <Link to="/merchant">
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          Merchant
                        </Button>
                      </Link>
                    )}
                    
                    {/* Show driver button for drivers */}
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
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.avatar_url} alt={getUserDisplayName()} />
                            <AvatarFallback className="bg-beauty-purple text-white">
                              {getInitials(profile?.first_name, profile?.last_name, user?.email)}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user?.email}
                            </p>
                            {profile?.role && (
                              <p className="text-xs leading-none text-muted-foreground capitalize">
                                Role: {profile.role.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/profile/orders" className="cursor-pointer">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Order History</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/profile/addresses" className="cursor-pointer">
                            <MapPin className="mr-2 h-4 w-4" />
                            <span>Addresses</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/profile/payment" className="cursor-pointer">
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Payment Methods</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/profile/wishlist" className="cursor-pointer">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>Wishlist</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/profile/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        {/* Show admin link in dropdown for easier access */}
                        {profile?.role === "admin" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to="/admin" className="cursor-pointer">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Admin Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Link to="/login">
                        <Button variant="outline" size="sm">
                          <User className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/merchant/login">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                          Merchant
                        </Button>
                      </Link>
                      <Link to="/driver/login">
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800">
                          Driver
                        </Button>
                      </Link>
                    </div>
                    
                    <CartIcon />
                  </>
                )}
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
