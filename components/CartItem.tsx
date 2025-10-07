'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { updateCartItemQuantity, removeCartItem } from '@/app/actions'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const currentQuantity = item.quantity || 0
  const [inputValue, setInputValue] = useState(currentQuantity.toString())
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Update input value when item quantity changes (from optimistic updates)
  useEffect(() => {
    setInputValue(currentQuantity.toString())
  }, [currentQuantity])

  const handleRemoveItem = useCallback(async () => {
    // Use provided handler (which should be optimistic)
    if (onRemoveItem) {
      await onRemoveItem(item._key)
      return
    }

    // Fallback - shouldn't normally be used with the new optimistic system
    const result = await removeCartItem(cartId, item._key)
    if (result?.error) {
      toast.error(result.error)
    } else {
      window.dispatchEvent(new CustomEvent('cart-updated'))
    }
  }, [item._key, onRemoveItem, cartId])

  const handleQuantityChange = useCallback(async (newQuantity: number) => {
    if (newQuantity < 0) return // Prevent negative quantities

    // Use provided handler (which should be optimistic)
    if (onUpdateQuantity) {
      await onUpdateQuantity(item._key, newQuantity)
      return
    }

    // Fallback - shouldn't normally be used with the new optimistic system
    if (newQuantity === 0) {
      await handleRemoveItem()
      return
    }

    const result = await updateCartItemQuantity(cartId, item._key, newQuantity)
    if (result?.error) {
      toast.error(result.error)
      // Reset input to actual quantity on error
      setInputValue(currentQuantity.toString())
    } else {
      window.dispatchEvent(new CustomEvent('cart-updated'))
    }
  }, [item._key, onUpdateQuantity, cartId, currentQuantity, handleRemoveItem])

  // Debounced quantity update for input changes
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the actual quantity update by 300ms (shorter for better UX)
    debounceRef.current = setTimeout(() => {
      const numValue = parseInt(value) || 0
      if (numValue !== currentQuantity) {
        handleQuantityChange(numValue)
      }
    }, 300)
  }, [currentQuantity, handleQuantityChange])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <li key={item.product._id} className="flex flex-col gap-2 py-6 sm:py-10 ">
      <div className="flex-shrink-0">
        <div className='w-24 h-24 rounded-md sm:w-48 sm:h-48 flex items-center justify-center overflow-hidden'>
          <ProductImage product={item.product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="relative pr-9 flex sm:gap-x-6 sm:pr-0">
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
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={() => {
                  // On blur, ensure we have a valid quantity and trigger immediate update
                  const numValue = parseInt(inputValue) || 0
                  if (numValue !== currentQuantity) {
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current)
                    }
                    handleQuantityChange(numValue)
                  }
                }}
                min="0"
              />
              <Button onClick={handleRemoveItem} variant="ghost" size="icon" aria-label="Remove item">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
