# Sanity-Stripe Synchronization

This project implements bidirectional synchronization betwedefineField({
  namdefineField({
  name: 'updatedFromStripe', 
  title: 'Updated from Stripe',
  type: 'boolean',
  hidden: true,
  readOnly: true,
  description: 'Internal flag to prevent infinite sync loops with Stripe webhooks'
}),tedFromStripe',
  title: 'Updated from Stripe',
  type: 'boolean',
  hidden: true,
  readOnly: true,
  description: 'Internal flag to prevent infinite sync loops with Stripe webhooks'
}),y CMS and Stripe for products and prices. The system prevents infinite loops and ensures data consistency across both platforms.

## Overview

The synchronization system consists of several components:

1. **Stripe Webhook** (`/app/api/stripe/webhook/route.ts`) - Handles updates from Stripe
2. **Sanity Webhook** (`/app/api/sanity/webhook/route.ts`) - Handles updates from Sanity
3. **Sync Functions** (`/sanity/lib/stripe-sync.ts`) - Core synchronization logic
4. **Document Actions** (`/sanity/actions/stripe-sync-actions.ts`) - Manual sync buttons in Sanity Studio
5. **Loop Prevention** - Uses `updatedFromStripe` flag to prevent infinite synchronization loops

## Setup

### Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Sanity
SANITY_API_TOKEN=sk...
SANITY_WEBHOOK_SECRET=your-webhook-secret

# Sanity Public (already configured)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

### Stripe Webhook Configuration

1. In your Stripe Dashboard, go to **Developers > Webhooks**
2. Create a new webhook endpoint pointing to: `https://yourdomain.com/api/stripe/webhook`
3. Select the following events:
   - `product.created`
   - `product.updated` 
   - `product.deleted`
   - `price.created`
   - `price.updated`
   - `price.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Sanity Webhook Configuration

1. In your Sanity project dashboard, go to **API > Webhooks**
2. Create a new webhook with:
   - **URL**: `https://yourdomain.com/api/sanity/webhook`
   - **Dataset**: Your dataset (e.g., `production`)
   - **Trigger on**: Create, Update, Delete
   - **Filter**: `_type == "product" || _type == "price"`
   - **Secret**: Set a secret and add it to `SANITY_WEBHOOK_SECRET`

## How It Works

### Infinite Loop Prevention

The system uses an `updatedFromStripe` flag to prevent infinite synchronization loops:

1. When Stripe updates a document via webhook, the flag is set to `true`
2. Sanity webhook checks this flag and skips sync if `true`
3. The flag is automatically cleared after 2-5 seconds
4. Similarly, when Sanity updates go to Stripe, they include metadata to identify the source

### Data Flow

#### Stripe → Sanity
1. Change occurs in Stripe (product/price created/updated/deleted)
2. Stripe sends webhook to `/api/stripe/webhook`
3. Document is created/updated in Sanity with `updatedFromStripe: true`
4. Flag is cleared after 2 seconds

#### Sanity → Stripe
1. Change occurs in Sanity (product/price created/updated/deleted)
2. Sanity sends webhook to `/api/sanity/webhook`
3. If `updatedFromStripe` is not true, sync to Stripe
4. Stripe API is called with metadata indicating Sanity origin

## Manual Synchronization

For manual synchronization, use the "Sync to Stripe" button available in the Sanity Studio document actions for both products and prices.

## Document Schema Changes

The following fields were added to support synchronization:

### Product Schema
```typescript
defineField({
  name: '_updatedFromStripe',
  title: 'Updated from Stripe',
  type: 'boolean',
  hidden: true,
  readOnly: true,
  description: 'Internal flag to prevent infinite sync loops with Stripe webhooks'
})
```

### Price Schema
```typescript
defineField({
  name: '_updatedFromStripe', 
  title: 'Updated from Stripe',
  type: 'boolean',
  hidden: true,
  readOnly: true,
  description: 'Internal flag to prevent infinite sync loops with Stripe webhooks'
})
```

## API Endpoints

### `/api/stripe/webhook`
- Handles Stripe webhook events
- Syncs Stripe changes to Sanity
- Sets `updatedFromStripe` flag to prevent loops

### `/api/sanity/webhook`
- Handles Sanity webhook events
- Syncs Sanity changes to Stripe
- Respects `updatedFromStripe` flag to prevent loops

## Troubleshooting

### Infinite Loops
If you experience infinite synchronization loops:
1. Check that webhook signatures are properly verified
2. Ensure the `updatedFromStripe` flag is being set correctly
3. Verify webhook endpoints are not being triggered multiple times
4. Check console logs for flag clearing operations

### Failed Synchronization
If synchronization fails:
1. Check environment variables are properly set
2. Verify webhook endpoints are accessible
3. Check Stripe and Sanity API credentials
4. Review console logs for detailed error messages

### Missing Data
If data is not syncing:
1. Verify webhook events are being received
2. Check that the correct events are selected in Stripe dashboard
3. Ensure Sanity webhook filter is correctly configured
4. Verify API permissions for both Stripe and Sanity

## Development

For local development:
1. Use ngrok or similar tool to expose your local server
2. Update webhook URLs in both Stripe and Sanity dashboards
3. Monitor console logs for synchronization activities
4. Test with sample products and prices

## Security Considerations

1. **Webhook Verification**: All webhooks verify signatures using shared secrets
2. **API Tokens**: Use environment variables for all sensitive credentials
3. **HTTPS Required**: Both webhook endpoints require HTTPS in production
4. **Rate Limiting**: Consider implementing rate limiting for webhook endpoints

## Logging

The system provides comprehensive logging:
- `[WEBHOOK]` - Stripe webhook operations
- `[SANITY_WEBHOOK]` - Sanity webhook operations  
- `[SANITY_SYNC]` - Sanity to Stripe sync operations

All logs include request IDs for tracing and processing times for performance monitoring.