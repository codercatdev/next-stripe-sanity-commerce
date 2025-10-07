'use client'

import { Button } from './ui/button'
import { useAuth, SignInButton } from '@clerk/nextjs'
import { ProductsQueryResult } from '@/sanity.types'
import { useCart } from '@/contexts/CartContext'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export function AddToCart({ product }: { product: ProductsQueryResult[0] }) {
  const { userId } = useAuth()
  const { addItem, isUpdating } = useCart()
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToCart = async () => {
    if (!product._id) {
      console.error('Missing product ID:', product)
      return
    }

    setIsLoading(true)
    try {
      await addItem(product._id)
    } finally {
      setIsLoading(false)
    }
  }

  if (!userId) {
    return (
      <SignInButton mode="modal">
        <Button>Add to Cart</Button>
      </SignInButton>
    )
  }

  const loading = isLoading || isUpdating

  return (
    <Button
      onClick={handleAddToCart}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Adding...
        </>
      ) : (
        'Add to Cart'
      )}
    </Button>
  )
}
