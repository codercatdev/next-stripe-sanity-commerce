'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { updateCartItemQuantity, removeCartItem } from '@/app/actions'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { ProductImage } from './ProductImage'
import { Button } from './ui/button'
import { Trash } from 'lucide-react'
import { CartQueryResult } from '@/sanity.types'

type CartItemType = NonNullable<NonNullable<CartQueryResult>['items']>[0] & {
  product: NonNullable<NonNullable<NonNullable<CartQueryResult>['items']>[0]['product']>;
};

type CartItemProps = {
  item: CartItemType;
  cartId: string;
  onRemoveItem?: (itemKey: string) => Promise<{ error?: string }>;
  onUpdateQuantity?: (itemKey: string, newQuantity: number) => Promise<{ error?: string }>;
}

export function CartItem({ item, cartId, onRemoveItem, onUpdateQuantity }: CartItemProps) {
  const [optimisticQuantity, setOptimisticQuantity] = useState(item.quantity)

  const handleQuantityChange = async (newQuantity: number) => {
    // Use provided handler if available, otherwise fall back to direct action
    if (onUpdateQuantity) {
      const result = await onUpdateQuantity(item._key, newQuantity)
      if (result?.error) {
        toast.error(result.error)
      }
      return
    }

    // Fallback to local state management
    const oldQuantity = optimisticQuantity
    setOptimisticQuantity(newQuantity)

    if (newQuantity === 0) {
      await handleRemoveItem()
      return
    }

    const result = await updateCartItemQuantity(cartId, item._key, newQuantity)
    if (result?.error) {
      toast.error(result.error)
      setOptimisticQuantity(oldQuantity)
    } else {
      toast.success('Quantity updated')
      window.dispatchEvent(new CustomEvent('cart-updated'))
    }
  }

  const handleRemoveItem = async () => {
    // Use provided handler if available, otherwise fall back to direct action
    if (onRemoveItem) {
      const result = await onRemoveItem(item._key)
      if (result?.error) {
        toast.error(result.error)
      }
      return
    }

    // Fallback to local state management
    const oldQuantity = optimisticQuantity
    setOptimisticQuantity(0)
    const result = await removeCartItem(cartId, item._key)
    if (result?.error) {
      toast.error(result.error)
      setOptimisticQuantity(oldQuantity)
    } else {
      toast.success('Item removed')
      window.dispatchEvent(new CustomEvent('cart-updated'))
    }
  }

  return (
    <li key={item.product._id} className="flex py-6 sm:py-10">
      <div className="flex-shrink-0">
        <div className='w-24 h-24 rounded-md sm:w-48 sm:h-48 flex items-center justify-center overflow-hidden'>
          <ProductImage product={item.product} />
        </div>
      </div>

      <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
          <div>
            <div className="flex justify-between">
              <h3 className="text-sm">
                <Link href={`/product/${item.product.slug}`} className="font-medium text-gray-700 hover:text-gray-800">
                  {item.product.name}
                </Link>
              </h3>
            </div>
            <p className="mt-1 text-sm font-medium text-gray-900">${(item.product.price || 0) / 100}</p>
          </div>

          <div className="mt-4 sm:mt-0 sm:pr-9">
            <label htmlFor={`quantity-${item._key}`} className="sr-only">
              Quantity, {item.product.name}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id={`quantity-${item._key}`}
                name={`quantity-${item._key}`}
                type="number"
                className="w-16"
                value={onUpdateQuantity ? item.quantity : optimisticQuantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              />
              <Button onClick={handleRemoveItem} variant="ghost" size="icon" aria-label="Submit">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
