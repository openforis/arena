/**
 * categories_list and taxonomies_list: the names the model may pass as categoryName / taxonomyName to
 * nodeDef_proposeUpdate. Counts come from what the defs load attached; unknown counts are null.
 */
import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Taxonomy from '@core/survey/taxonomy'

import { canViewCurrentSurvey } from '../common/toolPermissions'
import { takeWithinBudget } from '../common/toolResult'
import type { AiTool } from '../types'
import { requireSurvey } from './surveyLookup'

// the wrapper cuts a longer result at the end of its largest list (valid values, truncated: true): stay under the limit with some margin

type CategoryEntry = { name: string; levels: string[]; itemsCount: number | null }
type TaxonomyEntry = { name: string; taxaCount: number | null }

export type CategoriesList = { total: number; truncated: boolean; categories: CategoryEntry[] }
export type TaxonomiesList = { total: number; truncated: boolean; taxonomies: TaxonomyEntry[] }

/**
 * Normalizes a stored count (a number, a numeric string, -1 or nothing).
 * @param {unknown} value - Stored count.
 * @returns {number|null} The count; null when unknown.
 */
const toCount = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const count = Number(value)
  return Number.isInteger(count) && count >= 0 ? count : null
}

const byName = (a: { name: string }, b: { name: string }): number => a.name.localeCompare(b.name)

/**
 * Keeps the entries that fit the result budget.
 * @param {object[]} entries - Entries, in order.
 * @param {object} emptyResult - The result without entries.
 * @returns {object[]} The first entries that fit.
 */
const fitEntries = <T>(entries: T[], emptyResult: object): T[] =>
  takeWithinBudget(entries, { baseChars: JSON.stringify(emptyResult).length })

/**
 * Lists the categories by name.
 * @param {object} survey - Survey.
 * @returns {CategoriesList} The list.
 */
export const listCategories = (survey: any): CategoriesList => {
  const entries: CategoryEntry[] = Survey.getCategoriesArray(survey)
    .map((category: any) => ({
      name: Category.getName(category),
      levels: Category.getLevelsArray(category).map((level: any) => CategoryLevel.getName(level)),
      itemsCount: toCount(Category.getItemsCount(category)),
    }))
    .sort(byName)
  const categories = fitEntries(entries, { total: entries.length, truncated: true, categories: [] })
  return { total: entries.length, truncated: categories.length < entries.length, categories }
}

/**
 * Lists the taxonomies by name.
 * @param {object} survey - Survey.
 * @returns {TaxonomiesList} The list.
 */
export const listTaxonomies = (survey: any): TaxonomiesList => {
  const entries: TaxonomyEntry[] = Survey.getTaxonomiesArray(survey)
    .map((taxonomy: any) => ({ name: Taxonomy.getName(taxonomy), taxaCount: toCount(Taxonomy.getTaxaCount(taxonomy)) }))
    .sort(byName)
  const taxonomies = fitEntries(entries, { total: entries.length, truncated: true, taxonomies: [] })
  return { total: entries.length, truncated: taxonomies.length < entries.length, taxonomies }
}

export const categoriesListTool: AiTool<Record<string, never>, CategoriesList> = {
  name: 'categories_list',
  description:
    'Lists the survey categories (code lists) by name, with their level names and item count (null: unknown). ' +
    'Use a name as categoryName in nodeDef_proposeUpdate.',
  inputSchema: z.object({}).strict(),
  area: ['design'],
  dataClass: 'schema',
  requires: canViewCurrentSurvey,
  execute: async (_input, ctx) => listCategories(requireSurvey(ctx)),
}

export const taxonomiesListTool: AiTool<Record<string, never>, TaxonomiesList> = {
  name: 'taxonomies_list',
  description:
    'Lists the survey taxonomies (species lists) by name, with their taxa count (null: unknown). Use a name as ' +
    'taxonomyName in nodeDef_proposeUpdate.',
  inputSchema: z.object({}).strict(),
  area: ['design'],
  dataClass: 'schema',
  requires: canViewCurrentSurvey,
  execute: async (_input, ctx) => listTaxonomies(requireSurvey(ctx)),
}
