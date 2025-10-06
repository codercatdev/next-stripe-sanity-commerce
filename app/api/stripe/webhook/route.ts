import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { client } from "@/sanity/lib/client";
import { revalidateTag } from 'next/cache'

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
}

if (!process.env.SANITY_API_TOKEN) {
  throw new Error('SANITY_API_TOKEN environment variable is required')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

client.config({
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: 'raw',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

async function syncProductToSanity(product: Stripe.Product) {
  console.log(`[WEBHOOK] Starting product sync for product ID: ${product.id}`);
  console.log(`[WEBHOOK] Product details:`, {
    id: product.id,
    name: product.name,
    active: product.active,
    description: product.description?.slice(0, 100) + '...',
    images_count: product.images.length,
    default_price: product.default_price,
    metadata: product.metadata,
    created: product.created,
    updated: product.updated
  });

  if (!product.id) {
    const error = `Product ID is missing or invalid: ${product.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  if (!product.name || product.name.trim() === '') {
    const error = `Product name is missing or empty for product ID: ${product.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  // Find image asset references
  console.log(`[WEBHOOK] Processing ${product.images.length} images for product ${product.id}`);
  const imageRefs = await Promise.all(product.images.map(async (imageUrl, index) => {
    console.log(`[WEBHOOK] Processing image ${index + 1}/${product.images.length}: ${imageUrl}`);

    try {
      const asset = await client.fetch(`*[_type == 'sanity.imageAsset' && url == $imageUrl][0]`, { imageUrl });

      if (asset) {
        console.log(`[WEBHOOK] Found existing image asset for ${imageUrl}:`, {
          _id: asset._id,
          assetId: asset.assetId
        });
        return {
          _key: asset.assetId,
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        };
      } else {
        console.warn(`[WEBHOOK] WARNING: Image asset not found in Sanity for URL: ${imageUrl}`);
        // Don't throw error for missing images, just skip them
        return null;
      }
    } catch (error) {
      console.error(`[WEBHOOK] ERROR: Failed to fetch image asset for ${imageUrl}:`, error);
      return null;
    }
  }));

  const validImageRefs = imageRefs.filter(Boolean);
  console.log(`[WEBHOOK] Found ${validImageRefs.length} valid image references out of ${product.images.length} total images`);

  // Find default price reference
  let defaultPriceRef = null;
  if (typeof product.default_price === 'string') {
    console.log(`[WEBHOOK] Looking up default price: ${product.default_price}`);

    try {
      const price = await client.fetch(`*[_type == 'price' && stripePriceId == $priceId][0]`, { priceId: product.default_price });

      if (price) {
        console.log(`[WEBHOOK] Found default price document:`, {
          _id: price._id,
          stripePriceId: price.stripePriceId,
          unit_amount: price.unit_amount,
          currency: price.currency
        });
        defaultPriceRef = {
          _type: 'reference',
          _ref: price._id,
        };
      } else {
        console.warn(`[WEBHOOK] WARNING: Default price not found in Sanity for price ID: ${product.default_price} - will be updated when price webhook arrives`);
        // Store the Stripe price ID temporarily so we can link it later
        // This will be updated when the price.created webhook processes
      }
    } catch (error) {
      console.error(`[WEBHOOK] ERROR: Failed to fetch default price ${product.default_price}:`, error);
      // Don't throw error for missing price, just log it
    }
  } else {
    console.log(`[WEBHOOK] No default price specified for product ${product.id}`);
  }

  const slugCurrent = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  console.log(`[WEBHOOK] Generated slug for product: ${slugCurrent}`);

  const doc = {
    _id: `stripe-${product.id}`,
    _type: 'product',
    name: product.name,
    slug: { _type: 'slug', current: slugCurrent },
    description: product.description || '',
    stripeProductId: product.id,
    brand: product.metadata.brand || '',
    images: validImageRefs,
    active: product.active,
    default_price: defaultPriceRef,
    // Store the Stripe price ID temporarily if the price document doesn't exist yet
    stripePriceId: !defaultPriceRef && typeof product.default_price === 'string' ? product.default_price : undefined,
  }

  console.log(`[WEBHOOK] Creating/updating Sanity document:`, {
    _id: doc._id,
    _type: doc._type,
    name: doc.name,
    slug: doc.slug.current,
    description: doc.description.slice(0, 100) + '...',
    stripeProductId: doc.stripeProductId,
    brand: doc.brand,
    images_count: doc.images.length,
    active: doc.active,
    has_default_price: !!doc.default_price
  });

  try {
    const result = await client.createOrReplace(doc);
    console.log(`[WEBHOOK] Successfully created/updated product document in Sanity:`, {
      _id: result._id,
      _rev: result._rev
    });
  } catch (error) {
    console.error(`[WEBHOOK] ERROR: Failed to create/update product document in Sanity:`, error);
    throw new Error(`Failed to sync product ${product.id} to Sanity: ${error}`);
  }

  // // Generate embeddings
  // const embeddingText = `${product.name}. ${product.description || ''}`;
  // console.log(`[WEBHOOK] Generating embeddings for product ${product.id} with text: "${embeddingText.slice(0, 100)}..."`);

  // try {
  //   const embeddingResponse = await fetch(`https://fpjavumg.api.sanity.io/v2024-03-14/data/embeddings/production`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
  //     },
  //     body: JSON.stringify({
  //       documents: [
  //         {
  //           _id: `stripe-${product.id}`,
  //           text: embeddingText,
  //         },
  //       ],
  //     }),
  //   });

  //   if (!embeddingResponse.ok) {
  //     const errorText = await embeddingResponse.text();
  //     console.error(`[WEBHOOK] ERROR: Failed to generate embeddings for product ${product.id}:`, {
  //       status: embeddingResponse.status,
  //       statusText: embeddingResponse.statusText,
  //       error: errorText
  //     });
  //     throw new Error(`Failed to generate embeddings: ${embeddingResponse.status} ${errorText}`);
  //   }

  //   const embeddingResult = await embeddingResponse.json();
  //   console.log(`[WEBHOOK] Successfully generated embeddings for product ${product.id}:`, embeddingResult);
  // } catch (error) {
  //   console.error(`[WEBHOOK] ERROR: Failed to generate embeddings for product ${product.id}:`, error);
  //   throw error;
  // }

  console.log(`[WEBHOOK] Revalidating cache tags for product ${product.id}`);
  revalidateTag('products');
  revalidateTag(`product_${product.id}`);

  console.log(`[WEBHOOK] Successfully completed product sync for product ID: ${product.id}`);
}

async function deleteProductFromSanity(productId: string) {
  console.log(`[WEBHOOK] Starting product deletion for product ID: ${productId}`);

  if (!productId || productId.trim() === '') {
    const error = `Product ID is missing or invalid: ${productId}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  // First check if the product exists
  console.log(`[WEBHOOK] Checking if product exists in Sanity: ${productId}`);

  try {
    const existingProducts = await client.fetch(`*[_type == "product" && stripeProductId == $productId]`, { productId });

    console.log(`[WEBHOOK] Found ${existingProducts.length} existing product(s) for stripe ID ${productId}`);

    if (existingProducts.length === 0) {
      const error = `Product with Stripe ID ${productId} not found in Sanity - cannot delete non-existent product`;
      console.error(`[WEBHOOK] ERROR: ${error}`);
      throw new Error(error);
    }

    // Log details of products to be deleted
    existingProducts.forEach((product: any, index: number) => {
      console.log(`[WEBHOOK] Product ${index + 1} to delete:`, {
        _id: product._id,
        name: product.name,
        stripeProductId: product.stripeProductId,
        active: product.active
      });
    });

    // Delete the products
    const deleteResult = await client.delete({
      query: `*[_type == "product" && stripeProductId == $productId]`,
      params: { productId }
    });

    console.log(`[WEBHOOK] Successfully deleted product(s) from Sanity:`, deleteResult);

    console.log(`[WEBHOOK] Revalidating cache tags for deleted product ${productId}`);
    revalidateTag('products');
    revalidateTag(`product_${productId}`);

    console.log(`[WEBHOOK] Successfully completed product deletion for product ID: ${productId}`);

  } catch (error) {
    console.error(`[WEBHOOK] ERROR: Failed to delete product ${productId} from Sanity:`, error);
    throw error;
  }
}

async function syncPriceToSanity(price: Stripe.Price, retryCount = 0) {
  const maxRetries = 3;
  const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s

  console.log(`[WEBHOOK] Starting price sync for price ID: ${price.id} (attempt ${retryCount + 1}/${maxRetries + 1})`);
  console.log(`[WEBHOOK] Price details:`, {
    id: price.id,
    product: price.product,
    unit_amount: price.unit_amount,
    currency: price.currency,
    active: price.active,
    nickname: price.nickname,
    recurring: price.recurring,
    type: price.type,
    created: price.created
  });

  if (!price.id) {
    const error = `Price ID is missing or invalid: ${price.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  if (!price.product) {
    const error = `Product ID is missing for price ${price.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  if (price.unit_amount === null || price.unit_amount === undefined) {
    const error = `Unit amount is missing for price ${price.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  if (!price.currency) {
    const error = `Currency is missing for price ${price.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  console.log(`[WEBHOOK] Looking up product document for Stripe product ID: ${price.product}`);

  try {
    const productDoc = await client.fetch('*[_type == "product" && stripeProductId == $productId][0]', {
      productId: price.product,
    });

    if (!productDoc) {
      if (retryCount < maxRetries) {
        console.warn(`[WEBHOOK] WARNING: Product with stripeProductId ${price.product} not found - retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);

        // Schedule retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return await syncPriceToSanity(price, retryCount + 1);
      } else {
        const error = `Product with stripeProductId ${price.product} not found in Sanity after ${maxRetries + 1} attempts - cannot sync price without existing product`;
        console.error(`[WEBHOOK] ERROR: ${error}`);
        throw new Error(error);
      }
    }

    console.log(`[WEBHOOK] Found product document:`, {
      _id: productDoc._id,
      name: productDoc.name,
      stripeProductId: productDoc.stripeProductId,
      active: productDoc.active
    });

    const priceDoc = {
      _id: `stripe-${price.id}`,
      _type: 'price',
      stripePriceId: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      product: {
        _type: 'reference',
        _ref: productDoc._id,
        _key: productDoc._id,
      },
    };

    console.log(`[WEBHOOK] Creating/updating price document:`, {
      _id: priceDoc._id,
      stripePriceId: priceDoc.stripePriceId,
      unit_amount: priceDoc.unit_amount,
      currency: priceDoc.currency,
      product_ref: priceDoc.product._ref
    });

    const createResult = await client.createOrReplace(priceDoc);
    console.log(`[WEBHOOK] Successfully created/updated price document:`, {
      _id: createResult._id,
      _rev: createResult._rev
    });

    // Update the product's prices array
    console.log(`[WEBHOOK] Updating product ${productDoc._id} with price reference`);

    const patchResult = await client
      .patch(productDoc._id)
      .set({
        default_price: {
          _type: 'reference',
          _ref: `stripe-${price.id}`
        },
        prices: [{
          _type: 'reference',
          _ref: `stripe-${price.id}`,
          _key: `stripe-${price.id}`
        }]
      })
      .unset(['stripePriceId']) // Remove temporary Stripe price ID field
      .commit();

    console.log(`[WEBHOOK] Successfully updated product with price reference:`, {
      _id: patchResult._id,
      _rev: patchResult._rev
    });

    // Check if there are other products waiting for this price (in case of duplicate default_price)
    console.log(`[WEBHOOK] Checking for other products waiting for price ${price.id}`);
    const waitingProducts = await client.fetch(
      '*[_type == "product" && stripePriceId == $priceId]',
      { priceId: price.id }
    );

    if (waitingProducts.length > 0) {
      console.log(`[WEBHOOK] Found ${waitingProducts.length} products waiting for price ${price.id}`);

      // Update all waiting products
      const updatePromises = waitingProducts.map(async (waitingProduct: any) => {
        console.log(`[WEBHOOK] Updating waiting product ${waitingProduct._id} with price reference`);

        return client
          .patch(waitingProduct._id)
          .set({
            default_price: {
              _type: 'reference',
              _ref: `stripe-${price.id}`
            }
          })
          .unset(['stripePriceId'])
          .commit();
      });

      await Promise.all(updatePromises);
      console.log(`[WEBHOOK] Successfully updated all waiting products with price reference`);
    }

    console.log(`[WEBHOOK] Revalidating cache tags for price ${price.id} and product ${price.product}`);
    revalidateTag('products');
    revalidateTag(`product_${price.product}`);

    console.log(`[WEBHOOK] Successfully completed price sync for price ID: ${price.id}`);

  } catch (error) {
    console.error(`[WEBHOOK] ERROR: Failed to sync price ${price.id} to Sanity:`, error);
    throw error;
  }
}

async function deletePriceFromSanity(price: Stripe.Price) {
  console.log(`[WEBHOOK] Starting price deletion for price ID: ${price.id}`);
  console.log(`[WEBHOOK] Price deletion details:`, {
    id: price.id,
    product: price.product,
    unit_amount: price.unit_amount,
    currency: price.currency
  });

  if (!price.id) {
    const error = `Price ID is missing or invalid: ${price.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  if (!price.product) {
    const error = `Product ID is missing for price deletion ${price.id}`;
    console.error(`[WEBHOOK] ERROR: ${error}`);
    throw new Error(error);
  }

  const priceId = `stripe-${price.id}`;
  console.log(`[WEBHOOK] Sanity price document ID to delete: ${priceId}`);

  try {
    // First check if the price exists in Sanity
    console.log(`[WEBHOOK] Checking if price exists in Sanity: ${priceId}`);
    const existingPrice = await client.fetch(`*[_id == $priceId][0]`, { priceId });

    if (!existingPrice) {
      const error = `Price with ID ${priceId} not found in Sanity - cannot delete non-existent price`;
      console.error(`[WEBHOOK] ERROR: ${error}`);
      throw new Error(error);
    }

    console.log(`[WEBHOOK] Found existing price document:`, {
      _id: existingPrice._id,
      stripePriceId: existingPrice.stripePriceId,
      unit_amount: existingPrice.unit_amount,
      currency: existingPrice.currency
    });

    // Look up the product document
    console.log(`[WEBHOOK] Looking up product document for Stripe product ID: ${price.product}`);
    const productDoc = await client.fetch('*[_type == "product" && stripeProductId == $productId][0]', {
      productId: price.product,
    });

    if (productDoc) {
      console.log(`[WEBHOOK] Found product document:`, {
        _id: productDoc._id,
        name: productDoc.name,
        stripeProductId: productDoc.stripeProductId,
        default_price_ref: productDoc.default_price?._ref
      });

      // Remove the price reference from the product's prices array
      console.log(`[WEBHOOK] Removing price reference from product's prices array`);
      const unsetPricesResult = await client
        .patch(productDoc._id)
        .unset([`prices[_ref=="${priceId}"]`])
        .commit();

      console.log(`[WEBHOOK] Successfully removed price from product's prices array:`, {
        _id: unsetPricesResult._id,
        _rev: unsetPricesResult._rev
      });

      // If the deleted price was the default, unset it
      if (productDoc.default_price?._ref === priceId) {
        console.log(`[WEBHOOK] Deleted price was the default price, removing default_price reference`);
        const unsetDefaultResult = await client
          .patch(productDoc._id)
          .unset(['default_price'])
          .commit();

        console.log(`[WEBHOOK] Successfully removed default price reference:`, {
          _id: unsetDefaultResult._id,
          _rev: unsetDefaultResult._rev
        });
      } else {
        console.log(`[WEBHOOK] Deleted price was not the default price, no need to update default_price`);
      }
    } else {
      console.warn(`[WEBHOOK] WARNING: Product with stripeProductId ${price.product} not found - cannot update product references`);
      // Don't fail if product doesn't exist, just log warning
    }

    // Delete the price document itself
    console.log(`[WEBHOOK] Deleting price document: ${priceId}`);
    const deleteResult = await client.delete(priceId);
    console.log(`[WEBHOOK] Successfully deleted price document:`, deleteResult);

    console.log(`[WEBHOOK] Revalidating cache tags for price ${price.id} and product ${price.product}`);
    revalidateTag('products');
    revalidateTag(`product_${price.product}`);

    console.log(`[WEBHOOK] Successfully completed price deletion for price ID: ${price.id}`);

  } catch (error) {
    console.error(`[WEBHOOK] ERROR: Failed to delete price ${price.id} from Sanity:`, error);
    throw error;
  }
}


export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[WEBHOOK] ==================== START REQUEST ${requestId} ====================`);
  console.log(`[WEBHOOK] Request received at: ${new Date().toISOString()}`);
  console.log(`[WEBHOOK] Request URL: ${req.url}`);
  console.log(`[WEBHOOK] Request method: ${req.method}`);

  let signature: string | null = null;
  let body: string = '';
  let event: Stripe.Event;

  try {
    // Get and validate headers
    console.log(`[WEBHOOK] Getting request headers...`);
    const headersList = await headers();
    signature = headersList.get('stripe-signature');

    console.log(`[WEBHOOK] Headers received:`, {
      'content-type': headersList.get('content-type'),
      'content-length': headersList.get('content-length'),
      'user-agent': headersList.get('user-agent'),
      'stripe-signature': signature ? `${signature.substring(0, 20)}...` : 'MISSING'
    });

    if (!signature) {
      const error = 'Missing stripe-signature header';
      console.error(`[WEBHOOK] ERROR: ${error}`);
      return NextResponse.json({
        error,
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get request body
    console.log(`[WEBHOOK] Reading request body...`);
    body = await req.text();

    console.log(`[WEBHOOK] Request body details:`, {
      length: body.length,
      preview: body.substring(0, 200) + '...'
    });

    if (!body) {
      const error = 'Empty request body';
      console.error(`[WEBHOOK] ERROR: ${error}`);
      return NextResponse.json({
        error,
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Construct and verify webhook event
    console.log(`[WEBHOOK] Constructing webhook event with secret: ${webhookSecret.substring(0, 10)}...`);
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`[WEBHOOK] Successfully constructed webhook event:`, {
      id: event.id,
      type: event.type,
      created: event.created,
      livemode: event.livemode,
      api_version: event.api_version,
      object: event.object,
      request_id: event.request?.id,
      idempotency_key: event.request?.idempotency_key
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorDetails = {
      message: errorMessage,
      name: err instanceof Error ? err.name : 'Unknown',
      stack: err instanceof Error ? err.stack : undefined,
      signature_present: !!signature,
      body_length: body.length,
      webhook_secret_present: !!webhookSecret,
      requestId,
      timestamp: new Date().toISOString()
    };

    console.error(`[WEBHOOK] ERROR: Webhook signature verification failed:`, errorDetails);

    return NextResponse.json({
      error: 'Webhook signature verification failed',
      details: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  // Handle the event
  console.log(`[WEBHOOK] Processing event type: ${event.type}`);

  try {
    switch (event.type) {
      case 'product.created':
        console.log(`[WEBHOOK] Handling product.created event for product: ${(event.data.object as Stripe.Product).id}`);
        await syncProductToSanity(event.data.object as Stripe.Product);
        break;

      case 'product.updated':
        console.log(`[WEBHOOK] Handling product.updated event for product: ${(event.data.object as Stripe.Product).id}`);
        await syncProductToSanity(event.data.object as Stripe.Product);
        break;

      case 'product.deleted':
        const deletedProduct = event.data.object as Stripe.Product;
        console.log(`[WEBHOOK] Handling product.deleted event for product: ${deletedProduct.id}`);
        await deleteProductFromSanity(deletedProduct.id);
        break;

      case 'price.created':
        console.log(`[WEBHOOK] Handling price.created event for price: ${(event.data.object as Stripe.Price).id}`);
        await syncPriceToSanity(event.data.object as Stripe.Price);
        break;

      case 'price.updated':
        console.log(`[WEBHOOK] Handling price.updated event for price: ${(event.data.object as Stripe.Price).id}`);
        await syncPriceToSanity(event.data.object as Stripe.Price);
        break;

      case 'price.deleted':
        console.log(`[WEBHOOK] Handling price.deleted event for price: ${(event.data.object as Stripe.Price).id}`);
        await deletePriceFromSanity(event.data.object as Stripe.Price);
        break;

      default:
        console.log(`[WEBHOOK] WARNING: Unhandled event type: ${event.type}`);
        console.log(`[WEBHOOK] Event data:`, {
          id: event.id,
          type: event.type,
          object_id: (event.data.object as any)?.id,
          created: event.created
        });
    }

    const processingTime = Date.now() - startTime;
    console.log(`[WEBHOOK] Successfully processed event ${event.type} for ${event.id}`);
    console.log(`[WEBHOOK] Processing completed in ${processingTime}ms`);
    console.log(`[WEBHOOK] ==================== END REQUEST ${requestId} ====================`);

    return NextResponse.json({
      received: true,
      eventType: event.type,
      eventId: event.id,
      requestId,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown processing error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      eventType: event.type,
      eventId: event.id,
      requestId,
      processingTime,
      timestamp: new Date().toISOString()
    };

    console.error(`[WEBHOOK] ERROR: Failed to process webhook event:`, errorDetails);
    console.log(`[WEBHOOK] ==================== ERROR END REQUEST ${requestId} ====================`);

    // Return 500 error to make Stripe retry the webhook
    return NextResponse.json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      eventType: event.type,
      eventId: event.id,
      requestId,
      processingTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
