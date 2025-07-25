import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/sonner';

interface ProfileWishlistProps {
  user: User;
}

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    store: {
      name: string;
      slug: string;
    };
    inStock: boolean;
  };
  addedAt: string;
}

export const ProfileWishlist: React.FC<ProfileWishlistProps> = ({ user }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    {
      id: '1',
      product: {
        id: 'prod1',
        name: 'Luxury Anti-Aging Face Cream',
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
        store: {
          name: 'Luxury Beauty',
          slug: 'luxury-beauty'
        },
        inStock: true
      },
      addedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      product: {
        id: 'prod2',
        name: 'Organic Vitamin C Serum',
        price: 45.00,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300',
        store: {
          name: 'Natural Glow',
          slug: 'natural-glow'
        },
        inStock: true
      },
      addedAt: '2024-01-12T14:30:00Z'
    }
  ]);

  const handleRemoveFromWishlist = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.product.inStock) {
      toast.error('Product is currently out of stock');
      return;
    }
    
    toast.success(`Added ${item.product.name} to cart`);
  };

  const totalValue = wishlistItems.reduce((sum, item) => sum + item.product.price, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Wishlist</CardTitle>
          <CardDescription>
            {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} • Total value: ${totalValue.toFixed(2)}
          </CardDescription>
        </CardHeader>
      </Card>

      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Save products you love to buy them later</p>
            <Link to="/stores">
              <Button>Start Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    onClick={() => handleRemoveFromWishlist(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                
                <div className="p-4">
                  <Badge variant="outline" className="text-xs mb-2">
                    {item.product.store.name}
                  </Badge>
                  
                  <h3 className="font-semibold text-sm mb-2">
                    {item.product.name}
                  </h3>
                  
                  <p className="text-lg font-bold text-beauty-purple mb-3">
                    ${item.product.price.toFixed(2)}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromWishlist(item.id)}
                    >
                      <Heart className="h-4 w-4 fill-current text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 