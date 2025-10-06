
import {defineField, defineType} from 'sanity'

export const stripeSession = defineType({
  name: 'stripeSession',
  title: 'Stripe Session',
  type: 'document',
  fields: [
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
    }),
    defineField({
      name: 'cart',
      title: 'Cart',
      type: 'reference',
      to: [{type: 'cart'}],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: ['pending', 'success', 'canceled', 'error'],
        layout: 'radio',
      },
    }),
  ],
})
