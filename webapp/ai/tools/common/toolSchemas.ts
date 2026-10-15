/**
 * Building blocks of the tool input schemas, so every tool bounds the same things the same way.
 */
import { z } from 'zod'

// the one-sentence summary every propose tool gives the user
export const SUMMARY_MAX_CHARS = 500

// a node definition, category or attribute name as the model writes it (Arena names have at most 40 characters)
export const NAME_MAX_CHARS = 100

export const summaryTextSchema = z.string().trim().min(1).max(SUMMARY_MAX_CHARS)

// ids come from earlier tool results: a malformed one is the model's mistake, found before any request
export const uuidSchema = z.uuid()

// a value, a key value or any other short text the model types for an attribute
export const VALUE_TEXT_MAX_CHARS = 2000

// a part of a structured value (a coordinate x, a taxon code...) or the value of a record key
export const VALUE_PART_MAX_CHARS = 200

export const attributeNamesSchema = (max: number) => z.array(z.string().max(NAME_MAX_CHARS)).max(max)
