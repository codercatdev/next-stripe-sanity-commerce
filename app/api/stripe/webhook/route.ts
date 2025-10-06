import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { client } from "@/sanity/lib/client";
import { revalidateTag } from 'next/cache'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

async function syncProductToSanity(product: Stripe.Product) {
  console.log('Syncing product to Sanity:', product.id);

  // Find image asset references
  const imageRefs = await Promise.all(product.images.map(async (imageUrl) => {
    const asset = await client.fetch(`*[_type == 'sanity.imageAsset' && url == $imageUrl][0]`, { imageUrl });
    if (asset) {
      return {
        _key: asset.assetId,
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      };
    }
    return null;
  }));
  const validImageRefs = imageRefs.filter(Boolean);

  // Find default price reference
  let defaultPriceRef = null;
  if (typeof product.default_price === 'string') {
    const price = await client.fetch(`*[_type == 'price' && stripePriceId == $priceId][0]`, { priceId: product.default_price });
    if (price) {
      defaultPriceRef = {
        _type: 'reference',
        _ref: price._id,
      };
    }
  }


  const doc = {
    _id: `stripe-${product.id}`,
    _type: 'product',
    name: product.name,
    slug: { _type: 'slug', current: product.name.toLowerCase().replace(/\s+/g, '-') },
    description: product.description || '',
    stripeProductId: product.id,
    brand: product.metadata.brand || '',
    images: validImageRefs,
    active: product.active,
    default_price: defaultPriceRef,
  }

  await client.createOrReplace(doc)

  // Generate embeddings
  await fetch(`https://fpjavumg.api.sanity.io/v2024-03-14/data/embeddings/production`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
    },
    body: JSON.stringify({
      documents: [
        {
          _id: `stripe-${product.id}`,
          text: `${product.name}. ${product.description}`,
        },
      ],
    }),
  })

  revalidateTag('products')
  revalidateTag(`product_${product.id}`)
}

async function deleteProductFromSanity(productId: string) {
  console.log('Deleting product from Sanity:', productId);
  await client.delete({ query: `*[_type == "product" && stripeProductId == $productId]`, params: { productId } })
  revalidateTag('products')
  revalidateTag(`product_${productId}`)
}

async function syncPriceToSanity(price: Stripe.Price) {
  console.log('Syncing price to Sanity:', price.id);
  const productDoc = await client.fetch('*[_type == "product" && stripeProductId == $productId][0]', {
    productId: price.product,
  })

  if (!productDoc) {
    console.error(`Product with stripeProductId ${price.product} not found.`)
    return
  }

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
  }

  await client.createOrReplace(priceDoc)

  // Update the product's prices array
  await client
    .patch(productDoc._id)
    .setIfMissing({ prices: [] })
    .append('prices', [{ _type: 'reference', _ref: `stripe-${price.id}` }])
    .commit()

  // Check if this price is the default price for the product
  if (productDoc.default_price?._ref === `stripe-${price.id}`) {
    await client
      .patch(productDoc._id)
      .set({ default_price: { _type: 'reference', _ref: `stripe-${price.id}`, } })
      .commit()
  }

  revalidateTag('products')
  revalidateTag(`product_${price.product}`)
}

async function deletePriceFromSanity(price: Stripe.Price) {
  console.log('Deleting price from Sanity:', price.id);
  const priceId = `stripe-${price.id}`;
  const productDoc = await client.fetch('*[_type == "product" && stripeProductId == $productId][0]', {
    productId: price.product,
  });

  if (productDoc) {
    // Remove the price reference from the product's prices array
    await client
      .patch(productDoc._id)
      .unset([`prices[_ref=="${priceId}"]`])
      .commit();

    // If the deleted price was the default, unset it
    if (productDoc.default_price?._ref === priceId) {
      await client
        .patch(productDoc._id)
        .unset(['default_price'])
        .commit();
    }
  }

  // Delete the price document itself
  await client.delete(priceId);

  revalidateTag('products');
  revalidateTag(`product_${price.product}`);
}


export async function POST(req: NextRequest) {
  const signature = (await headers()).get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'product.created':
    case 'product.updated':
      await syncProductToSanity(event.data.object as Stripe.Product)
      break
    case 'product.deleted':
      await deleteProductFromSanity((event.data.object as Stripe.Product).id)
      break
    case 'price.created':
    case 'price.updated':
      await syncPriceToSanity(event.data.object as Stripe.Price)
      break
    case 'price.deleted':
      await deletePriceFromSanity(event.data.object as Stripe.Price)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
