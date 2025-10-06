'use client'

import { createCheckoutSession } from '@/app/actions'
import { SanityProduct } from '@/types'
import { toast } from 'sonner'
import { Button } from './ui/button'

export function BuyNow({ product }: { product: SanityProduct }) {
  const handleFormAction = async () => {
    if (product.priceId) {
      const result = await createCheckoutSession(product.priceId)
      if (result.error) {
        console.error(result.error)
        toast.error(result.error)
      } else if (result.url) {
        window.location.href = result.url
      }
    } else {
      toast.error('Product information is missing.')
    }
  }

  return (
    <form action={handleFormAction}>
      <Button
        type="submit"
      >
        Buy Now
      </Button>
    </form>
  )
}
