/**
 * JSDoc typedefs mirroring docs/04-content-model.md — the single source of
 * truth shared by the v1 JSON files, the repository validation, and the
 * future v2 admin form. No runtime code.
 *
 * @typedef {Object} LocalizedText
 * @property {string} pt
 * @property {string} en
 *
 * @typedef {Object} Image
 * @property {string} src - public path, e.g. "/images/projects/foo.webp"
 * @property {LocalizedText} alt - required in both languages (a11y by schema)
 *
 * @typedef {Object} VideoMedia
 * @property {'video'} type
 * @property {'youtube' | 'vimeo'} provider
 * @property {string} videoId
 * @property {LocalizedText} title
 *
 * @typedef {Object} ImageMedia
 * @property {'image'} type
 * @property {string} src
 * @property {LocalizedText} alt
 *
 * @typedef {ImageMedia | VideoMedia} Media
 *
 * @typedef {Object} Link
 * @property {LocalizedText} label
 * @property {string} url
 *
 * @typedef {Object} Project
 * @property {string} id - stable unique id, never reused
 * @property {string} slug - kebab-case, unique
 * @property {'video' | 'motion' | 'product' | 'graphic'} category
 * @property {LocalizedText} title
 * @property {LocalizedText} description - plain text, "\n\n" = paragraph break
 * @property {Image} thumbnail
 * @property {Media[]} media - at least one item
 * @property {string[]} [tools]
 * @property {string} date - "YYYY-MM", drives sort order
 * @property {boolean} [featured]
 * @property {Link[]} [links]
 *
 * @typedef {Object} Service
 * @property {'video' | 'motion' | 'product' | 'graphic'} id - reuses the category enum
 * @property {LocalizedText} name
 * @property {LocalizedText} blurb
 *
 * @typedef {Object} Profile
 * @property {string} name
 * @property {LocalizedText} tagline
 * @property {LocalizedText} bio
 * @property {Service[]} services - exactly four, one per category
 * @property {string} email
 * @property {{ label: string, url: string }[]} socials
 * @property {Image | null} photo
 */

export {}
