// scripts/seed-data.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('next-sanity');

const Stripe = require('stripe');
const { faker } = require('@faker-js/faker');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

const sanityClient = createClient({
  projectId: 'fpjavumg',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const brands = Array.from({ length: 3 }, () => {
  const name = faker.commerce.productAdjective();
  return {
    _type: 'collection',
    name: name,
    slug: { current: name.toLowerCase().replace(/ /g, '-') },
  };
});

const products = [
  {
    name: faker.commerce.product(),
    description: faker.commerce.productDescription({ category: 'shoes' }),
    price: faker.commerce.price({ dec: 0 }),
    brand: brands[0].name,
    imageUrls: [faker.image.urlPicsumPhotos({ category: 'shoes', width: 400, height: 400 })],
  },
  {
    name: faker.commerce.product(),
    description: faker.commerce.productDescription({ category: 'shoes' }),
    price: faker.commerce.price({ dec: 0 }),
    brand: brands[1].name,
    imageUrls: [faker.image.urlPicsumPhotos({ category: 'shoes', width: 400, height: 400 })],
  },
  {
    name: faker.commerce.product(),
    description: faker.commerce.productDescription({ category: 'shoes' }),
    price: faker.commerce.price({ dec: 0 }),
    brand: brands[2].name,
    imageUrls: [faker.image.urlPicsumPhotos({ category: 'shoes', width: 400, height: 400 })],
  },
  {
    name: faker.commerce.product(),
    description: faker.commerce.productDescription({ category: 'shoes' }),
    price: faker.commerce.price({ dec: 0 }),
    brand: brands[0].name,
    imageUrls: [faker.image.urlPicsumPhotos({ category: 'shoes', width: 400, height: 400 })],
  },
  {
    name: faker.commerce.product(),
    description: faker.commerce.productDescription({ category: 'shoes' }),
    price: faker.commerce.price({ dec: 0 }),
    brand: brands[1].name,
    imageUrls: [faker.image.urlPicsumPhotos({ category: 'shoes', width: 400, height: 400 })],
  },
];

async function uploadImage(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return sanityClient.assets.upload('image', buffer, {
    filename: url.split('/').pop(),
  });
}

async function seed() {
  console.log('Seeding data...');

  // Seed brands (collections) in Sanity
  console.log('Seeding brands in Sanity...');
  for (const brand of brands) {
    const doc = { ...brand, _id: `brand-${brand.name.toLowerCase()}` };
    await sanityClient.createOrReplace(doc);
  }
  console.log('Sanity brands seeded.');

  // Seed products in Stripe
  console.log('Seeding products in Stripe...');
  for (const product of products) {
    console.log('Creating images', product.imageUrls);
    const imageAssets = await Promise.all(product.imageUrls.map(uploadImage));
    const sanityImageUrls = imageAssets.map(asset => asset.url);
    const body = {
      name: product.name,
      description: product.description,
      images: sanityImageUrls,
      default_price_data: {
        currency: 'usd',
        unit_amount: product.price,
      },
      metadata: {
        brand: product.brand,
      },
    }
    console.log('Body', JSON.stringify(body, null, 2));
    const stripeProduct = await stripe.products.create(body);
    console.log(`Created product: ${stripeProduct.name}`);
  }
  console.log('Stripe products seeded.');

  console.log('Seeding complete!');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});