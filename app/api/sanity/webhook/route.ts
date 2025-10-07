import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import {
    syncProductToStripe,
    syncPriceToStripe,
    deleteProductFromStripe,
    deletePriceFromStripe
} from '@/sanity/lib/stripe-sync';

// Validate required environment variables
if (!process.env.SANITY_WEBHOOK_SECRET) {
    console.warn('SANITY_WEBHOOK_SECRET environment variable is not set. Webhook signature verification will be disabled.');
}

interface SanityWebhookPayload {
    _type: 'product' | 'price';
    _id: string;
    _rev: string;
    _updatedAt?: string;
    _createdAt?: string;
    name?: string;
    description?: string;
    slug?: { current: string };
    images?: Array<{
        _type: 'image';
        asset: { _ref: string };
    }>;
    brand?: string;
    active?: boolean;
    featured?: boolean;
    stripeProductId?: string;
    default_price?: { _ref: string };
    prices?: Array<{ _ref: string }>;
    stripePriceId?: string;
    unit_amount?: number;
    currency?: string;
    product?: { _ref: string };
}

interface SanityWebhookEvent {
    eventId?: string;
    projectId?: string;
    dataset?: string;
    sanityDocument?: SanityWebhookPayload;
    transition?: 'appear' | 'update' | 'disappear';
    // Alternative fields that Sanity might use
    _id?: string;
    _type?: string;
    _rev?: string;
    documentId?: string;
    [key: string]: any; // Allow any additional fields
}

