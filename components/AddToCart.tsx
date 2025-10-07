'use client'

import { addToCart } from '@/app/actions'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { useAuth, SignInButton } from '@clerk/nextjs'
import { ProductsQueryResult } from '@/sanity.types'

export function AddToCart({ product }: { product: ProductsQueryResult[0] }) {
  const { userId, sessionId } = useAuth()

  const handleFormAction = async () => {
    if (!product._id) {
      console.error('Missing product ID:', product)
      toast.error('Product information is missing.')
      return
    }

    if (!sessionId) {
      console.error('Missing session ID')
      toast.error('User session not found. Please try signing out and back in.')
      return
    }

    console.log('Adding product to cart:', { productId: product._id, sessionId })

    const result = await addToCart(product._id, sessionId)
    if (result.error) {
      console.error('Failed to add to cart:', result.error)
      toast.error(result.error)
    } else {
      toast.success('Added to cart')
      window.dispatchEvent(new CustomEvent('cart-updated'))
    }
  }

  if (!userId) {
    return (
      <SignInButton mode="modal">
        <Button>Add to Cart</Button>
      </SignInButton>
    )
  }

  return (
    <form action={handleFormAction}>
      <Button
        type="submit"
      >
        Add to Cart
      </Button>
    </form>
  )
}
