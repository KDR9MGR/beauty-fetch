import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { useLocation } from "@/contexts/LocationContext";
import Index from "./pages/Index";
import Store from "./pages/Store";
import Stores from "./pages/Stores";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import TestPayment from "./pages/TestPayment";
import TrackOrder from "./pages/TrackOrder";
import Explore from "./pages/Explore";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import MerchantDashboard from "./pages/MerchantDashboard";
import MerchantSignup from "./pages/MerchantSignup";
import DriverSignup from "./pages/DriverSignup";
import UserAuth from "./pages/UserAuth";
import MerchantAuth from "./pages/MerchantAuth";
import DriverAuth from "./pages/DriverAuth";
import DriverDashboard from "./pages/DriverDashboard";
import NotFound from "./pages/NotFound";
import { LocationDemoPage } from "@/components/LocationDemoPage";

const queryClient = new QueryClient();

// Location Modal Wrapper Component
const LocationModalWrapper = () => {
  const { showLocationModal, setUserLocation, setShowLocationModal } = useLocation();
  
  return (
    <LocationPermissionModal 
      isOpen={showLocationModal}
      onLocationSet={setUserLocation}
      onSkip={() => setShowLocationModal(false)}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner richColors closeButton />
            <LocationModalWrapper />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/store/:slug" element={<Store />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/test-payment" element={<TestPayment />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<UserAuth />} />
                <Route path="/merchant/login" element={<MerchantAuth />} />
                <Route path="/driver/login" element={<DriverAuth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/merchant" element={<MerchantDashboard />} />
                <Route path="/driver-dashboard" element={<DriverDashboard />} />
                <Route path="/merchant-signup" element={<MerchantSignup />} />
                <Route path="/driver-signup" element={<DriverSignup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:section" element={<Profile />} />
              <Route path="/location-demo" element={<LocationDemoPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
