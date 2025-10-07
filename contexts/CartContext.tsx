'use client'

import { createContext, useContext, ReactNode, useOptimistic, useCallback, startTransition } from 'react'
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

interface CartItem {
    _key: string
    quantity: number
    product: {
        _id: string
        name?: string
        description?: string
        slug?: string
        price?: number
        image?: any
    }
}

interface OptimizedCart {
    _id: string
    userId: string
    items?: CartItem[]
    _optimisticTimestamp?: number
}

type CartAction =
    | { type: 'ADD_ITEM'; productId: string; optimisticKey?: string }
    | { type: 'REMOVE_ITEM'; itemKey: string }
    | { type: 'UPDATE_QUANTITY'; itemKey: string; quantity: number }
    | { type: 'RESET' }

interface CartContextType {
    cart: CartQueryResult | null
    optimisticCart: OptimizedCart | null
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

// Optimistic cart reducer
function optimisticCartReducer(cart: OptimizedCart | null, action: CartAction): OptimizedCart | null {
    if (!cart && action.type !== 'ADD_ITEM') return cart

    switch (action.type) {
        case 'ADD_ITEM': {
            if (!cart) {
                // Create a new optimistic cart
                return {
                    _id: 'temp-cart',
                    userId: 'temp-user',
                    _optimisticTimestamp: Date.now(),
                    items: [{
                        _key: action.optimisticKey || `temp-${Date.now()}`,
                        quantity: 1,
                        product: {
                            _id: action.productId,
                            name: 'Loading...',
                        }
                    }]
                }
            }

            const existingItemIndex = cart.items?.findIndex(item =>
                item.product._id === action.productId
            ) ?? -1

            if (existingItemIndex > -1) {
                // Increment existing item quantity
                const newItems = [...(cart.items || [])]
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + 1
                }
                return { ...cart, items: newItems, _optimisticTimestamp: Date.now() }
            } else {
                // Add new item
                return {
                    ...cart,
                    _optimisticTimestamp: Date.now(),
                    items: [
                        ...(cart.items || []),
                        {
                            _key: action.optimisticKey || `temp-${Date.now()}`,
                            quantity: 1,
                            product: {
                                _id: action.productId,
                                name: 'Loading...',
                            }
                        }
                    ]
                }
            }
        }

        case 'REMOVE_ITEM': {
            if (!cart) return null
            return {
                ...cart,
                _optimisticTimestamp: Date.now(),
                items: cart.items?.filter(item => item._key !== action.itemKey) || []
            }
        }

        case 'UPDATE_QUANTITY': {
            if (!cart) return null

            if (action.quantity === 0) {
                // Remove item if quantity is 0
                return {
                    ...cart,
                    _optimisticTimestamp: Date.now(),
                    items: cart.items?.filter(item => item._key !== action.itemKey) || []
                }
            }

            return {
                ...cart,
                _optimisticTimestamp: Date.now(),
                items: cart.items?.map(item =>
                    item._key === action.itemKey
                        ? { ...item, quantity: action.quantity }
                        : item
                ) || []
            }
        }

        case 'RESET': {
            return cart
        }

        default:
            return cart
    }
}

// Fetcher function for SWR
async function cartFetcher([_, userId]: [string, string]) {
    if (!userId) return null
    return await getCart(userId)
}

// Mutation functions with improved error handling
async function addItemMutation(url: [string, string], { arg }: { arg: { productId: string; userId: string } }) {
    const result = await addToCart(arg.productId, arg.userId)
    if (result.error) {
        throw new Error(result.error)
    }
    return result
}

async function removeItemMutation(url: [string, string], { arg }: { arg: { cartId: string; itemKey: string } }) {
    const result = await removeCartItem(arg.cartId, arg.itemKey)
    if (result.error) {
        throw new Error(result.error)
    }
    return result
}

async function updateQuantityMutation(url: [string, string], { arg }: { arg: { cartId: string; itemKey: string; quantity: number } }) {
    const result = await updateCartItemQuantity(arg.cartId, arg.itemKey, arg.quantity)
    if (result.error) {
        throw new Error(result.error)
    }
    return result
}

