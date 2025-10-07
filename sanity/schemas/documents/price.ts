import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'price',
  title: 'Price',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'stripePriceId',
      title: 'Stripe Price ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'unit_amount',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
    }),
    defineField({
      name: 'updatedFromStripe',
      title: 'Updated from Stripe',
      type: 'boolean',
      hidden: true,
      readOnly: true,
      description: 'Internal flag to prevent infinite sync loops with Stripe webhooks'
    }),
  ],
})