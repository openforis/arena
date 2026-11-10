// browser-only DOMPurify: the isomorphic one pulls jsdom, which the unit test bundle cannot load (checked in e2e)
import DOMPurify from 'dompurify'

import { escapeHtml } from '@core/stringUtils'

/**
 * Builds the popup HTML of a KML place. The name is plain text; the description keeps its simple HTML
 * (links, bold, tables) but loses scripts and event handlers, as the KML comes from the user.
 * @param {string} name - The place name.
 * @param {string} description - The raw place description.
 * @returns {string} The sanitized HTML.
 */
export const buildKmlPopupHtml = (name: string, description: string): string =>
  DOMPurify.sanitize(`<h2>${escapeHtml(name)}</h2>${description}`)