async function checkoutMutation(url: [string, string], { arg }: { arg: { cartId: string } }) {
    return await createCheckoutSessionFromCart(arg.cartId)
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { userId } = useAuth()

    // Main cart data fetching
    const {
        data: cart,
        error,
        isLoading,
        mutate
    } = useSWR(
        userId ? ['cart', userId] : null,
        cartFetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            refreshInterval: 0, // No automatic polling
            dedupingInterval: 1000, // Dedupe requests within 1 second
            keepPreviousData: true, // Keep showing previous data while refetching
        }
    )

    // Convert cart to OptimizedCart format
    const optimizedCart: OptimizedCart | null = cart ? {
        _id: cart._id,
        userId: cart.userId || userId || '',
        items: cart.items?.map(item => ({
            _key: item._key,
            quantity: item.quantity || 0,
            product: {
                _id: item.product?._id || '',
                name: item.product?.name || undefined,
                description: item.product?.description || undefined,
                slug: item.product?.slug || undefined,
                price: item.product?.price || undefined,
                image: item.product?.image || undefined,
            }
        })) || []
    } : null

    // Optimistic state management - simpler approach that doesn't fight with real updates
    const [optimisticCart, dispatch] = useOptimistic(
        optimizedCart,
        optimisticCartReducer
    )

    // Mutations with better error handling and optimistic updates
    const { trigger: triggerAddItem, isMutating: isAddingItem } = useSWRMutation(['cart', userId || ''], addItemMutation, {
        populateCache: false,
        revalidate: false, // Don't automatically revalidate - let optimistic updates handle it
    })
    const { trigger: triggerRemoveItem, isMutating: isRemovingItem } = useSWRMutation(['cart', userId || ''], removeItemMutation, {
        populateCache: false,
        revalidate: false, // Don't automatically revalidate - let optimistic updates handle it
    })
    const { trigger: triggerUpdateQuantity, isMutating: isUpdatingQuantity } = useSWRMutation(['cart', userId || ''], updateQuantityMutation, {
        populateCache: false,
        revalidate: false, // Don't automatically revalidate - let optimistic updates handle it
    })
    const { trigger: triggerCheckout, isMutating: isCheckingOut } = useSWRMutation(['cart', userId || ''], checkoutMutation)

    // Combined loading state for any cart operation (but not for optimistic updates)
    const isUpdating = isCheckingOut

    const addItem = useCallback(async (productId: string): Promise<{ error?: string }> => {
        if (!userId) {
            toast.error('Please sign in to add items to cart')
            return { error: 'No user found' }
        }

        // Optimistic update
        const optimisticKey = `optimistic-${Date.now()}`
        startTransition(() => {
            dispatch({ type: 'ADD_ITEM', productId, optimisticKey })
        })

        try {
            await triggerAddItem({ productId, userId })
            // Immediately revalidate to get fresh data from server
            await mutate()
            toast.success('Added to cart')
            // Dispatch custom event for backward compatibility
            window.dispatchEvent(new CustomEvent('cart-updated'))
            return {}
        } catch (error) {
            // Rollback optimistic update on error
            await mutate()
            const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart'
            toast.error(errorMessage)
            console.error('Add to cart error:', error)
            return { error: errorMessage }
        }
    }, [userId, triggerAddItem, mutate, dispatch])

    const removeItem = useCallback(async (itemKey: string): Promise<{ error?: string }> => {
        if (!optimisticCart) {
            toast.error('No cart found')
            return { error: 'No cart found' }
        }

        // Optimistic update
        startTransition(() => {
            dispatch({ type: 'REMOVE_ITEM', itemKey })
        })

        try {
            await triggerRemoveItem({ cartId: optimisticCart._id, itemKey })
            // Immediately revalidate to get fresh data from server
            await mutate()
            toast.success('Item removed')
            return {}
        } catch (error) {
            // Rollback optimistic update on error
            await mutate()
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove item'
            toast.error(errorMessage)
            console.error('Remove item error:', error)
            return { error: errorMessage }
        }
    }, [optimisticCart, triggerRemoveItem, mutate, dispatch])

    const updateQuantity = useCallback(async (itemKey: string, quantity: number): Promise<{ error?: string }> => {
        if (!optimisticCart) {
            toast.error('No cart found')
            return { error: 'No cart found' }
        }

        // Optimistic update
        startTransition(() => {
            dispatch({ type: 'UPDATE_QUANTITY', itemKey, quantity })
        })

        if (quantity === 0) {
            // For zero quantity, we use remove logic
            try {
                await triggerRemoveItem({ cartId: optimisticCart._id, itemKey })
                // Immediately revalidate to get fresh data from server
                await mutate()
                toast.success('Item removed')
                return {}
            } catch (error) {
                // Rollback optimistic update on error
                await mutate()
                const errorMessage = error instanceof Error ? error.message : 'Failed to remove item'
                toast.error(errorMessage)
                console.error('Remove item error:', error)
                return { error: errorMessage }
            }
        }

        try {
            await triggerUpdateQuantity({ cartId: optimisticCart._id, itemKey, quantity })
            // Immediately revalidate to get fresh data from server
            await mutate()
            // Don't show toast for quantity updates as they happen frequently
            return {}
        } catch (error) {
            // Rollback optimistic update on error
            await mutate()
            const errorMessage = error instanceof Error ? error.message : 'Failed to update quantity'
            toast.error(errorMessage)
            console.error('Update quantity error:', error)
            return { error: errorMessage }
        }
    }, [optimisticCart, triggerUpdateQuantity, triggerRemoveItem, mutate, dispatch])

    const checkout = useCallback(async () => {
        if (!optimisticCart) {
            toast.error('No cart found')
            return
        }

        try {
            const result = await triggerCheckout({ cartId: optimisticCart._id })

            if (result?.error) {
                toast.error(result.error)
            } else if (result?.url) {
                window.location.href = result.url
            }
        } catch (error) {
            toast.error('Failed to start checkout')
            console.error('Checkout error:', error)
        }
    }, [optimisticCart, triggerCheckout])

    return (
        <CartContext.Provider value={{
            cart: cart || null,
            optimisticCart,
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