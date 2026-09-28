import path from 'node:path'

import log4js from 'log4js'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Survey from '@core/survey/survey'
import * as UserManager from '@server/modules/user/manager/userManager'
import { parseCsv } from '@test/utils/csvUtils'
import * as RB from '@test/utils/recordBuilder'
import * as SB from '@test/utils/surveyBuilder'

import {
  category,
  categoryItems,
  cluster,
  flattenCategoryItems,
  nodeDefExpressions,
  plot,
  SampleCategoryItem,
  SampleNodeDef,
  SampleRecord,
  taxonomy,
  tree,
} from './sampleSurveyModel'

// the seed runs the server code in-process (in the Playwright worker): keep its logs quiet
log4js.getLogger('arena').level = 'error'

/**
 * Runs the specified function silencing console.log (the survey schema migrations print the executed SQL).
 * @param {Function} fn - Function to run.
 * @returns {Promise<any>} - The result of the function.
 */
const withConsoleLogSilenced = async <T>(fn: () => Promise<T>): Promise<T> => {
  const { log } = console
  // eslint-disable-next-line no-console
  console.log = () => {}
  try {
    return await fn()
  } finally {
    // eslint-disable-next-line no-console
    console.log = log
  }
}

export const taxonomyCsvPath = path.resolve(__dirname, '..', '..', 'resources', 'species_list_predefined.csv')

export type SampleSurveyOptions = {
  userEmail: string
  name: string
  label: string
  /** Whether to add the node def expressions (default values, relevancy, validations); default true. */
  withExpressions?: boolean
  /** Whether to publish the survey; default true (records can be inserted only in a published survey). */
  publish?: boolean
  template?: boolean
  records?: SampleRecord[]
}

type ExpressionsByName = Record<string, string>

const createAttributeBuilder = (nodeDef: SampleNodeDef, withExpressions: boolean) => {
  const builder = SB.attribute(nodeDef.name, nodeDef.type).label(nodeDef.label)
  if (nodeDef.key) builder.key()
  if (nodeDef.unique) builder.unique()
  if (nodeDef.category) builder.category(nodeDef.category)
  if (nodeDef.parentCode) builder.parentCode(nodeDef.parentCode)
  if (nodeDef.taxonomy) builder.taxonomy(nodeDef.taxonomy)
  if (withExpressions) {
    const defaultValue = (nodeDefExpressions.defaultValues as ExpressionsByName)[nodeDef.name]
    if (defaultValue) builder.defaultValues(NodeDefExpression.createExpression({ expression: defaultValue }))
    const validations = (nodeDefExpressions.validations as Record<string, { expression: string; applyIf?: string }[]>)[
      nodeDef.name
    ]
    if (validations) builder.expressions(...validations.map((v) => NodeDefExpression.createExpression(v)))
  }
  return builder
}

const createAttributeBuilders = (children: Record<string, SampleNodeDef>, withExpressions: boolean) =>
  Object.values(children).map((child) => createAttributeBuilder(child, withExpressions))

const createCategoryItemBuilder = (item: SampleCategoryItem) =>
  SB.categoryItem(item.code)
    .label(item.label)
    .items(...item.children.map(createCategoryItemBuilder))

const createTaxonBuilders = () =>
  parseCsv(taxonomyCsvPath).map((row: Record<string, string>) => {
    const taxonBuilder = SB.taxon(row.code, row.family, row.genus, row.scientific_name)
    for (const lang of ['eng', 'swa']) {
      const names = (row[lang] ?? '').split('/').map((name) => name.trim())
      names.filter(Boolean).forEach((name) => taxonBuilder.vernacularName(lang, name))
    }
    return taxonBuilder
  })

/**
 * Inserts the sample survey (cluster -> plot -> tree, with a category and a taxonomy) directly in the DB,
 * owned by the specified user and set as its current survey, optionally with some records.
 * @param {SampleSurveyOptions} options - Options.
 * @returns {Promise<number>} - The id of the survey inserted.
 */
