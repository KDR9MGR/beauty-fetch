import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function CartIcon() {
  const { state, removeFromCart, updateQuantity, getTotalItemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = getTotalItemCount();

  if (itemCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {itemCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Shopping Cart ({itemCount} items)</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {state.items.map((item) => {
            const price = item.variant?.price || item.product.price;
            const primaryImage = item.product.images.find(img => img.is_primary) || item.product.images[0];
            
            return (
              <div key={item.id} className="p-4 border-b flex gap-3">
                <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {primaryImage && (
                    <img
                      src={primaryImage.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{item.product.store.name}</p>
                  {item.variant && (
                    <p className="text-xs text-gray-600 mb-1">{item.variant.title}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">${(price * item.quantity).toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${state.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${state.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Shipping:
              </span>
              <span>
                {state.shipping === 0 ? (
                  <span className="text-green-600 font-medium">Free</span>
                ) : (
                  `$${state.shipping.toFixed(2)}`
                )}
              </span>
            </div>
            {state.tip > 0 && (
              <div className="flex justify-between">
                <span>Tip:</span>
                <span>${state.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t pt-1">
              <span>Total:</span>
              <span>${state.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <Button asChild className="w-full mb-2">
            <Link to="/checkout" onClick={() => setIsOpen(false)}>
              Checkout
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/cart" onClick={() => setIsOpen(false)}>
              View Cart
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 