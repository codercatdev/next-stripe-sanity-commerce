'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from './ui/button'
import { ShoppingCart } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth } from '@clerk/nextjs'
import { getCart, removeCartItem, updateCartItemQuantity, createCheckoutSessionFromCart } from '@/app/actions'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CartItem } from './CartItem'
import { CartQueryResult } from '@/sanity.types'

export function CartSheet() {
  const { sessionId } = useAuth()
  const [cart, setCart] = useState<CartQueryResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, { quantity?: number; removed?: boolean }>>({})

  const fetchCart = useCallback(async () => {
    console.log('Fetching cart with sessionId:', sessionId);
    if (sessionId) {
      const cartData = await getCart(sessionId)
      console.log('Cart data received:', cartData);
      setCart(cartData)
      // Clear optimistic updates when fresh data arrives
      setOptimisticUpdates({})
    } else {
      console.log('No sessionId available');
    }
  }, [sessionId])

  const handleRemoveItem = useCallback(async (itemKey: string) => {
    if (!cart) return { error: 'No cart found' }
    
    // Optimistic update
    setOptimisticUpdates(prev => ({
      ...prev,
      [itemKey]: { removed: true }
    }))

    const result = await removeCartItem(cart._id, itemKey)
    if (result?.error) {
      toast.error(result.error)
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[itemKey]
        return updated
      })
      return result
    } else {
      toast.success('Item removed')
      // Refresh cart data
      await fetchCart()
      return {}
    }
  }, [cart, fetchCart])

  const handleUpdateQuantity = useCallback(async (itemKey: string, newQuantity: number) => {
    if (!cart) return { error: 'No cart found' }

    if (newQuantity === 0) {
      return await handleRemoveItem(itemKey)
    }

    // Optimistic update
    setOptimisticUpdates(prev => ({
      ...prev,
      [itemKey]: { quantity: newQuantity }
    }))

    const result = await updateCartItemQuantity(cart._id, itemKey, newQuantity)
    if (result?.error) {
      toast.error(result.error)
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[itemKey]
        return updated
      })
      return result
    } else {
      toast.success('Quantity updated')
      // Refresh cart data
      await fetchCart()
      return {}
    }
  }, [cart, fetchCart, handleRemoveItem])

  const handleCheckout = useCallback(async () => {
    if (!cart) return

    const result = await createCheckoutSessionFromCart(cart._id)
    if (result.error) {
      toast.error(result.error)
    } else if (result.url) {
      window.location.href = result.url
    }
  }, [cart])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart()
      setIsOpen(true)
    }
    window.addEventListener('cart-updated', handleCartUpdate)
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
    }
  }, [fetchCart])

  // Refresh cart when sheet opens
  useEffect(() => {
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen, fetchCart])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {cart && cart.items && (() => {
            const itemCount = cart.items.filter(item => 
              item && item.product !== null && !optimisticUpdates[item._key]?.removed
            ).reduce((sum, item) => 
              sum + (optimisticUpdates[item._key]?.quantity ?? item.quantity ?? 0), 0
            )
            return itemCount > 0 ? (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null
          })()}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>
        </SheetHeader>

        <SignedOut>
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
        </SignedOut>
        <SignedIn>
          <div className="mt-4">
            {sessionId ? (
              <>
                {cart === null ? (
                  <p>Loading cart...</p>
                ) : cart && cart.items && cart.items.length > 0 ? (
                  <div>
                    {(() => {
                      const visibleItems = cart.items.filter(item => 
                        item && item.product !== null && !optimisticUpdates[item._key]?.removed
                      )
                      const totalItems = visibleItems.reduce((sum, item) => 
                        sum + (optimisticUpdates[item._key]?.quantity ?? item.quantity ?? 0), 0
                      )
                      const totalPrice = visibleItems.reduce((sum, item) => {
                        const quantity = optimisticUpdates[item._key]?.quantity ?? item.quantity ?? 0
                        const price = item.product?.price ?? 0
                        return sum + (quantity * price)
                      }, 0)
                      
                      return (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Items: {totalItems}</p>
                          <p className="text-lg font-semibold">Total: ${(totalPrice / 100).toFixed(2)}</p>
                        </div>
                      )
                    })()}
                    <ul role="list" className="divide-y divide-gray-200">
                      {cart.items
                        .filter((item) => {
                          console.log('Filtering item:', item);
                          return item && item.product !== null && !optimisticUpdates[item._key]?.removed;
                        })
                        .map((item, index) => {
                          console.log('Rendering cart item:', item);
                          if (!item || !item.product) {
                            return <li key={index} className="py-2 text-red-500">Error: Product not found</li>;
                          }
                          
                          // Apply optimistic updates
                          const optimisticItem = {
                            ...item,
                            quantity: optimisticUpdates[item._key]?.quantity ?? item.quantity
                          }
                          
                          return (
                            <CartItem
                              key={item.product._id || index}
                              item={optimisticItem as any}
                              cartId={cart._id}
                              onRemoveItem={handleRemoveItem}
                              onUpdateQuantity={handleUpdateQuantity}
                            />
                          );
                        })}
                    </ul>
                    
                    <div className="mt-6 border-t pt-4">
                      <Button 
                        onClick={handleCheckout} 
                        className="w-full"
                        disabled={!cart.items || cart.items.filter(item => !optimisticUpdates[item._key]?.removed).length === 0}
                      >
                        Checkout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>Your cart is empty.</p>
                    {cart && <p className="text-xs text-gray-500">Cart ID: {cart._id}</p>}
                  </div>
                )}
              </>
            ) : (
              <p>No session found. Please refresh the page.</p>
            )}
          </div>
        </SignedIn>
      </SheetContent>
    </Sheet>
  )
}
