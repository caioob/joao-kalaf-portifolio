/**
 * JSDoc typedefs mirroring docs/04-content-model.md. The repository validates
 * this JSON model before public rendering or publication.
 *
 * @typedef {{ pt: string, en: string }} LocalizedText
 * @typedef {{ id: string, type: 'image', src: string, alt: LocalizedText, width?: number, height?: number, focalPoint?: { x: number, y: number } }} ImageMedia
 * @typedef {{ id: string, type: 'video', provider: 'youtube' | 'vimeo' | 'adobe-ccv', videoId: string, title: LocalizedText }} VideoMedia
 * @typedef {ImageMedia | VideoMedia} Media
 * @typedef {{ label: LocalizedText, url: string }} Link
 * @typedef {{ clientOrBrand: string, role: LocalizedText }} ProjectContext
 * @typedef {{ id: string, label: LocalizedText, rank: number, archived: boolean }} Discipline
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} slug
 * @property {number} rank
 * @property {string} primaryDisciplineId
 * @property {string[]} secondaryDisciplineIds
 * @property {LocalizedText} title
 * @property {LocalizedText} [description]
 * @property {string} coverMediaId
 * @property {Media[]} media
 * @property {string[]} [tools]
 * @property {ProjectContext} [context]
 * @property {Link[]} [links]
 * @typedef {{ name: string, logo?: string | null }} Profile
 */

export {}
