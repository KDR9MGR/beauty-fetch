import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Store = Tables<'stores'>;
type Product = Tables<'products'> & {
  store: Tables<'stores'>;
  images: Tables<'product_images'>[];
  category: Tables<'categories'>;
};

export default function Store() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('Store component mounted with slug:', slug);
    if (slug) {
      fetchStore();
    } else {
      console.error('No slug provided');
      setError('No store slug provided');
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (store) {
      console.log('Store loaded, fetching products for:', store);
      fetchStoreProducts();
    }
  }, [store]);

  const fetchStore = async () => {
    if (!slug) return;
    
    try {
      setError(null);
      console.log('🔍 Fetching store with slug:', slug);
      
      // First, let's check if there are any stores at all
      const { data: allStores, error: allStoresError } = await supabase
        .from('stores')
        .select('slug, name, status')
        .limit(10);
        
      console.log('📊 All stores in database:', allStores);
      console.log('❌ Error fetching all stores:', allStoresError);
      
      setDebugInfo(prev => ({
        ...prev,
        allStores,
        allStoresError,
        searchedSlug: slug
      }));
      
      // Now try to fetch the specific store
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      console.log('🏪 Store query result:', { data, error });
      
      setDebugInfo(prev => ({
        ...prev,
        storeQuery: { data, error }
      }));

      if (error) {
        console.error('❌ Error fetching store:', error);
        if (error.code === 'PGRST116') {
          setError(`Store with slug "${slug}" not found. Available stores: ${allStores?.map(s => s.slug).join(', ') || 'None'}`);
        } else {
          setError(`Failed to load store: ${error.message}`);
        }
      } else if (!data) {
        setError(`Store with slug "${slug}" not found`);
      } else {
        console.log('✅ Store data loaded:', data);
        setStore(data);
      }
    } catch (error) {
      console.error('💥 Exception fetching store:', error);
      setError(`Failed to load store: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async () => {
    if (!store) return;
    
    try {
      setProductsLoading(true);
      console.log('🛍️ Fetching products for store ID:', store.id);
      
      // Try the main query first
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores!inner(*),
          product_images(*),
          categories(*)
        `)
        .eq('store_id', store.id)
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      console.log('📦 Products query result:', { data, error, storeId: store.id });
      
      setDebugInfo(prev => ({
        ...prev,
        productsQuery: { data, error, storeId: store.id }
      }));

      if (error) {
        console.error('❌ Error fetching store products:', error);
        // Try fallback query without joins
        console.log('🔄 Trying fallback query without joins...');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('status', 'active');
          
        console.log('🔄 Fallback query result:', { fallbackData, fallbackError });
        
        setDebugInfo(prev => ({
          ...prev,
          fallbackQuery: { fallbackData, fallbackError }
        }));
          
        if (fallbackError) {
          console.error('💥 Fallback query also failed:', fallbackError);
        } else {
          console.log('✅ Using fallback products data:', fallbackData);
          // Transform fallback data to match expected structure
          const transformedProducts = fallbackData?.map(product => ({
            ...product,
            store: store,
            images: [],
            category: null
          })) || [];
          setProducts(transformedProducts as Product[]);
        }
      } else {
        console.log('✅ Products data loaded:', data);
        // Transform the data to match our expected structure
        const transformedProducts = data?.map(product => ({
          ...product,
          store: product.stores,
          images: product.product_images || [],
          category: product.categories
        })) || [];
        setProducts(transformedProducts as any);
      }
    } catch (error) {
      console.error('💥 Exception fetching store products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Debug render to show what's happening
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 Render state:', {
      slug,
      loading,
      error,
      store,
      productsCount: products.length,
      debugInfo
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-48 bg-gray-300 rounded-lg mb-6"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-8"></div>
            </div>
            <div className="text-center text-gray-500 mt-4">
              Loading store: {slug}...
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Store</h1>
              <p className="text-red-600 mb-4">{error}</p>
              
              {/* Debug Information in Development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
                  <h3 className="font-bold mb-2">Debug Information:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="space-x-4 mt-6">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
                <Link to="/stores">
                  <Button variant="outline">Browse All Stores</Button>
                </Link>
                <Link to="/">
                  <Button>Go Back Home</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Not Found</h1>
            <p className="text-gray-600 mb-8">The store "{slug}" doesn't exist.</p>
            
            {/* Debug Information in Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left max-w-2xl mx-auto">
                <h3 className="font-bold mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="space-x-4">
              <Link to="/stores">
                <Button variant="outline">Browse All Stores</Button>
              </Link>
              <Link to="/">
                <Button>Go Back Home</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="text-sm text-gray-600">
              <Link to="/" className="hover:text-beauty-purple">Home</Link>
              <span className="mx-2">›</span>
              <Link to="/stores" className="hover:text-beauty-purple">Stores</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900">{store.name}</span>
            </nav>
          </div>
        </div>

        <div className="bg-gray-50">
          {/* Store Header */}
          <div className="relative">
            <div 
              className="h-48 md:h-64 bg-cover bg-center"
              style={{
                backgroundImage: `url(${store.cover_image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80'})`
              }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="container mx-auto">
                  <div className="flex items-end gap-4">
                    {store.logo_url && (
                      <img 
                        src={store.logo_url} 
                        alt={`${store.name} logo`}
                        className="w-16 h-16 rounded-full bg-white p-2"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold mb-2">{store.name}</h1>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">★</span>
                        <span className="text-lg">{store.rating || 4.8}</span>
                        <span className="text-white/80">({store.total_reviews || 127} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="container mx-auto px-4 py-8">
            {store.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">About {store.name}</h2>
                <p className="text-gray-600">{store.description}</p>
              </div>
            )}

            {/* Products Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Products</h2>
                <span className="text-gray-600">{products.length} products available</span>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="beauty-card animate-pulse">
                      <div className="aspect-square bg-gray-300 rounded-lg mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h3>
                  <p className="text-gray-600">This store doesn't have any products listed yet.</p>
                  
                  {/* Debug Information in Development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-left max-w-2xl mx-auto">
                      <h4 className="font-bold mb-2">Products Debug Info:</h4>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(debugInfo.productsQuery || debugInfo.fallbackQuery, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <Button onClick={() => fetchStoreProducts()} variant="outline" className="mt-4">
                    Try Refreshing Products
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 