export const insertSampleSurvey = async (options: SampleSurveyOptions): Promise<number> => {
  const { userEmail, name, label, withExpressions = true, publish = true, template = false, records = [] } = options

  const user = await UserManager.fetchUserByEmail(userEmail)

  const treeBuilder = SB.entity(tree.name, ...createAttributeBuilders(tree.children, withExpressions))
    .label(tree.label)
    .multiple()
    .renderAsTable()
    .layoutSize({ w: 3, h: 6 })

  const plotBuilder = SB.entity(plot.name, ...createAttributeBuilders(plot.children, withExpressions), treeBuilder)
    .label(plot.label)
    .multiple()
    .displayInOwnPage()
  if (withExpressions) plotBuilder.applyIf(nodeDefExpressions.relevantIf.plot)

  const clusterBuilder = SB.entity(
    cluster.name,
    ...createAttributeBuilders(cluster.children, withExpressions),
    plotBuilder
  )
    .label(cluster.label)
    // the root entity is always displayed in its own page (the form designer sets a page uuid on it)
    .displayInOwnPage()

  const categoryBuilder = SB.category(category.name)
    .levels(...category.levels.map((level) => level.name))
    .items(...categoryItems.map(createCategoryItemBuilder))

  const taxonomyBuilder = SB.taxonomy(taxonomy.name)
    .description(taxonomy.description)
    .taxa(...createTaxonBuilders())

  const surveyBuilder = SB.survey(user, clusterBuilder).categories(categoryBuilder).taxonomies(taxonomyBuilder)
  surveyBuilder.name = name
  surveyBuilder.label = label
  if (template) surveyBuilder.template()

  const survey = await withConsoleLogSilenced(() => surveyBuilder.buildAndStore(publish))

  if (records.length > 0) {
    const { items } = categoryBuilder.build()
    const { taxa } = taxonomyBuilder.build()
    const itemUuidByCode = Object.fromEntries(
      flattenCategoryItems().map(({ code }) => [code, items.find((item: any) => item.props.code === code).uuid])
    )
    const taxonUuidByCode = Object.fromEntries(taxa.map((taxon: any) => [taxon.props.code, taxon.uuid]))

    // empty values are stored as null
    const value = (v: string) => (v === '' ? null : v)
    const codeValue = (code: string) => (code ? { itemUuid: itemUuidByCode[code] } : null)
    const taxonValue = (code: string) => (code ? { taxonUuid: taxonUuidByCode[code] } : null)

    for (const record of records) {
      await RB.record(
        user,
        survey,
        RB.entity(
          cluster.name,
          RB.attribute('cluster_id', value(record.cluster_id)),
          RB.attribute('cluster_decimal', value(record.cluster_decimal)),
          RB.attribute('cluster_date', value(record.cluster_date)),
          RB.attribute('cluster_time', value(record.cluster_time)),
          RB.attribute('cluster_boolean', value(record.cluster_boolean)),
          RB.attribute('cluster_coordinate', record.cluster_coordinate),
          RB.attribute('cluster_country', codeValue(record.cluster_country)),
          RB.attribute('cluster_region', codeValue(record.cluster_region)),
          RB.attribute('cluster_province', codeValue(record.cluster_province)),
          RB.entity(
            plot.name,
            RB.attribute('plot_id', value(record.plot_id)),
            RB.attribute('plot_text', value(record.plot_text)),
            ...record.trees.map((treeItem) =>
              RB.entity(
                tree.name,
                RB.attribute('tree_id', value(treeItem.tree_id)),
                RB.attribute('tree_dec_1', value(treeItem.tree_dec_1)),
                RB.attribute('tree_dec_2', value(treeItem.tree_dec_2)),
                RB.attribute('tree_species', taxonValue(treeItem.tree_species))
              )
            )
          )
        )
      ).buildAndStore()
    }
  }
  return Number(Survey.getId(survey))
}
