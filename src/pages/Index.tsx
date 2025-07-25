import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { CategorySection } from "@/components/CategorySection";
import { NearbyStores } from "@/components/NearbyStores";
import { FeaturedStores } from "@/components/FeaturedStores";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { CollectionsShowcase } from "@/components/CollectionsShowcase";
import { ReviewsSection } from "@/components/ReviewsSection";
import { BlogPreview } from "@/components/BlogPreview";
import { useLocation } from "@/contexts/LocationContext";

// Safe component wrapper to prevent entire page crashes
const SafeComponent = ({ children, name }: { children: React.ReactNode, name: string }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`Error in ${name} component:`, error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg my-4">
        <p className="text-red-800">⚠️ Error loading {name} component</p>
      </div>
    );
  }
};

const Index = () => {
  console.log('Index component is rendering');
  
  const { userLocation } = useLocation();

  // Add debug logging
  console.log('User location:', userLocation);
  console.log('Environment check:', {
    mode: import.meta.env.MODE,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Debug info for development */}
      {import.meta.env.MODE === 'development' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'rgba(0,255,0,0.1)',
          padding: '4px 8px',
          fontSize: '10px',
          zIndex: 999,
          color: 'green'
        }}>
          Index loaded ✓
        </div>
      )}
      
      <SafeComponent name="Header">
        <Header />
      </SafeComponent>
      
      <main className="flex-grow">
        <SafeComponent name="HeroSection">
          <HeroSection />
        </SafeComponent>
        
        <SafeComponent name="CategorySection">
          <CategorySection />
        </SafeComponent>
        
        <SafeComponent name="StoresSection">
          {/* Show nearby stores if location is set, otherwise show featured stores */}
          {userLocation ? <NearbyStores /> : <FeaturedStores />}
        </SafeComponent>
        
        <SafeComponent name="FeaturedProducts">
          <FeaturedProducts />
        </SafeComponent>
        
        <SafeComponent name="CollectionsShowcase">
          <CollectionsShowcase />
        </SafeComponent>
        
        <SafeComponent name="ReviewsSection">
          <ReviewsSection />
        </SafeComponent>
        
        <SafeComponent name="BlogPreview">
          <BlogPreview />
        </SafeComponent>
      </main>
      
      <SafeComponent name="Footer">
        <Footer />
      </SafeComponent>
    </div>
  );
};

export default Index;
