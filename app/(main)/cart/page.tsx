'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Enable PPR for this page
export const experimental_ppr = true;
export const dynamic = 'force-dynamic';
import { Header } from '@/components/Header'

import { CartItem } from '@/components/CartItem'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'

function CartDetailsSkeleton() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">Loading cart...</span>
        </div>
      </div>
    </div>
  )
}

function CartDetails() {
  const { cart, optimisticCart, isLoading, error, removeItem, updateQuantity, checkout, isUpdating, mutate } = useCart()

  // Use optimistic cart for UI, fallback to regular cart
  const displayCart = optimisticCart || cart

  if (isLoading) {
    return <CartDetailsSkeleton />
  }

  if (error) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Cart</h1>
            <p className="text-gray-600 mb-4">There was a problem loading your cart.</p>
            <Button onClick={() => mutate()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!displayCart || !displayCart.items || displayCart.items.length === 0) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>
            <p className="mt-8 text-lg text-gray-600">Your cart is empty</p>
            {displayCart && <p className="text-xs text-gray-500 mt-2">Cart ID: {displayCart._id}</p>}
          </div>
        </div>
      </div>
    )
  }

  const validItems = displayCart.items.filter(item => item && item.product !== null)
  const total = validItems.reduce((acc, item) => acc + (item?.product?.price || 0) * (item?.quantity || 0), 0)

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
              {validItems.map((item) => (
                <CartItem
                  key={item.product!._id}
                  item={item as any}
                  cartId={displayCart._id}
                  onRemoveItem={removeItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
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
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Items ({validItems.length})</dt>
                <dd className="text-sm text-gray-900">
                  {validItems.reduce((sum, item) => sum + (item?.quantity || 0), 0)} total
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">${(total / 100).toFixed(2)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <Button
                onClick={checkout}
                className="w-full"
                disabled={isUpdating || validItems.length === 0}
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
