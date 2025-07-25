import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type ProductWithDetails = Tables<'products'> & {
  store: Tables<'stores'>;
  images: Tables<'product_images'>[];
  category: Tables<'categories'>;
};

export function FeaturedProducts() {
  const [currentTab, setCurrentTab] = useState("trending");
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            store:stores(*),
            images:product_images(*),
            category:categories(*)
          `)
          .eq('status', 'active')
          .limit(20);

        if (error) {
          console.error('Error fetching products:', error);
        } else {
          setProducts(data as ProductWithDetails[]);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // For demo purposes, we'll use the same products for all tabs
  // In a real app, you'd filter by different criteria
  const getProductsForTab = (tab: string) => {
    switch (tab) {
      case 'featured':
        return products.filter(p => p.featured);
      case 'bestsellers':
        return products.slice(0, 10);
      case 'newArrivals':
        return products.slice(5, 15);
      default:
        return products.slice(0, 10);
    }
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Skeleton className="h-10 w-60" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="beauty-card overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          
          <Tabs 
            value={currentTab} 
            onValueChange={setCurrentTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="bestsellers">Bestsellers</TabsTrigger>
              <TabsTrigger value="newArrivals">New Arrivals</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="mt-6">
          <Tabs value={currentTab} className="w-full">
            <TabsContent value="trending" className="m-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {getProductsForTab('trending').map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="bestsellers" className="m-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {getProductsForTab('bestsellers').map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="newArrivals" className="m-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {getProductsForTab('newArrivals').map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          {products.length > 0 && (
            <div className="mt-10 text-center">
              <Button asChild>
                <Link to="/explore">View All Products</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
