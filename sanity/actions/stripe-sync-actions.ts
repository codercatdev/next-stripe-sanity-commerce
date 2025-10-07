import { DocumentActionComponent, DocumentActionsContext } from 'sanity';
import {
    syncProductToStripe,
    syncPriceToStripe,
    deleteProductFromStripe,
    deletePriceFromStripe
} from '../lib/stripe-sync';

/**
 * Custom document action for syncing products to Stripe
 */
export const syncProductAction: DocumentActionComponent = (props) => {
    const { draft, published } = props;
    const doc = draft || published;

    // Only show for product documents
    if (doc?._type !== 'product') {
        return null;
    }

    // Only show if we have the required environment variables (server-side check)
    if (typeof window === 'undefined' && !process.env.STRIPE_SECRET_KEY) {
        return null;
    }

    return {
        label: 'Sync to Stripe',
        icon: () => '🔄',
        onHandle: async () => {
            try {
                await syncProductToStripe(doc as any);
                props.onComplete?.();
                // Show success notification
                console.log('Product synced to Stripe successfully');
            } catch (error) {
                console.error('Failed to sync product to Stripe:', error);
                // Show error alert
                alert(`Failed to sync product to Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
    };
};

/**
 * Custom document action for syncing prices to Stripe
 */
export const syncPriceAction: DocumentActionComponent = (props) => {
    const { draft, published } = props;
    const doc = draft || published;

    // Only show for price documents
    if (doc?._type !== 'price') {
        return null;
    }

    // Only show if we have the required environment variables (server-side check)
    if (typeof window === 'undefined' && !process.env.STRIPE_SECRET_KEY) {
        return null;
    }

    return {
        label: 'Sync to Stripe',
        icon: () => '🔄',
        onHandle: async () => {
            try {
                await syncPriceToStripe(doc as any);
                props.onComplete?.();
                // Show success notification
                console.log('Price synced to Stripe successfully');
            } catch (error) {
                console.error('Failed to sync price to Stripe:', error);
                // Show error alert
                alert(`Failed to sync price to Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
    };
};