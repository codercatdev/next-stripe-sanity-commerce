'use client'

import { createContext, useContext, ReactNode } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useAuth } from '@clerk/nextjs'
import { CartQueryResult } from '@/sanity.types'
import {
    getCart,
    removeCartItem,
    updateCartItemQuantity,
    createCheckoutSessionFromCart,
    addToCart
} from '@/app/actions'
import { toast } from 'sonner'

interface CartContextType {
    cart: CartQueryResult | null
    isLoading: boolean
    error: any
    mutate: () => void
    addItem: (productId: string) => Promise<{ error?: string }>
    removeItem: (itemKey: string) => Promise<{ error?: string }>
    updateQuantity: (itemKey: string, quantity: number) => Promise<{ error?: string }>
    checkout: () => Promise<void>
    isUpdating: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Fetcher function for SWR
async function cartFetcher([_, sessionId]: [string, string]) {
    if (!sessionId) return null
    return await getCart(sessionId)
}

// Mutation functions
async function addItemMutation(url: [string, string], { arg }: { arg: { productId: string; sessionId: string } }) {
    return await addToCart(arg.productId, arg.sessionId)
}

async function removeItemMutation(url: [string, string], { arg }: { arg: { cartId: string; itemKey: string } }) {
    return await removeCartItem(arg.cartId, arg.itemKey)
}

async function updateQuantityMutation(url: [string, string], { arg }: { arg: { cartId: string; itemKey: string; quantity: number } }) {
    return await updateCartItemQuantity(arg.cartId, arg.itemKey, arg.quantity)
}

async function checkoutMutation(url: [string, string], { arg }: { arg: { cartId: string } }) {
    return await createCheckoutSessionFromCart(arg.cartId)
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { sessionId } = useAuth()

    // Main cart data fetching
    const {
        data: cart,
        error,
        isLoading,
        mutate
    } = useSWR(
        sessionId ? ['cart', sessionId] : null,
        cartFetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            refreshInterval: 0, // No automatic polling
            dedupingInterval: 2000, // Dedupe requests within 2 seconds
        }
    )

    // Mutations
    const { trigger: triggerAddItem, isMutating: isAddingItem } = useSWRMutation(['cart', sessionId || ''], addItemMutation)
    const { trigger: triggerRemoveItem, isMutating: isRemovingItem } = useSWRMutation(['cart', sessionId || ''], removeItemMutation)
    const { trigger: triggerUpdateQuantity, isMutating: isUpdatingQuantity } = useSWRMutation(['cart', sessionId || ''], updateQuantityMutation)
    const { trigger: triggerCheckout, isMutating: isCheckingOut } = useSWRMutation(['cart', sessionId || ''], checkoutMutation)

    const isUpdating = isAddingItem || isRemovingItem || isUpdatingQuantity || isCheckingOut

    const addItem = async (productId: string): Promise<{ error?: string }> => {
        if (!sessionId) {
            toast.error('Please sign in to add items to cart')
            return { error: 'No session found' }
        }

        try {
            const result = await triggerAddItem({ productId, sessionId })

            if (result?.error) {
                toast.error(result.error)
                return { error: result.error }
            } else {
                toast.success('Added to cart')
                // Mutate to refresh the cart data
                mutate()
                // Dispatch custom event for backward compatibility
                window.dispatchEvent(new CustomEvent('cart-updated'))
                return {}
            }
        } catch (error) {
            toast.error('Failed to add item to cart')
            console.error('Add to cart error:', error)
            return { error: 'Failed to add item to cart' }
        }
    }

    const removeItem = async (itemKey: string): Promise<{ error?: string }> => {
        if (!cart) {
            toast.error('No cart found')
            return { error: 'No cart found' }
        }

        try {
            const result = await triggerRemoveItem({ cartId: cart._id, itemKey })

            if (result?.error) {
                toast.error(result.error)
                return { error: result.error }
            } else {
                toast.success('Item removed')
                mutate()
                return {}
            }
        } catch (error) {
            toast.error('Failed to remove item')
            console.error('Remove item error:', error)
            return { error: 'Failed to remove item' }
        }
    }

    const updateQuantity = async (itemKey: string, quantity: number): Promise<{ error?: string }> => {
        if (!cart) {
            toast.error('No cart found')
            return { error: 'No cart found' }
        }

        if (quantity === 0) {
            return await removeItem(itemKey)
        }

        try {
            const result = await triggerUpdateQuantity({ cartId: cart._id, itemKey, quantity })

            if (result?.error) {
                toast.error(result.error)
                return { error: result.error }
            } else {
                toast.success('Quantity updated')
                mutate()
                return {}
            }
        } catch (error) {
            toast.error('Failed to update quantity')
            console.error('Update quantity error:', error)
            return { error: 'Failed to update quantity' }
        }
    }

    const checkout = async () => {
        if (!cart) {
            toast.error('No cart found')
            return
        }

        try {
            const result = await triggerCheckout({ cartId: cart._id })

            if (result?.error) {
                toast.error(result.error)
            } else if (result?.url) {
                window.location.href = result.url
            }
        } catch (error) {
            toast.error('Failed to start checkout')
            console.error('Checkout error:', error)
        }
    }

    return (
        <CartContext.Provider value={{
            cart: cart || null,
            isLoading,
            error,
            mutate,
            addItem,
            removeItem,
            updateQuantity,
            checkout,
            isUpdating
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}