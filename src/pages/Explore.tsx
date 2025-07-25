import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCart } from "@/contexts/CartContext";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, ShoppingCart, Heart, ChevronDown } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<'categories'>;

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const selectedSubcategory = searchParams.get("subcategory");
  
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { addToCart, getItemByProduct } = useCart();

  // Type cast and organize categories hierarchically
  const categories = categoriesData as Category[] | undefined;
  const parentCategories = categories?.filter(category => !category.parent_id) || [];
  const subcategories = categories?.filter(category => category.parent_id) || [];

  // Get subcategories for the selected parent category
  const selectedParentCategory = parentCategories.find(cat => cat.slug === selectedCategory);
  const currentSubcategories = selectedParentCategory 
    ? subcategories.filter(sub => sub.parent_id === selectedParentCategory.id)
    : [];

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.stores?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Simple category filtering for now
    let matchesCategory = true;
    if (selectedCategory && product.categories) {
      matchesCategory = product.categories.slug === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const handleCategoryFilter = (categorySlug: string | null, subcategorySlug: string | null = null) => {
    const params = new URLSearchParams();
    if (categorySlug) {
      params.set('category', categorySlug);
      if (subcategorySlug) {
        params.set('subcategory', subcategorySlug);
      }
    }
    setSearchParams(params);
  };

  const handleAddToCart = (product: any) => {
    const cartItem = getItemByProduct(product.id);
    if (cartItem && cartItem.quantity >= 10) {
      toast.error("Cannot add more than 10 items to cart");
      return;
    }
    
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  if (productsError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h1>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-beauty-purple to-beauty-pink py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Explore Beauty
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Discover amazing products from local beauty stores in your area
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search for products, brands, or stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-lg rounded-full border-0 bg-white/90 backdrop-blur-sm"
              />
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-6 border-b bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Filter by category:</span>
              </div>
              
              {categoriesLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-20" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={!selectedCategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryFilter(null)}
                  >
                    All
                  </Button>
                  {parentCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.slug ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryFilter(category.slug)}
                      className="flex items-center gap-1"
                    >
                      {category.name}
                      {currentSubcategories.length > 0 && selectedCategory === category.slug && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Subcategory Filter */}
            {selectedCategory && currentSubcategories.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap mt-4 pl-8">
                <span className="font-medium text-gray-700 text-sm">Subcategories:</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={!selectedSubcategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryFilter(selectedCategory, null)}
                  >
                    All {selectedParentCategory?.name}
                  </Button>
                  {currentSubcategories.map((subcategory) => (
                    <Button
                      key={subcategory.id}
                      variant={selectedSubcategory === subcategory.slug ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryFilter(selectedCategory, subcategory.slug)}
                    >
                      {subcategory.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">
                {selectedSubcategory 
                  ? `${currentSubcategories.find(sub => sub.slug === selectedSubcategory)?.name} Products`
                  : selectedCategory 
                    ? `${selectedParentCategory?.name} Products`
                    : "All Products"
                }
              </h2>
              <p className="text-gray-600">
                {filteredProducts?.length || 0} products found
              </p>
            </div>
            
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => {
                  const productImages = Array.isArray(product.product_images) ? product.product_images : [];
                  const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
                  const cartItem = getItemByProduct(product.id);
                  
                  return (
                    <Link key={product.id} to={`/product/${product.slug}`} className="group block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="relative aspect-square overflow-hidden rounded-t-lg">
                        <img
                          src={primaryImage?.image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {product.compare_price && product.compare_price > product.price && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
                          </div>
                        )}
                        
                        {/* Store badge */}
                        <div className="absolute top-2 right-2">
                          <span className="bg-white/80 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                            {product.stores?.name}
                          </span>
                        </div>

                        {/* Wishlist button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast.success(`${product.name} added to wishlist!`);
                          }}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-beauty-purple mb-2">{product.categories?.name}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg font-bold text-beauty-purple">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.compare_price && product.compare_price > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.compare_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Button 
                          className="w-full bg-beauty-purple hover:bg-beauty-purple-dark" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={cartItem && cartItem.quantity > 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {cartItem && cartItem.quantity > 0 ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
                        </Button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm 
                      ? `No products match your search "${searchTerm}"`
                      : selectedCategory 
                        ? `No products found in this category`
                        : "No products available"
                    }
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      handleCategoryFilter(null);
                    }}
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
