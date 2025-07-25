import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<'stores'> & {
  products_count?: number;
};

export function FeaturedStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedStores();
  }, []);

  const fetchFeaturedStores = async () => {
    try {
      setLoading(true);
      
      // Fetch featured stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .eq('featured', true)
        .order('rating', { ascending: false })
        .limit(4);

      if (storesError) {
        console.error('Error fetching stores:', storesError);
        return;
      }

      // Fetch product counts for each store
      const storeIds = storesData?.map(store => store.id) || [];
      const { data: productCounts, error: countError } = await supabase
        .from('products')
        .select('store_id')
        .eq('status', 'active')
        .in('store_id', storeIds);

      if (countError) {
        console.error('Error fetching product counts:', countError);
      }

      // Transform the data to include product count
      const transformedStores = storesData?.map(store => {
        const products_count = productCounts?.filter(p => p.store_id === store.id).length || 0;
        return {
          ...store,
          products_count
        };
      }) || [];

      setStores(transformedStores);
    } catch (error) {
      console.error('Error fetching featured stores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Explore Beauty Stores</h2>
            <Link to="/stores">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="beauty-card animate-pulse">
                <div className="aspect-[5/3] relative overflow-hidden bg-gray-300"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Explore Beauty Stores</h2>
          <Link to="/stores">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stores.map((store) => (
            <Link
              to={`/store/${store.slug}`}
              key={store.id}
              className="beauty-card group"
            >
              <div className="aspect-[5/3] relative overflow-hidden">
                <img
                  src={store.cover_image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80'}
                  alt={store.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="font-bold text-xl text-white">{store.name}</h3>
                    <p className="text-white/90 text-sm">{store.products_count} products</p>
                    {store.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-white/90 text-sm">{Number(store.rating).toFixed(1)}</span>
                        <span className="text-white/70 text-sm">({store.total_reviews})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{store.description}</p>
                <span className="text-beauty-purple text-sm font-medium group-hover:underline">Shop Now →</span>
              </div>
            </Link>
          ))}
        </div>

        {stores.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No featured stores available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
} 