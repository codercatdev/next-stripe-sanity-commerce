"use server";

import { draftMode } from "next/headers";
import Stripe from 'stripe'
import { client, writeClient, realtimeClient } from "@/sanity/lib/client";
import { cartByIdQuery, cartQuery } from "@/sanity/lib/queries";
import { Cart, CartByIdQueryResult, CartQueryResult } from "@/sanity.types";

export async function disableDraftMode() {
  "use server";
  await Promise.allSettled([
    (await draftMode()).disable(),
    // Simulate a delay to show the loading state
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
}


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})


export async function createCheckoutSession(priceId: string): Promise<{ url?: string; error?: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
    })

    if (session.url) {
      return { url: session.url };
    } else {
      return { error: 'Failed to create checkout session' };
    }
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create checkout session' };
  }
}

export async function addToCart(productId: string, userId: string): Promise<{ error?: string }> {
  try {
    // Validate inputs
    if (!productId || !userId) {
      return { error: 'Missing product ID or user ID' }
    }

    // Check if write token is configured
    if (!process.env.SANITY_API_TOKEN) {
      console.error('Missing SANITY_API_TOKEN environment variable')
      return { error: 'Server configuration error' }
    }

    console.log('Adding to cart:', { productId, userId })

    const cart = await client.fetch('*[_type == "cart" && userId == $userId][0]', { userId })

    if (cart) {
      console.log('Found existing cart:', cart._id)
      const productIndex = cart.items?.findIndex((item: { product: { _ref: string } }) => item.product._ref === productId) ?? -1

      if (productIndex > -1) {
        console.log('Incrementing existing item quantity')
        await writeClient
          .patch(cart._id)
          .inc({ [`items[${productIndex}].quantity`]: 1 })
          .commit()
      } else {
        console.log('Adding new item to cart')
        await writeClient
          .patch(cart._id)
          .append('items', [{
            _key: `item-${Date.now()}`,
            product: { _type: 'reference', _ref: productId },
            quantity: 1
          }])
          .commit()
      }
    } else {
      console.log('Creating new cart')
      await writeClient.create({
        _type: 'cart',
        userId,
        items: [{
          _key: `item-${Date.now()}`,
          product: { _type: 'reference', _ref: productId },
          quantity: 1
        }],
      })
    }

    console.log('Successfully added to cart')
    return {}
  } catch (error) {
    console.error('Detailed error adding to cart:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart'
    return { error: errorMessage }
  }
}

export async function updateCartItemQuantity(cartId: string, itemId: string, quantity: number): Promise<{ error?: string }> {
  try {
    // Validate inputs
    if (!cartId || !itemId || quantity < 0) {
      return { error: 'Invalid parameters' }
    }

    console.log('Updating cart item quantity:', { cartId, itemId, quantity })

    const result = await writeClient
      .patch(cartId)
      .set({ [`items[_key=="${itemId}"].quantity`]: quantity })
      .commit()

    console.log('Update result:', result)
    return {}
  } catch (error) {
    console.error('Update quantity error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update cart item quantity'
    return { error: errorMessage }
  }
}

export async function removeCartItem(cartId: string, itemId: string): Promise<{ error?: string }> {
  try {
    // Validate inputs
    if (!cartId || !itemId) {
      return { error: 'Invalid parameters' }
    }

    console.log('Removing cart item:', { cartId, itemId })

    const result = await writeClient
      .patch(cartId)
      .unset([`items[_key=="${itemId}"]`])
      .commit()

    console.log('Remove result:', result)
    return {}
  } catch (error) {
    console.error('Remove item error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove cart item'
    return { error: errorMessage }
  }
}

export async function getCart(userId: string): Promise<CartQueryResult | null> {
  try {
    if (!userId) {
      console.log('No userId provided for cart fetch')
      return null
    }

    console.log('Fetching cart for userId:', userId);

    // Use realtimeClient instead of client to bypass CDN cache and get fresh data
    const cart = await realtimeClient.fetch(cartQuery, { userId });

    if (cart) {
      console.log('Cart found:', cart._id, 'with', cart.items?.length || 0, 'items');
    } else {
      console.log('No cart found for user:', userId);
    }

    return cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}


// Batch update cart items for better performance
export async function batchUpdateCartItems(
  cartId: string,
  updates: Array<{ itemKey: string; quantity: number }>
): Promise<{ error?: string }> {
  try {
    if (!cartId || !updates.length) {
      return { error: 'Invalid parameters' }
    }

    console.log('Batch updating cart items:', { cartId, updates })

    let patch = writeClient.patch(cartId)

    // Apply all updates in a single transaction
    updates.forEach(({ itemKey, quantity }) => {
      if (quantity > 0) {
        patch = patch.set({ [`items[_key=="${itemKey}"].quantity`]: quantity })
      } else {
        patch = patch.unset([`items[_key=="${itemKey}"]`])
      }
    })

    const result = await patch.commit()
    console.log('Batch update result:', result)
    return {}
  } catch (error) {
    console.error('Batch update error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to batch update cart items'
    return { error: errorMessage }
  }
}

export async function createCheckoutSessionFromCart(cartId: string): Promise<{ url?: string; error?: string }> {
  try {
    const cart = await client.fetch(
      cartByIdQuery,
      { cartId }
    )

    if (!cart || !cart.items || cart.items.length === 0) {
      return { error: 'Cart is empty' }
    }

    const lineItems = cart.items
      .filter((item) => item.product && item.product.priceId && item.quantity)
      .map((item) => ({
        price: item.product!.priceId!,
        quantity: item.quantity!,
      }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
    })

    if (session.url) {
      return { url: session.url };
    } else {
      return { error: 'Failed to create checkout session' };
    }
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create checkout session' };
  }
}
