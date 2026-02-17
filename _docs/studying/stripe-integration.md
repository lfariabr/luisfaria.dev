# Stripe Integration — Study & Implementation Blueprint

> **Version**: v3.0 | `feature/stripe-payments`
> **Goal**: Add two Stripe payment options to luisfaria.dev — "Buy me a coffee" (5 AUD) and "Hire me for a meeting" (150 AUD).

---

## 1. Stripe Core Concepts

### Products vs Prices

Stripe separates **what** you sell from **how much** it costs:

- **Product** — the thing being sold (e.g., "Coffee", "Meeting"). Has a name, description, and optional image. Created once in the Stripe Dashboard.
- **Price** — a specific pricing configuration attached to a Product (e.g., 5.00 AUD one-time). A Product can have multiple Prices (different currencies, recurring vs one-time). Each Price gets a unique `price_xxx` ID that you reference in code.

For our use case:

| Product | Price | Type | Price ID |
|---------|-------|------|----------|
| Buy me a coffee | 5.00 AUD | One-time | `price_coffee_xxx` |
| Hire me for a meeting | 150.00 AUD | One-time | `price_meeting_xxx` |

### Checkout Sessions vs Payment Intents

Stripe offers two main payment flows:

| Feature | Checkout Sessions | Payment Intents |
|---------|------------------|-----------------|
| UI hosting | Stripe hosts the entire page | You build your own form |
| Frontend SDK | Not required (redirect only) | Requires `@stripe/stripe-js` + `@stripe/react-stripe-js` |
| Apple Pay / Google Pay | Automatic | Manual configuration |
| PCI compliance | Minimal (SAQ A) | More complex (SAQ A-EP) |
| Customization | Limited (branding, colors) | Full control |
| Implementation effort | Low | High |

**We pick Checkout Sessions** because:
- No frontend Stripe SDK needed — just redirect to Stripe's hosted page
- Apple Pay, Google Pay, and other wallets work automatically
- Minimal PCI scope
- Perfect for simple, fixed-price payments (we have exactly 2 products)
- Already used this approach successfully in Wedstack

### Webhooks

After a customer completes payment on Stripe's hosted page, Stripe sends a **webhook** event to your server. This is the only reliable way to confirm payment — you can't trust the success redirect alone (user could visit the URL directly).

Key webhook events for our use case:
- `checkout.session.completed` — payment succeeded, fulfill the order
- `checkout.session.expired` — session expired without payment (cleanup)

Webhook security:
- Stripe signs every webhook payload with a secret (`whsec_xxx`)
- You verify the signature using `stripe.webhooks.constructEvent(rawBody, sig, secret)`
- The raw body must be preserved exactly — no JSON parsing beforehand

### Lessons from Wedstack

From the Groomzila/Wedstack project (see `_docs/devTo/t2_2025/Groomzila.md`):

- Created 4 Stripe Products with live payments (gifts)
- Integrated Apple Pay, PayID (AU bank transfer), Pix (BR instant payment), and credit cards
- Stack was Next.js + GraphQL + MongoDB — identical to luisfaria.dev
- Successfully went live with real transactions
- **Key learning**: Stripe's Checkout Sessions handle all the payment method complexity — you just create a session and redirect

---

## 2. Architecture Decision

### How It Fits the Existing Stack

```
Browser → "Buy me a coffee" button click
    ↓
Next.js (CSR) → Apollo Client → GraphQL mutation: createCheckoutSession
    ↓
Apollo Server (port 4000) → stripe.service.ts → Stripe API
    ↓
Returns { sessionId, url } → Browser redirects to Stripe Checkout
    ↓
Customer pays on Stripe's hosted page
    ↓
Stripe sends webhook POST → Express route /stripe/webhook
    ↓
stripe.ts route → Verify signature → Log payment / send notification
    ↓
Stripe redirects customer to /payment/success?session_id={CHECKOUT_SESSION_ID}
```

### Why the Webhook Is an Express Route (Not GraphQL)

Stripe webhooks send a `POST` with a raw JSON body and a `Stripe-Signature` header. To verify the signature, you need the **exact raw bytes** of the request body. This requires `express.raw()` middleware.