// Note: Using Sanity's webhook toolkit for signature verification

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    console.log(`[SANITY_WEBHOOK] ==================== START REQUEST ${requestId} ====================`);
    console.log(`[SANITY_WEBHOOK] Request received at: ${new Date().toISOString()}`);
    console.log(`[SANITY_WEBHOOK] Request URL: ${req.url}`);

    let body: string = '';
    let event: SanityWebhookEvent;

    try {
        // Get request headers
        const headersList = await headers();
        const signature = headersList.get(SIGNATURE_HEADER_NAME) || headersList.get('sanity-webhook-signature');

        console.log(`[SANITY_WEBHOOK] Headers received:`, {
            'content-type': headersList.get('content-type'),
            'content-length': headersList.get('content-length'),
            'user-agent': headersList.get('user-agent'),
            [SIGNATURE_HEADER_NAME]: signature ? `${signature.substring(0, 20)}...` : 'MISSING'
        });

        // Get request body
        body = await req.text();
        console.log(`[SANITY_WEBHOOK] Request body length: ${body.length}`);

        if (!body) {
            console.error(`[SANITY_WEBHOOK] ERROR: Empty request body`);
            return NextResponse.json({
                error: 'Empty request body',
                requestId,
                timestamp: new Date().toISOString()
            }, { status: 400 });
        }

        // Verify webhook signature if secret is configured
        if (process.env.SANITY_WEBHOOK_SECRET && signature) {
            console.log(`[SANITY_WEBHOOK] Attempting signature verification with signature: ${signature.substring(0, 30)}...`);
            const isValid = isValidSignature(body, signature, process.env.SANITY_WEBHOOK_SECRET);
            if (!isValid) {
                console.error(`[SANITY_WEBHOOK] ERROR: Invalid webhook signature`);
                return NextResponse.json({
                    error: 'Invalid webhook signature',
                    requestId,
                    timestamp: new Date().toISOString()
                }, { status: 401 });
            } else {
                console.log(`[SANITY_WEBHOOK] Webhook signature verified successfully`);
            }
        } else {
            console.warn(`[SANITY_WEBHOOK] WARNING: Webhook signature verification skipped - no secret configured or signature missing`);
        }

        // Parse webhook payload
        console.log(`[SANITY_WEBHOOK] Raw body preview:`, body.substring(0, 200) + '...');
        event = JSON.parse(body);

        console.log(`[SANITY_WEBHOOK] Full parsed event:`, JSON.stringify(event, null, 2));

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[SANITY_WEBHOOK] ERROR: Failed to parse webhook payload:`, {
            error: errorMessage,
            bodyLength: body.length,
            requestId,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            error: 'Failed to parse webhook payload',
            details: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        }, { status: 400 });
    }

    // Handle the event
    console.log(`[SANITY_WEBHOOK] Processing event: ${event.transition} for ${event.sanityDocument?._type}`);

    // Declare variables that will be used in error handling
    let document = event.sanityDocument;
    let transition = event.transition;

    try {
        // If no sanityDocument, check if the event itself is the document
        if (!document && event._type) {
            console.log(`[SANITY_WEBHOOK] Using event as document (direct format)`);
            document = event as any;

            // Try to determine transition from context or default to 'update'
            transition = transition || 'update';
        }

        if (!document) {
            console.log(`[SANITY_WEBHOOK] No document found in event, skipping processing`);
            return NextResponse.json({
                received: true,
                message: 'No document to process',
                requestId,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`[SANITY_WEBHOOK] Document found:`, {
            _type: document._type,
            _id: document._id,
            transition: transition
        });

        // Note: We always sync from Sanity to Stripe for content updates
        // Stripe webhook handles intelligent syncing back to Sanity only when pricing changes

        switch (transition) {
            case 'appear':
                if (document._type === 'product') {
                    console.log(`[SANITY_WEBHOOK] Product created, syncing to Stripe: ${document._id}`);
                    await syncProductToStripe(document as any);
                } else if (document._type === 'price') {
                    console.log(`[SANITY_WEBHOOK] Price created, syncing to Stripe: ${document._id}`);
                    await syncPriceToStripe(document as any);
                }
                break;

            case 'update':
                if (document._type === 'product') {
                    console.log(`[SANITY_WEBHOOK] Product updated, syncing to Stripe: ${document._id}`);
                    await syncProductToStripe(document as any);
                } else if (document._type === 'price') {
                    console.log(`[SANITY_WEBHOOK] Price updated, syncing to Stripe: ${document._id}`);
                    await syncPriceToStripe(document as any);
                }
                break;

            case 'disappear':
                if (document._type === 'product' && document.stripeProductId) {
                    console.log(`[SANITY_WEBHOOK] Product deleted, archiving in Stripe: ${document.stripeProductId}`);
                    await deleteProductFromStripe(document.stripeProductId);
                } else if (document._type === 'price' && document.stripePriceId) {
                    console.log(`[SANITY_WEBHOOK] Price deleted, archiving in Stripe: ${document.stripePriceId}`);
                    await deletePriceFromStripe(document.stripePriceId);
                }
                break;

            default:
                console.log(`[SANITY_WEBHOOK] WARNING: Unhandled or missing transition type: ${transition}`);
                // For unknown transitions, try to sync anyway if it's a product or price
                if (document._type === 'product') {
                    console.log(`[SANITY_WEBHOOK] Attempting product sync with unknown transition: ${document._id}`);
                    await syncProductToStripe(document as any);
                } else if (document._type === 'price') {
                    console.log(`[SANITY_WEBHOOK] Attempting price sync with unknown transition: ${document._id}`);
                    await syncPriceToStripe(document as any);
                }
        }

        const processingTime = Date.now() - startTime;
        console.log(`[SANITY_WEBHOOK] Successfully processed ${transition} event for ${document._type}`);
        console.log(`[SANITY_WEBHOOK] Processing completed in ${processingTime}ms`);
        console.log(`[SANITY_WEBHOOK] ==================== END REQUEST ${requestId} ====================`);

        return NextResponse.json({
            received: true,
            transition: transition,
            documentType: document._type,
            documentId: document._id,
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
            transition: transition || event.transition,
            documentType: event.sanityDocument?._type || event._type,
            documentId: event.sanityDocument?._id || event._id,
            requestId,
            processingTime,
            timestamp: new Date().toISOString()
        };

        console.error(`[SANITY_WEBHOOK] ERROR: Failed to process webhook event:`, errorDetails);
        console.log(`[SANITY_WEBHOOK] ==================== ERROR END REQUEST ${requestId} ====================`);

        return NextResponse.json({
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            transition: transition || event.transition,
            documentType: event.sanityDocument?._type || event._type,
            documentId: event.sanityDocument?._id || event._id,
            requestId,
            processingTime,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}