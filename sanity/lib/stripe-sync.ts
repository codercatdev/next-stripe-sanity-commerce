import Stripe from 'stripe';
import { SanityDocument } from 'sanity';
import { writeClient } from './client';

// Lazy initialization of Stripe to avoid build-time errors
let stripe: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripe) {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        stripe = new Stripe(apiKey, {
            apiVersion: '2025-09-30.clover',
        });
    }
    return stripe;
}

interface ProductDocument extends SanityDocument {
    _type: 'product';
    name: string;
    description?: string;
    slug: { current: string };
    images: Array<{
        _type: 'image';
        asset: { _ref: string };
    }>;
    brand?: string;
    active: boolean;
    featured?: boolean;
    stripeProductId?: string;
    default_price?: { _ref: string };
    prices?: Array<{ _ref: string }>;
}

interface PriceDocument extends SanityDocument {
    _type: 'price';
    stripePriceId: string;
    unit_amount: number;
    currency: string;
    product: { _ref: string };
}

/**
 * Sync a Sanity product document to Stripe
 */
export async function syncProductToStripe(productDoc: ProductDocument): Promise<void> {
    console.log(`[SANITY_SYNC] Starting product sync to Stripe for document: ${productDoc._id}`);

    // Note: Always sync content updates from Sanity to Stripe
    // Stripe webhook handles intelligent reverse sync only for pricing changes

    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
        console.warn(`[SANITY_SYNC] WARNING: Attempting to sync to Stripe from client side - skipping`);
        throw new Error('Stripe sync can only be performed on the server side');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error(`[SANITY_SYNC] ERROR: STRIPE_SECRET_KEY not configured`);
        throw new Error('Stripe secret key not configured');
    }

    try {
        // Get image URLs from Sanity assets
        const imageUrls: string[] = [];
        if (productDoc.images && productDoc.images.length > 0) {
            console.log(`[SANITY_SYNC] Processing ${productDoc.images.length} images`);

            for (const image of productDoc.images) {
                try {
                    const asset = await writeClient.fetch(
                        `*[_id == $assetId][0]{url}`,
                        { assetId: image.asset._ref }
                    );
                    if (asset?.url) {
                        imageUrls.push(asset.url);
                    }
                } catch (error) {
                    console.warn(`[SANITY_SYNC] WARNING: Failed to fetch image asset ${image.asset._ref}:`, error);
                }
            }
        }

        const stripeProductData: Stripe.ProductCreateParams | Stripe.ProductUpdateParams = {
            name: productDoc.name,
            description: productDoc.description || '',
            images: imageUrls,
            active: productDoc.active,
            metadata: {
                sanity_id: productDoc._id,
                brand: productDoc.brand || '',
                updated_from_sanity: 'true', // Flag to identify updates from Sanity
            },
        };

        let stripeProduct: Stripe.Product;

        if (productDoc.stripeProductId) {
            // Update existing Stripe product
            console.log(`[SANITY_SYNC] Updating existing Stripe product: ${productDoc.stripeProductId}`);
            stripeProduct = await getStripe().products.update(
                productDoc.stripeProductId,
                stripeProductData as Stripe.ProductUpdateParams
            );
        } else {
            // Create new Stripe product
            console.log(`[SANITY_SYNC] Creating new Stripe product`);
            stripeProduct = await getStripe().products.create(stripeProductData as Stripe.ProductCreateParams);

            // Update Sanity document with Stripe product ID
            await writeClient
                .patch(productDoc._id)
                .set({ stripeProductId: stripeProduct.id })
                .commit();
        }

        console.log(`[SANITY_SYNC] Successfully synced product to Stripe:`, {
            sanity_id: productDoc._id,
            stripe_id: stripeProduct.id,
            name: stripeProduct.name
        });

    } catch (error) {
        console.error(`[SANITY_SYNC] ERROR: Failed to sync product to Stripe:`, error);
        throw error;
    }
}

/**
 * Sync a Sanity price document to Stripe
 */