GraphQL endpoints use `express.json()` which parses the body into a JavaScript object, destroying the raw bytes. There's no way to recover them after parsing.

Solution: Mount a dedicated Express route **before** the JSON body parser:

```
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));  // raw body
app.use(express.json());                                                  // everything else
app.use('/graphql', expressMiddleware(server, { context }));
```

This follows the same pattern as `backend/src/routes/health.ts` — a plain Express Router, separate from GraphQL.

### Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment flow | Checkout Sessions | No frontend SDK, Stripe hosts the page, wallets automatic |
| Session creation | GraphQL mutation | Consistent with existing patterns, user-initiated action |
| Webhook handler | Express route | Needs `express.raw()` for signature verification |
| Service pattern | Single file `stripe.ts` | Small surface area, matches `resendMailer.ts` pattern |
| Product catalog | Hardcoded in service | Only 2 fixed products, no need for dynamic Price API calls |
| Auth for mutation | Public (no auth) | Visitors should pay without logging in |
| Button placement | Homepage hero + `/support` page | Max visibility on hero, detailed context on dedicated page |

---

## 3. Backend Plan

### 3.1 Service — `backend/src/services/stripe.ts`

Follows the `resendMailer.ts` pattern: singleton SDK client, null-guard on missing key, test-mode early return.

```typescript
import Stripe from 'stripe';
import config from '../config/config';

const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

// Hardcoded product catalog — only 2 fixed-price items
const PRODUCTS = {
  coffee: {
    priceId: config.stripeCoffeePriceId,
    name: 'Buy me a coffee',
    amount: 500, // in cents
    currency: 'aud',
  },
  meeting: {
    priceId: config.stripeMeetingPriceId,
    name: 'Hire me for a meeting',
    amount: 15000,
    currency: 'aud',
  },
} as const;

type ProductKey = keyof typeof PRODUCTS;

export async function createCheckoutSession(
  productKey: ProductKey,
  customerEmail?: string
): Promise<{ sessionId: string; url: string }> {
  if (process.env.NODE_ENV === 'test') {
    return { sessionId: 'test_session_id', url: 'https://checkout.stripe.com/test' };
  }
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const product = PRODUCTS[productKey];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: product.priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment/cancel`,
    customer_email: customerEmail || undefined,
    metadata: {
      productKey,
      source: 'luisfaria.dev',
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripeWebhookSecret
  );
}
```

### 3.2 GraphQL Types — `backend/src/schemas/types/stripeTypes.ts`

Follows `screamTypes.ts` pattern:

```typescript
export const stripeTypes = `#graphql
  type StripeCheckoutSession {
    sessionId: String!
    url: String!
  }

  input CheckoutInput {
    productKey: String!
    email: String
  }

  extend type Mutation {
    createCheckoutSession(input: CheckoutInput!): StripeCheckoutSession!
  }
`;
```

Register in `backend/src/schemas/typeDefs.ts`:

```typescript
import { stripeTypes } from './types/stripeTypes';

const typeDefs = [
  // ... existing types
  stripeTypes,
];
```

### 3.3 Resolver — `backend/src/resolvers/stripe/mutations.ts`

Follows the `createErrorHandler` + `Errors` pattern from `backend/src/utils/errors/`:

```typescript
import { createCheckoutSession } from '../../services/stripe';
import { Errors } from '../../utils/errors';

