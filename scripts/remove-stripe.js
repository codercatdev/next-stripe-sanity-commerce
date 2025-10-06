// scripts/seed-data.js
require('dotenv').config({ path: '.env.local' });

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});


async function remove() {
  console.log('Removing Stripe Prices');
  const prices = await stripe.prices.list({ limit: 100 });
  for (const price of prices.data) {
    await stripe.prices.update(price.id, { active: false });
    console.log(`Deleted price: ${price.id}`);
  }
  console.log('Removing Stripe Products');
  const products = await stripe.products.list({ limit: 100 });
  for (const product of products.data) {
    await stripe.products.update(product.id, { active: false });
    console.log(`Deleted product: ${product.id}`);
  }
  console.log('Removal complete!');
}

remove().catch((err) => {
  console.error(err);
  process.exit(1);
});