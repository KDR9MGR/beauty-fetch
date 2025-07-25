import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useCart } from "@/contexts/CartContext";
import { Tables } from "@/integrations/supabase/types";

interface ProductCardProps {
  product: Tables<'products'> & {
    store: Tables<'stores'>;
    images: Tables<'product_images'>[];
    category?: Tables<'categories'>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, getItemByProduct } = useCart();
  
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const cartItem = getItemByProduct(product.id);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(`${product.name} added to wishlist!`);
  };

  return (
    <Link to={`/product/${product.slug}`} className="product-card block group">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={primaryImage?.image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-white hover:bg-white hover:text-beauty-purple"
            onClick={handleAddToWishlist}
          >
            <Heart className="h-4 w-4" />
            <span className="sr-only">Add to wishlist</span>
          </Button>
        </div>

        {/* Store badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-white/80 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
            {product.store.name}
          </span>
        </div>

        {/* Featured badge */}
        {product.featured && (
          <div className="absolute top-10 left-2">
            <span className="bg-beauty-purple text-white text-xs font-medium px-2 py-1 rounded-full">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
          <span className="font-medium text-sm">${product.price.toFixed(2)}</span>
        </div>

        <div className="mb-3">
          <p className="text-xs text-gray-600">{product.category?.name || 'Beauty'}</p>
          <div className="flex items-center mt-1">
            <div className="flex">
              {Array(5).fill(0).map((_, i) => (
                <svg
                  key={i}
                  className={`h-3 w-3 ${
                    i < 4 ? "text-yellow-400" : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              ))}
            </div>
          </div>
        </div>

        <Button 
          size="sm" 
          className="w-full bg-beauty-purple hover:bg-beauty-purple-dark"
          onClick={handleAddToCart}
          disabled={cartItem && cartItem.quantity > 0}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {cartItem && cartItem.quantity > 0 ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
        </Button>
      </div>
    </Link>
  );
}
