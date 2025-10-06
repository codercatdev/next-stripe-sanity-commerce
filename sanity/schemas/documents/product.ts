import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'string',
    }),
    defineField({
      name: 'prices',
      title: 'Prices',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'price' }] }],
      readOnly: true,
    }),
    defineField({
      name: 'default_price',
      title: 'Default Price',
      type: 'reference',
      to: [{ type: 'price' }],
      readOnly: true,
    }),
    defineField({
      name: 'stripeProductId',
      title: 'Stripe Product ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'stripePriceId',
      title: 'Pending Stripe Price ID',
      type: 'string',
      readOnly: true,
      hidden: true,
      description: 'Temporary field to store Stripe price ID until price document is created'
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
    }),
    defineField({
      name: 'embedding',
      title: 'Embedding',
      type: 'array',
      of: [{ type: 'number' }],
      hidden: true,
    }),
  ],
})
