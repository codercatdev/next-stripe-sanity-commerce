'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'

// Enable PPR for this page
export const experimental_ppr = true;
export const dynamic = 'force-dynamic';
import { Header } from '@/components/Header'

import { getCart } from '@/app/actions'
import { CartItem } from '@/components/CartItem'
import { createCheckoutSessionFromCart } from '@/app/actions'
import { toast } from 'sonner'
import { useAuth } from '@clerk/nextjs'
import { CartQueryResult } from '@/sanity.types'

function CartDetailsSkeleton() {
  return <div>Loading...</div>
}

function CartDetails() {
  const [cart, setCart] = useState<CartQueryResult | null>(null)
  const { sessionId } = useAuth()


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
    }
    window.addEventListener('cart-updated', handleCartUpdate)
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
    }
  }, [fetchCart])

  const handleCheckout = async () => {
    if (cart) {
      const result = await createCheckoutSessionFromCart(cart._id)
      if (result.error) {
        toast.error(result.error)
      } else if (result.url) {
        window.location.href = result.url
      }
    }
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return <div>Your cart is empty</div>
  }

  const total = cart.items.reduce((acc, item) => acc + (item?.product?.price || 0) * (item?.quantity || 0), 0)

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>
        <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
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
            </ul>
          </section>

          {/* Cart summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">${total / 100}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <button
                onClick={handleCheckout}
                className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
              >
                Checkout
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<CartDetailsSkeleton />}>
          <CartDetails />
        </Suspense>
      </main>
    </>
  )
}
