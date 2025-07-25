
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="relative">
      <div className="bg-beauty-gradient w-full">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              The beautiful way to shop for beauty
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Discover curated collections from top beauty stores, with personalized recommendations and exclusive offers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-beauty-purple hover:bg-white/90">
                <Link to="/explore">Shop Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link to="/stores">Browse Stores</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
