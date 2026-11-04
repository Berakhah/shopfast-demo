import Stripe from 'stripe'

// STRIPE_API_HOST/PORT/PROTOCOL point the SDK at a local test stand-in.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  host: process.env.STRIPE_API_HOST || undefined,
  port: process.env.STRIPE_API_PORT ? Number(process.env.STRIPE_API_PORT) : undefined,
  protocol: (process.env.STRIPE_API_PROTOCOL as 'http' | 'https') || undefined,
})
