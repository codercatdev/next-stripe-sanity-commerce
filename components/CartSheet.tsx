'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from './ui/button'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { CartItem } from './CartItem'
import { useCart } from '@/contexts/CartContext'

export function CartSheet() {
  const { cart, optimisticCart, isLoading, error, removeItem, updateQuantity, checkout, isUpdating, mutate } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  // Listen for cart updates to open the sheet
  useEffect(() => {
    const handleCartUpdate = () => {
      mutate() // Trigger SWR to refetch
      setIsOpen(true)
    }
    window.addEventListener('cart-updated', handleCartUpdate)
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
    }
  }, [mutate])

  // Use optimistic cart for UI, fallback to regular cart
  const displayCart = optimisticCart || cart

  const itemCount = displayCart && displayCart.items
    ? displayCart.items.filter(item => item && item.product !== null)
      .reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    : 0

  const totalPrice = displayCart && displayCart.items
    ? displayCart.items
      .filter(item => item && item.product !== null)
      .reduce((sum, item) => {
        const quantity = item.quantity ?? 0
        const price = item.product?.price ?? 0
        return sum + (quantity * price)
      }, 0)
    : 0

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>
        </SheetHeader>

        <SignedOut>
          <div className="flex flex-col gap-2 mt-4">
            <SignInButton mode="modal">
              <Button variant="ghost">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="mt-4 flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading cart...</span>
              </div>
            ) : error ? (
              <div className="text-red-500 py-4">
                <p>Error loading cart</p>
                <Button variant="outline" size="sm" onClick={() => mutate()} className="mt-2">
                  Retry
                </Button>
              </div>
            ) : displayCart && displayCart.items && displayCart.items.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="mb-4 flex-shrink-0">
                  <p className="text-sm text-gray-600">Items: {itemCount}</p>
                  <p className="text-lg font-semibold">Total: ${(totalPrice / 100).toFixed(2)}</p>
                </div>

                <ul role="list" className="divide-y divide-gray-200 flex-1 overflow-y-auto min-h-0">
                  {displayCart.items
                    .filter(item => item && item.product !== null)
                    .map((item, index) => {
                      if (!item || !item.product) {
                        return <li key={index} className="py-2 text-red-500">Error: Product not found</li>;
                      }

                      return (
                        <CartItem
                          key={item.product._id || index}
                          item={item as any}
                          cartId={displayCart._id}
                          onRemoveItem={removeItem}
                          onUpdateQuantity={updateQuantity}
                        />
                      );
                    })}
                </ul>

                <div className="mt-6 border-t pt-4 flex-shrink-0">
                  <Button
                    onClick={checkout}
                    className="w-full"
                    disabled={isUpdating || !displayCart.items || displayCart.items.filter(item => item && item.product !== null).length === 0}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Checkout'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>Your cart is empty.</p>
                {displayCart && <p className="text-xs text-gray-500 mt-2">Cart ID: {displayCart._id}</p>}
              </div>
            )}
          </div>
        </SignedIn>
      </SheetContent>
    </Sheet>
  )
}