export const stripeMutations = {
  Mutation: {
    createCheckoutSession: async (
      _parent: unknown,
      { input }: { input: { productKey: string; email?: string } }
    ) => {
      const { productKey, email } = input;

      // Validate productKey
      if (!['coffee', 'meeting'].includes(productKey)) {
        throw Errors.badInput(`Invalid product key: ${productKey}`);
      }

      try {
        const session = await createCheckoutSession(
          productKey as 'coffee' | 'meeting',
          email
        );
        return session;
      } catch (error) {
        throw Errors.internal('Failed to create checkout session');
      }
    },
  },
};
```

Register in `backend/src/resolvers/index.ts`:

```typescript
import { stripeMutations } from './stripe/mutations';
// Add to resolvers array
```

### 3.4 Webhook Route — `backend/src/routes/stripe.ts`

Follows the `routes/health.ts` pattern:

```typescript
import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../services/stripe';

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    const event = verifyWebhookSignature(req.body, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { id: string; customer_email: string; metadata: Record<string, string> };
        console.log(`Payment succeeded: ${session.id}`, {
          email: session.customer_email,
          product: session.metadata.productKey,
        });
        // Future: send Discord notification, confirmation email
        break;
      }
      case 'checkout.session.expired': {
        console.log('Checkout session expired:', event.data.object);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

export default router;
```

### 3.5 Mount in `backend/src/index.ts`

The webhook route needs `express.raw()` **before** `express.json()`:

```typescript
import stripeRoutes from './routes/stripe';

// Mount BEFORE express.json()
app.use('/stripe', express.raw({ type: 'application/json' }), stripeRoutes);

// Existing middleware
app.use(express.json());
app.use(cookieParser());
// ...
```

### 3.6 Config — `backend/src/config/config.ts`

Add to the `Config` interface and config object:

```typescript
interface Config {
  // ... existing fields
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeCoffeePriceId: string;
  stripeMeetingPriceId: string;
  frontendUrl: string;
}

// In requiredEnvVars array (or optional, with fallbacks):
// For dev, these can be empty — the service null-guards on stripeSecretKey

const config: Config = {
  // ... existing
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeCoffeePriceId: process.env.STRIPE_COFFEE_PRICE_ID || '',
  stripeMeetingPriceId: process.env.STRIPE_MEETING_PRICE_ID || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
```

> **Note**: Don't add Stripe keys to `requiredEnvVars` — the app should boot without Stripe configured. The service null-guards gracefully, matching how `resendMailer.ts` handles a missing `RESEND_API_KEY`.

### 3.7 Zod Validation — `backend/src/validation/schemas/stripe.schema.ts`

Follows `scream.schema.ts` pattern:

```typescript
import { z } from 'zod';

export const checkoutInputSchema = z.object({
  productKey: z.enum(['coffee', 'meeting'], {
    errorMap: () => ({ message: 'Product must be "coffee" or "meeting"' }),
  }),
  email: z.string().email('Invalid email address').optional(),
});
```

### 3.8 Shield Rules — `backend/src/validation/shield.ts`

The checkout mutation should be **public** (visitors pay without logging in), but validated:

```typescript
import { checkoutInputSchema } from './schemas/stripe.schema';

const validateCheckoutInput = rule({ cache: 'no_cache' })(
  validateInput(checkoutInputSchema, 'input')
);

export const permissions = shield({
  // ... existing
  Mutation: {
    // ... existing
    createCheckoutSession: validateCheckoutInput, // public, but validated
  },
});
```

---

## 4. Frontend Plan

### 4.1 GraphQL Mutation — `frontend/src/lib/graphql/mutations/stripe.mutations.ts`

Follows `scream.mutations.ts` pattern:

```typescript
import { gql } from '@apollo/client';

export const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSession($input: CheckoutInput!) {
    createCheckoutSession(input: $input) {
      sessionId
      url
    }
  }
`;
```

### 4.2 Payment Button — `frontend/src/components/stripe/PaymentButton.tsx`

A self-contained button that triggers a Checkout Session and redirects:

```tsx
"use client";

import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { CREATE_CHECKOUT_SESSION } from '@/lib/graphql/mutations/stripe.mutations';

interface PaymentButtonProps {
  productKey: 'coffee' | 'meeting';
  label: string;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function PaymentButton({
  productKey,
  label,
  variant = 'default',
  className,
}: PaymentButtonProps) {
  const [createSession, { loading }] = useMutation(CREATE_CHECKOUT_SESSION, {
    onCompleted: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.createCheckoutSession.url;
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      // Could use toast notification here
    },
  });

  const handleClick = () => {
    createSession({
      variables: {
        input: { productKey },
      },
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? 'Redirecting...' : label}
    </Button>
  );
}
```

### 4.3 Success Page — `frontend/src/app/payment/success/page.tsx`

```tsx
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Thank you!</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was successful. I truly appreciate your support!
        </p>
        <Link href="/" className="text-primary underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

### 4.4 Cancel Page — `frontend/src/app/payment/cancel/page.tsx`

```tsx
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Payment cancelled</h1>
        <p className="text-muted-foreground mb-6">
          No worries — you can always come back later.
        </p>
        <Link href="/" className="text-primary underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

### 4.5 Support Page — `frontend/src/app/support/page.tsx`

A dedicated page with context about both payment options:

```tsx
import { PaymentButton } from '@/components/stripe/PaymentButton';

export default function SupportPage() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Support My Work</h1>
        <p className="text-muted-foreground mb-12">
          If you enjoy what I build, consider supporting me with a coffee
          or booking a meeting to discuss your project.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Coffee Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-2">Buy me a coffee</h2>
            <p className="text-3xl font-bold mb-2">$5 AUD</p>
            <p className="text-muted-foreground mb-6">
              A small gesture that keeps me fueled and coding.
            </p>
            <PaymentButton productKey="coffee" label="Buy a coffee" />
          </div>

          {/* Meeting Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-2">Hire me for a meeting</h2>
            <p className="text-3xl font-bold mb-2">$150 AUD</p>
            <p className="text-muted-foreground mb-6">
              1-hour consultation — architecture review, code audit,
              career advice, or project planning.
            </p>
            <PaymentButton productKey="meeting" label="Book a meeting" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.6 Homepage Hero Integration

Add CTA buttons to the existing hero section in `frontend/src/app/page.tsx`:

```tsx
import { PaymentButton } from '@/components/stripe/PaymentButton';

// In the hero section, alongside existing content:
<div className="flex gap-4">
  <PaymentButton productKey="coffee" label="Buy me a coffee" variant="outline" />
  <PaymentButton productKey="meeting" label="Book a meeting" variant="default" />
</div>
```

### 4.7 No `@stripe/stripe-js` Needed

Since we're using Checkout Sessions (redirect flow), the frontend never touches Stripe directly. No `@stripe/stripe-js` or `@stripe/react-stripe-js` packages are needed. The entire frontend Stripe integration is:
1. Call the GraphQL mutation → get a URL
2. `window.location.href = url` → redirect to Stripe

---

## 5. Stripe Dashboard Setup

Step-by-step:

### 5.1 Create Products

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Click **Add product**
3. Create Product 1:
   - Name: `Buy me a coffee`
   - Description: `Support Luis with a coffee`
   - Price: `5.00 AUD`, One time
   - Save → copy the **Price ID** (`price_xxx`)
4. Create Product 2:
   - Name: `Hire me for a meeting`
   - Description: `1-hour consultation with Luis`
   - Price: `150.00 AUD`, One time
   - Save → copy the **Price ID** (`price_xxx`)

### 5.2 Set Up Webhook Endpoint

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://api.luisfaria.dev/stripe/webhook` (or your backend domain)
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Save → copy the **Webhook signing secret** (`whsec_xxx`)

### 5.3 Get API Keys

1. Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
2. Copy the **Secret key** (`sk_test_xxx` for test mode, `sk_live_xxx` for production)
3. **Never** use the Publishable key in the backend

### 5.4 Test Mode vs Live Mode

- Use **Test Mode** (toggle in dashboard top-right) for development
- All test keys start with `sk_test_` and `pk_test_`
- Switch to **Live Mode** only after testing is complete
- Test mode uses fake card numbers (see Section 9)

---

## 6. Environment Variables

Add to `backend/.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx          # From Stripe Dashboard > API keys
STRIPE_WEBHOOK_SECRET=whsec_xxx        # From Stripe Dashboard > Webhooks
STRIPE_COFFEE_PRICE_ID=price_xxx       # From Product 1
STRIPE_MEETING_PRICE_ID=price_xxx      # From Product 2

# Frontend URL (for success/cancel redirects)
FRONTEND_URL=http://localhost:3000     # or https://luisfaria.dev in production
```

Add to `backend/.env.example`:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_COFFEE_PRICE_ID=
STRIPE_MEETING_PRICE_ID=
FRONTEND_URL=http://localhost:3000
```

**Security note**: All Stripe keys are backend-only. The frontend never needs `STRIPE_SECRET_KEY` or `STRIPE_PUBLISHABLE_KEY` because Checkout Sessions redirect to Stripe's domain — no client-side SDK is involved.

---

## 7. Security Considerations

### Webhook Signature Verification

Every webhook must verify the Stripe signature before processing:

```typescript
const event = stripe.webhooks.constructEvent(
  req.body,       // raw Buffer — NOT parsed JSON
  req.headers['stripe-signature'],
  config.stripeWebhookSecret
);
```

If verification fails, return `400` immediately — don't process the event.

### Secret Key Server-Only

- `STRIPE_SECRET_KEY` must never be exposed to the client
- It's used only in `backend/src/services/stripe.ts`
- Never log it, never include it in GraphQL responses

### Idempotency

Stripe may send the same webhook event multiple times. Handle this by:
- Using the `event.id` to deduplicate (store processed event IDs)
- Making webhook handlers idempotent (processing the same event twice has no side effects)
- For our simple use case (logging + notification), duplicate processing is harmless

### HTTPS Only

- Webhook endpoint must be HTTPS in production
- Stripe will not send webhooks to HTTP endpoints (except `localhost` in test mode)

---

## 8. Testing Strategy

### 8.1 Local Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:4000/stripe/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

The CLI gives you a temporary webhook secret (`whsec_xxx`) for local testing — use it as `STRIPE_WEBHOOK_SECRET` in your local `.env`.

### 8.2 Test Card Numbers

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0000 0000 0077` | Charge succeeds, then disputes |

Use any future expiry date, any 3-digit CVC, and any postal code.

### 8.3 Backend Unit Tests

```typescript
// backend/src/__tests__/stripe/stripe.service.test.ts
describe('Stripe Service', () => {
  it('should return test session in test mode', async () => {
    const result = await createCheckoutSession('coffee');
    expect(result.sessionId).toBe('test_session_id');
    expect(result.url).toContain('stripe.com');
  });

  it('should throw on invalid product key', async () => {
    await expect(createCheckoutSession('invalid' as any))
      .rejects.toThrow();
  });
});
```

### 8.4 Backend Integration Tests

```typescript
// backend/src/__tests__/stripe/stripe.resolver.test.ts
describe('createCheckoutSession mutation', () => {
  it('should return a session URL for coffee', async () => {
    const res = await server.executeOperation({
      query: CREATE_CHECKOUT_SESSION,
      variables: { input: { productKey: 'coffee' } },
    });
    expect(res.body.singleResult.data.createCheckoutSession.url).toBeDefined();
  });

  it('should reject invalid product key', async () => {
    const res = await server.executeOperation({
      query: CREATE_CHECKOUT_SESSION,
      variables: { input: { productKey: 'invalid' } },
    });
    expect(res.body.singleResult.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });
});
```

### 8.5 Frontend Component Tests

```typescript
// frontend/src/__tests__/components/stripe/PaymentButton.test.tsx
describe('PaymentButton', () => {
  it('should render with the correct label', () => {
    render(<PaymentButton productKey="coffee" label="Buy a coffee" />);
    expect(screen.getByText('Buy a coffee')).toBeInTheDocument();
  });

  it('should show loading state when clicked', async () => {
    render(<PaymentButton productKey="coffee" label="Buy a coffee" />);
    fireEvent.click(screen.getByText('Buy a coffee'));
    expect(screen.getByText('Redirecting...')).toBeInTheDocument();
  });
});
```

---

## 9. Files Created / Modified

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `backend/src/services/stripe.ts` | Create | Stripe SDK client, `createCheckoutSession`, `verifyWebhookSignature` |
| 2 | `backend/src/schemas/types/stripeTypes.ts` | Create | GraphQL types for checkout session |
| 3 | `backend/src/schemas/typeDefs.ts` | Modify | Import and register `stripeTypes` |
| 4 | `backend/src/resolvers/stripe/mutations.ts` | Create | `createCheckoutSession` resolver |
| 5 | `backend/src/resolvers/index.ts` | Modify | Import and register stripe resolvers |
| 6 | `backend/src/routes/stripe.ts` | Create | Webhook endpoint with signature verification |
| 7 | `backend/src/index.ts` | Modify | Mount webhook route with `express.raw()` before `express.json()` |
| 8 | `backend/src/config/config.ts` | Modify | Add Stripe env vars to Config interface |
| 9 | `backend/src/validation/schemas/stripe.schema.ts` | Create | Zod schema for checkout input |
| 10 | `backend/src/validation/shield.ts` | Modify | Add validation rule for `createCheckoutSession` |
| 11 | `backend/.env.example` | Modify | Add Stripe env var templates |
| 12 | `frontend/src/lib/graphql/mutations/stripe.mutations.ts` | Create | `CREATE_CHECKOUT_SESSION` mutation |
| 13 | `frontend/src/components/stripe/PaymentButton.tsx` | Create | Reusable payment button component |
| 14 | `frontend/src/app/payment/success/page.tsx` | Create | Post-checkout success page |
| 15 | `frontend/src/app/payment/cancel/page.tsx` | Create | Post-checkout cancel page |
| 16 | `frontend/src/app/support/page.tsx` | Create | Dedicated support page with both payment options |
| 17 | `frontend/src/app/page.tsx` | Modify | Add CTA buttons to hero section |

---

## 10. Task Checklist

### Backend

- [ ] Install `stripe` package: `cd backend && npm install stripe`
- [ ] Add Stripe env vars to `config.ts`
- [ ] Add env var templates to `.env.example`
- [ ] Create `services/stripe.ts` (SDK client, session creation, webhook verification)
- [ ] Create `schemas/types/stripeTypes.ts` and register in `typeDefs.ts`
- [ ] Create `resolvers/stripe/mutations.ts` and register in `resolvers/index.ts`
- [ ] Create `validation/schemas/stripe.schema.ts`
- [ ] Add Shield rule in `validation/shield.ts`
- [ ] Create `routes/stripe.ts` (webhook handler)
- [ ] Mount webhook route in `index.ts` with `express.raw()`
- [ ] Create Stripe Products and Prices in Dashboard
- [ ] Set up webhook endpoint in Dashboard
- [ ] Write service unit tests
- [ ] Write resolver integration tests
- [ ] Test locally with Stripe CLI

### Frontend

- [ ] Create `lib/graphql/mutations/stripe.mutations.ts`
- [ ] Create `components/stripe/PaymentButton.tsx`
- [ ] Create `app/payment/success/page.tsx`
- [ ] Create `app/payment/cancel/page.tsx`
- [ ] Create `app/support/page.tsx`
- [ ] Add CTA buttons to homepage hero
- [ ] Write PaymentButton component tests
- [ ] Test full flow with Stripe test cards

### Deploy

- [ ] Add Stripe env vars to production environment
- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Verify webhook delivery in Stripe Dashboard
- [ ] Make a real test payment

---

## 11. What's Next (Future Ideas)

These are **not** part of the initial implementation — they're ideas for future iterations:

- **Payment model**: Create a `Payment` Mongoose model to persist transaction history (session ID, amount, email, product, status, timestamps)
- **Confirmation emails**: Use `resendMailer.ts` to send a thank-you email after successful payment
- **Discord notifications**: Post to the Discord webhook when a payment is received (similar to existing Discord integration in `frontend/src/app/api/discord/route.ts`)
- **`isSubscriber` check**: Wire up the TODO in `backend/src/models/Scream.ts` to check Stripe customer status via `stripe.customers.list({ email })` — enables premium features for supporters
- **Multi-currency**: Add AUD + USD + BRL prices for each product (Stripe handles conversion)
- **Recurring donations**: Add a `mode: 'subscription'` option for monthly supporters
- **Analytics**: Track conversion rates (button click → checkout → payment) via Google Analytics events
- **Receipt page**: Fetch session details on `/payment/success` to show amount paid, product name, receipt link
