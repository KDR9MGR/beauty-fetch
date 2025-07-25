import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<'stores'> & {
  products_count?: number;
};

export function StoreSection() {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    fetchAllStores();
  }, []);

  useEffect(() => {
    // Filter stores based on search term and featured filter
    let filtered = stores;
    
    if (searchTerm) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (showFeaturedOnly) {
      filtered = filtered.filter(store => store.featured);
    }
    
    setFilteredStores(filtered);
  }, [stores, searchTerm, showFeaturedOnly]);

  const fetchAllStores = async () => {
    try {
      setLoading(true);
      
      // Fetch all active stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

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
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Beauty Stores</h1>
            <p className="text-lg text-gray-600 mb-6">
              Discover amazing beauty stores with curated products from top brands
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-beauty-purple focus:border-transparent"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Featured Filter */}
              <div className="flex items-center gap-4">
                <Button
                  variant={showFeaturedOnly ? "default" : "outline"}
                  onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  className="whitespace-nowrap"
                >
                  {showFeaturedOnly ? "Show All" : "Featured Only"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="beauty-card animate-pulse">
                <div className="aspect-[5/3] bg-gray-300"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredStores.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {searchTerm ? `Search Results (${filteredStores.length})` : 
                 showFeaturedOnly ? `Featured Stores (${filteredStores.length})` :
                 `All Stores (${filteredStores.length})`}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStores.map((store) => (
                <Link
                  to={`/store/${store.slug}`}
                  key={store.id}
                  className="beauty-card group hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[5/3] relative overflow-hidden">
                    <img
                      src={store.cover_image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80'}
                      alt={store.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80';
                      }}
                    />
                    {store.featured && (
                      <div className="absolute top-3 left-3 bg-beauty-purple text-white px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-beauty-purple transition-colors">
                        {store.name}
                      </h3>
                      {store.logo_url && (
                        <img 
                          src={store.logo_url} 
                          alt={`${store.name} logo`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                    
                    {store.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {store.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {store.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm font-medium">{Number(store.rating).toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({store.total_reviews})</span>
                          </div>
                        )}
                        <span className="text-sm text-gray-500">
                          {store.products_count} products
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <span className="text-beauty-purple text-sm font-medium group-hover:underline">
                        Visit Store →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'No stores found' : 'No stores available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No stores match "${searchTerm}". Try a different search term.`
                : showFeaturedOnly
                ? 'No featured stores available at the moment.'
                : 'There are no stores available at the moment.'
              }
            </p>
            {(searchTerm || showFeaturedOnly) && (
              <div className="space-x-4">
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm("")}
                    variant="outline"
                  >
                    Clear Search
                  </Button>
                )}
                {showFeaturedOnly && (
                  <Button 
                    onClick={() => setShowFeaturedOnly(false)}
                    variant="outline"
                  >
                    Show All Stores
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
