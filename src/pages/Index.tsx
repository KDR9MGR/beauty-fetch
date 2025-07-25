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

const Index = () => {
  const { userLocation } = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <CategorySection />
        
        {/* Show nearby stores if location is set, otherwise show featured stores */}
        {userLocation ? <NearbyStores /> : <FeaturedStores />}
        
        <FeaturedProducts />
        <CollectionsShowcase />
        <ReviewsSection />
        <BlogPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
