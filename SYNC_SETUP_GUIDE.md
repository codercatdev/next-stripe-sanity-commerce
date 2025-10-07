# Stripe-Sanity Synchronization Setup Guide

This guide explains how to set up bidirectional synchronization between Stripe and Sanity for products and prices.

## Overview

The synchronization system consists of:

1. **Stripe → Sanity**: Stripe webhooks automatically update Sanity when products/prices change
2. **Sanity → Stripe**: Sanity webhooks automatically update Stripe when documents change
3. **Infinite Loop Prevention**: Uses `updatedFromStripe` and `updatedFromSanity` flags

## Setup Steps

### 1. Configure Stripe Webhooks

In your Stripe Dashboard:

1. Go to Developers → Webhooks
2. Create a new webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `product.created`
   - `product.updated` 
   - `product.deleted`
   - `price.created`
   - `price.updated`
   - `price.deleted`
4. Copy the webhook signing secret to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 2. Configure Sanity Webhooks

In your Sanity project dashboard:

1. Go to API → Webhooks
2. Create a new webhook:
   - **URL**: `https://yourdomain.com/api/sanity/webhook`
   - **Dataset**: Your dataset name (usually `production`)
   - **Trigger on**: Create, Update, Delete
   - **Filter**: `_type == "product" || _type == "price"`
   - **Projection**: `{_id, _type, _rev, updatedFromStripe}`
3. Copy the webhook secret to your `.env.local`:
   ```
   SANITY_WEBHOOK_SECRET=your_webhook_secret
   ```

### 3. Environment Variables

Ensure these environment variables are set:

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=skp_...
SANITY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Document Actions in Sanity Studio

The document actions are automatically available in Sanity Studio:

- **Sync to Stripe**: Manually sync a product/price to Stripe
- **Sync from Stripe**: Manually pull data from Stripe

## How It Works

### Stripe to Sanity Flow

1. Product/price changes in Stripe
2. Stripe sends webhook to `/api/stripe/webhook`
3. Webhook handler updates Sanity document with `updatedFromStripe: true`
4. Sanity webhook is triggered but sees the flag and skips Stripe sync
5. Flag is cleared after processing

### Sanity to Stripe Flow

1. Product/price changes in Sanity (without `updatedFromStripe` flag)
2. Sanity sends webhook to `/api/sanity/webhook`
3. Webhook handler updates Stripe and sets `updatedFromSanity: true`
4. Document is patched in Sanity with the flag
5. Flag prevents infinite loop

## Manual Sync Functions

Use these functions in your code for manual synchronization:

```typescript
import { syncProductToStripe, syncPriceToStripe } from '@/sanity/lib/stripe-sync'

// Sync product to Stripe
await syncProductToStripe(productId)

// Sync price to Stripe
await syncPriceToStripe(priceId)
```

## Document Actions

In Sanity Studio, each product and price document has action buttons:

- **Sync to Stripe**: Push current document data to Stripe
- **Sync from Stripe**: Pull latest data from Stripe

## Troubleshooting

### Webhook Not Triggering

1. Check webhook URL is correct and accessible
2. Verify webhook secrets match environment variables
3. Check webhook event types are selected correctly

### Infinite Loops

If you see infinite loops:

1. Check that flags are being set correctly
2. Verify webhook handlers check for flags
3. Ensure flags are cleared after processing

### Data Inconsistency

To force a full sync:

1. Use the "Sync from Stripe" action in Sanity Studio
2. Or call the sync functions manually in your code

## API Endpoints

### Stripe Webhook
- **URL**: `/api/stripe/webhook`
- **Method**: POST
- **Purpose**: Receives Stripe events and updates Sanity

### Sanity Webhook
- **URL**: `/api/sanity/webhook`
- **Method**: POST
- **Purpose**: Receives Sanity changes and updates Stripe

## Testing

To test the synchronization:

1. Create a product in Stripe Dashboard
2. Verify it appears in Sanity Studio
3. Update the product in Sanity Studio
4. Verify changes appear in Stripe Dashboard

## Security Notes

- Webhook endpoints verify signatures
- API tokens should have minimal required permissions
- Use HTTPS for all webhook URLs
- Store secrets securely in environment variables