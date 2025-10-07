# Next.js PPR Implementation Guide

## Overview

This project has been configured to use Next.js Partial Pre-rendering (PPR) for optimal performance. PPR allows the static parts of pages to be pre-rendered while dynamic content is streamed in.

## Configuration

### 1. Next.js Config
PPR is enabled in `next.config.ts`:
```typescript
experimental: {
  ppr: 'incremental',
}
```

### 2. Fetch Strategy
Two fetch functions are available:

- `sanityFetch` - Traditional fetch with revalidation (60s for published content)
- `sanityFetchPPR` - PPR-optimized fetch without automatic revalidation

### 3. Page Configuration
Pages using PPR must export:
```typescript
export const experimental_ppr = true;
```

## Usage Guidelines

### When to use sanityFetchPPR
Use `sanityFetchPPR` for:
- Content within Suspense boundaries
- Dynamic content that benefits from streaming
- Components that should be part of the PPR strategy

### When to use sanityFetch
Keep using `sanityFetch` for:
- Metadata generation (`generateMetadata`)
- Static content that should be cached with time-based revalidation
- Legacy pages not yet migrated to PPR

### Example Implementation
```typescript
// pages/example/page.tsx
import { Suspense } from "react";
import { sanityFetchPPR } from "@/sanity/lib/fetch-ppr";

export const experimental_ppr = true;

function LoadingState() {
  return <div className="animate-pulse bg-gray-200 h-32 rounded" />;
}

async function DynamicContent() {
  const data = await sanityFetchPPR({ query: myQuery });
  return <div>{data.content}</div>;
}

export default function Page() {
  return (
    <div>
      <h1>Static Header</h1>
      <Suspense fallback={<LoadingState />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

## Benefits

1. **Faster Initial Load**: Static shell renders immediately
2. **SEO Friendly**: Static content available for crawlers
3. **Progressive Enhancement**: Dynamic content streams in progressively
4. **Better UX**: Loading states prevent layout shifts

## Migration Checklist

- [ ] Enable PPR in `next.config.ts`
- [ ] Add `experimental_ppr = true` to pages
- [ ] Wrap dynamic content in Suspense boundaries
- [ ] Replace `sanityFetch` with `sanityFetchPPR` in dynamic components
- [ ] Create appropriate loading components
- [ ] Test streaming behavior in development