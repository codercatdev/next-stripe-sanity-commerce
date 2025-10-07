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
import { getCart } from '@/app/actions'
import { useCallback, useEffect, useState } from 'react'
import { CartItem } from './CartItem'
import { CartQueryResult } from '@/sanity.types'

export function CartSheet() {
  const { sessionId } = useAuth()
  const [cart, setCart] = useState<CartQueryResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const fetchCart = useCallback(async () => {
    if (sessionId) {
      const cartData = await getCart(sessionId)
      setCart(cartData)
    }
  }, [sessionId])

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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <ShoppingCart className="h-4 w-4" />
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
          {cart && cart.items && cart.items.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200">
              {cart.items
                .filter((item) => item.product !== null)
                .map((item) => (
                  <CartItem key={item.product!._id} item={item as any} cartId={cart._id} />
                ))}
            </ul>
          ) : (
            <p>Your cart is empty.</p>
          )}
        </SignedIn>
      </SheetContent>
    </Sheet>
  )
}
