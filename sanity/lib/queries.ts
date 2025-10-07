import { defineQuery } from "next-sanity";

export const settingsQuery = defineQuery(`*[_type == "settings"][0]`);

const postFields = `
  _id,
  "status": select(_originalId in path("drafts.**") => "draft", "published"),
  "title": coalesce(title, "Untitled"),
  "slug": slug.current,
  excerpt,
  coverImage,
  "date": coalesce(date, _updatedAt),
  "author": author->{"name": coalesce(name, "Anonymous"), picture},
`;

export const heroQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(date desc, _updatedAt desc) [0] {
    content,
    ${postFields}
  }
`);

export const moreStoriesQuery = defineQuery(`
  *[_type == "post" && _id != $skip && defined(slug.current)] | order(date desc, _updatedAt desc) [0...$limit] {
    ${postFields}
  }
`);

export const postQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug] [0] {
    content,
    ${postFields}
  }
`);

export const productsQuery = defineQuery(`
  *[_type == "product"]{
    _id,
    name,
    description,
    "slug": slug.current,
    "price": default_price->.unit_amount,
    "image": images[0].asset->,
  }
`);

export const productBySlugQuery = defineQuery(`
  *[_type == "product" && slug.current == $slug][0]{
    _id,
    name,
    description,
    "slug": slug.current,
    "price": default_price->.unit_amount,
    "image": images[0].asset->,
    "priceId": default_price->.stripePriceId,
    }
`);

export const featuredProductsQuery = defineQuery(`
  *[_type == "product"] | order(_createdAt asc)[0...8]{
    _id,
    name,
    brand,
    description,
    "slug": slug.current,
    "price": default_price->.unit_amount,
    "image": images[0].asset->,
  }
`);

export const cartQuery = defineQuery(`
  *[_type == "cart" && userId == $userId][0]{
        ...,
        items[]{
          ...,
          product->{
            _id,
            name,
            description,
            "slug": slug.current,
            "price": default_price->.unit_amount,
            "image": images[0].asset->,
          }
        }
      }
`);

export const cartByIdQuery = defineQuery(`
  *[_type == "cart" && _id == $cartId][0]{
        items[]{
          quantity,
          product->{
            "priceId": default_price->.stripePriceId
          }
        }
      }
`);