export async function syncPriceToStripe(priceDoc: PriceDocument): Promise<void> {
    console.log(`[SANITY_SYNC] Starting price sync to Stripe for document: ${priceDoc._id}`);

    // Note: Always sync pricing updates from Sanity to Stripe
    // Stripe webhook handles intelligent reverse sync only when pricing actually differs

    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
        console.warn(`[SANITY_SYNC] WARNING: Attempting to sync to Stripe from client side - skipping`);
        throw new Error('Stripe sync can only be performed on the server side');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error(`[SANITY_SYNC] ERROR: STRIPE_SECRET_KEY not configured`);
        throw new Error('Stripe secret key not configured');
    }

    try {
        // Get the associated product document to find Stripe product ID
        const productDoc = await writeClient.fetch(
            `*[_id == $productId][0]{stripeProductId}`,
            { productId: priceDoc.product._ref }
        );

        if (!productDoc?.stripeProductId) {
            console.error(`[SANITY_SYNC] ERROR: Associated product has no Stripe product ID`);
            throw new Error('Associated product must be synced to Stripe first');
        }

        if (priceDoc.stripePriceId) {
            // Update existing Stripe price
            console.log(`[SANITY_SYNC] Updating existing Stripe price: ${priceDoc.stripePriceId}`);
            await getStripe().prices.update(priceDoc.stripePriceId, {
                metadata: {
                    sanity_id: priceDoc._id,
                    updated_from_sanity: 'true', // Flag to identify updates from Sanity
                },
            });
        } else {
            // Create new Stripe price
            console.log(`[SANITY_SYNC] Creating new Stripe price`);
            const stripePrice = await getStripe().prices.create({
                product: productDoc.stripeProductId,
                unit_amount: priceDoc.unit_amount,
                currency: priceDoc.currency,
                metadata: {
                    sanity_id: priceDoc._id,
                    updated_from_sanity: 'true', // Flag to identify updates from Sanity
                },
            });

            // Update Sanity document with Stripe price ID
            await writeClient
                .patch(priceDoc._id)
                .set({ stripePriceId: stripePrice.id })
                .commit();

            console.log(`[SANITY_SYNC] Successfully created new Stripe price:`, {
                sanity_id: priceDoc._id,
                stripe_id: stripePrice.id,
                unit_amount: stripePrice.unit_amount,
                currency: stripePrice.currency
            });
        }

    } catch (error) {
        console.error(`[SANITY_SYNC] ERROR: Failed to sync price to Stripe:`, error);
        throw error;
    }
}

/**
 * Delete a product from Stripe when deleted from Sanity
 */
export async function deleteProductFromStripe(stripeProductId: string): Promise<void> {
    console.log(`[SANITY_SYNC] Deleting product from Stripe: ${stripeProductId}`);

    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
        console.warn(`[SANITY_SYNC] WARNING: Attempting to delete from Stripe from client side - skipping`);
        throw new Error('Stripe operations can only be performed on the server side');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error(`[SANITY_SYNC] ERROR: STRIPE_SECRET_KEY not configured`);
        throw new Error('Stripe secret key not configured');
    }

    try {
        // Archive the product in Stripe (products cannot be permanently deleted)
        await getStripe().products.update(stripeProductId, {
            active: false,
            metadata: {
                deleted_from_sanity: 'true',
                deleted_at: new Date().toISOString(),
            },
        });

        console.log(`[SANITY_SYNC] Successfully archived Stripe product: ${stripeProductId}`);

    } catch (error) {
        console.error(`[SANITY_SYNC] ERROR: Failed to delete product from Stripe:`, error);
        throw error;
    }
}

/**
 * Archive a price in Stripe when deleted from Sanity
 */
export async function deletePriceFromStripe(stripePriceId: string): Promise<void> {
    console.log(`[SANITY_SYNC] Archiving price in Stripe: ${stripePriceId}`);

    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
        console.warn(`[SANITY_SYNC] WARNING: Attempting to archive price from client side - skipping`);
        throw new Error('Stripe operations can only be performed on the server side');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error(`[SANITY_SYNC] ERROR: STRIPE_SECRET_KEY not configured`);
        throw new Error('Stripe secret key not configured');
    }

    try {
        // Archive the price in Stripe (prices cannot be permanently deleted)
        await getStripe().prices.update(stripePriceId, {
            active: false,
            metadata: {
                deleted_from_sanity: 'true',
                deleted_at: new Date().toISOString(),
            },
        });

        console.log(`[SANITY_SYNC] Successfully archived Stripe price: ${stripePriceId}`);

    } catch (error) {
        console.error(`[SANITY_SYNC] ERROR: Failed to archive price in Stripe:`, error);
        throw error;
    }
}