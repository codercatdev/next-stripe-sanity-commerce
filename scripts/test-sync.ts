/**
 * Test script for Stripe-Sanity synchronization
 * 
 * This script helps test the bidirectional sync between Stripe and Sanity.
 * Run with: npx tsx scripts/test-sync.ts
 */

import Stripe from 'stripe'
import { client } from '@/sanity/lib/client'
import { syncProductToStripe, syncPriceToStripe } from '@/sanity/lib/stripe-sync'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover',
})

async function createTestProduct() {
    console.log('🔄 Creating test product in Stripe...')

    const stripeProduct = await stripe.products.create({
        name: 'Test Sync Product',
        description: 'This is a test product for sync testing',
        metadata: {
            test: 'true',
            syncTest: new Date().toISOString(),
        },
    })

    console.log('✅ Created Stripe product:', stripeProduct.id)

    // Wait a moment for webhook to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if it exists in Sanity
    const sanityProduct = await client.fetch(
        '*[_type == "product" && stripeProductId == $id][0]',
        { id: stripeProduct.id }
    )

    if (sanityProduct) {
        console.log('✅ Product synced to Sanity:', sanityProduct._id)
    } else {
        console.log('❌ Product NOT found in Sanity')
    }

    return { stripeProduct, sanityProduct }
}

async function createTestPrice(productId: string) {
    console.log('🔄 Creating test price in Stripe...')

    const stripePrice = await stripe.prices.create({
        currency: 'usd',
        unit_amount: 1999, // $19.99
        product: productId,
        metadata: {
            test: 'true',
            syncTest: new Date().toISOString(),
        },
    })

    console.log('✅ Created Stripe price:', stripePrice.id)

    // Wait a moment for webhook to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if it exists in Sanity
    const sanityPrice = await client.fetch(
        '*[_type == "price" && stripePriceId == $id][0]',
        { id: stripePrice.id }
    )

    if (sanityPrice) {
        console.log('✅ Price synced to Sanity:', sanityPrice._id)
    } else {
        console.log('❌ Price NOT found in Sanity')
    }

    return { stripePrice, sanityPrice }
}

async function testSanityToStripe() {
    console.log('🔄 Testing Sanity → Stripe sync...')

    // Create product directly in Sanity
    const sanityProduct = await client.create({
        _type: 'product',
        title: 'Test Sanity Product',
        slug: {
            _type: 'slug',
            current: `test-sanity-product-${Date.now()}`,
        },
        description: 'This product was created in Sanity for sync testing',
        active: true,
    })

    console.log('✅ Created Sanity product:', sanityProduct._id)

    try {
        // Manually sync to Stripe
        await syncProductToStripe(sanityProduct as any)
        console.log('✅ Product synced to Stripe')
    } catch (error) {
        console.log('❌ Failed to sync to Stripe:', error)
    }

    return sanityProduct
}

async function testBidirectionalSync() {
    console.log('🔄 Testing bidirectional sync...')

    const { stripeProduct, sanityProduct } = await createTestProduct()

    if (!sanityProduct) {
        console.log('❌ Cannot test bidirectional sync - Sanity product not found')
        return
    }

    // Update in Sanity
    console.log('🔄 Updating product in Sanity...')
    await client
        .patch(sanityProduct._id)
        .set({
            title: 'Updated Test Product',
            description: 'This description was updated in Sanity'
        })
        .commit()

    // Wait for webhook to process
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check if Stripe was updated
    const updatedStripeProduct = await stripe.products.retrieve(stripeProduct.id)

    if (updatedStripeProduct.name === 'Updated Test Product') {
        console.log('✅ Bidirectional sync working!')
    } else {
        console.log('❌ Bidirectional sync failed')
        console.log('Stripe name:', updatedStripeProduct.name)
    }
}

async function cleanup() {
    console.log('🧹 Cleaning up test data...')

    // Delete test products from Sanity
    const testProducts = await client.fetch(
        '*[_type == "product" && (title match "Test*" || title match "*Test*")]'
    )

    for (const product of testProducts) {
        if (product.stripeProductId) {
            try {
                await stripe.products.del(product.stripeProductId)
                console.log('🗑️ Deleted Stripe product:', product.stripeProductId)
            } catch (error) {
                console.log('⚠️ Could not delete Stripe product:', product.stripeProductId)
            }
        }

        await client.delete(product._id)
        console.log('🗑️ Deleted Sanity product:', product._id)
    }

    // Delete test prices from Sanity
    const testPrices = await client.fetch(
        '*[_type == "price" && metadata.test == "true"]'
    )

    for (const price of testPrices) {
        await client.delete(price._id)
        console.log('🗑️ Deleted Sanity price:', price._id)
    }
}

async function main() {
    console.log('🚀 Starting Stripe-Sanity sync tests...\n')

    try {
        // Test 1: Stripe → Sanity
        console.log('=== Test 1: Stripe → Sanity ===')
        await createTestProduct()
        console.log('')

        // Test 2: Sanity → Stripe
        console.log('=== Test 2: Sanity → Stripe ===')
        await testSanityToStripe()
        console.log('')

        // Test 3: Bidirectional sync
        console.log('=== Test 3: Bidirectional Sync ===')
        await testBidirectionalSync()
        console.log('')

        console.log('✅ All tests completed!')

    } catch (error) {
        console.error('❌ Test failed:', error)
    }

    // Cleanup
    console.log('\n=== Cleanup ===')
    await cleanup()

    console.log('\n🎉 Test suite completed!')
}

// Run tests if this file is executed directly
if (require.main === module) {
    main().catch(console.error)
}

export { createTestProduct, createTestPrice, testSanityToStripe, testBidirectionalSync, cleanup }