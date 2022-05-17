import pgPromise from 'pg-promise'

import { db } from '../../../server/db/db'

import * as A from '../../../core/arena'

import * as Survey from '../../../core/survey/survey'
import * as NodeDef from '../../../core/survey/nodeDef'
import * as Category from '../../../core/survey/category'
import * as Taxonomy from '../../../core/survey/taxonomy'
import * as Taxon from '../../../core/survey/taxon'
import * as User from '../../../core/user/user'
import * as PromiseUtils from '../../../core/promiseUtils'

import * as SurveyManager from '../../../server/modules/survey/manager/surveyManager'
import * as NodeDefRepository from '../../../server/modules/nodeDef/repository/nodeDefRepository'

import * as SurveyUtils from '../surveyUtils'

import NodeDefEntityBuilder from './nodeDefEntityBuilder'
import NodeDefAttributeBuilder from './nodeDefAttributeBuilder'
import { TaxonomyBuilder } from './taxonomyBuilder'
import { TaxonBuilder } from './taxonBuilder'
import { ItemBuilder } from './categoryItemBuilder'
import { CategoryBuilder } from './categoryBuilder'

const _insertNodeDefRecursively = (surveyId, survey, t) => async (nodeDef) => {
  await NodeDefRepository.insertNodeDef(surveyId, nodeDef, t)

  if (NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)) {
    const children = Survey.getNodeDefChildren(nodeDef, true)(survey)
    // insert virtual node defs after source entity defs
    children.sort((nodeDefA, nodeDefB) => NodeDef.isVirtual(nodeDefA) - NodeDef.isVirtual(nodeDefB))

    // insert node defs in order to avoid foreign keys violations
    await PromiseUtils.each(children, _insertNodeDefRecursively(surveyId, survey, t))
  }
}

class SurveyBuilder {
  constructor(user, rootDefBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = 'en'
    this.rootDefBuilder = rootDefBuilder

    this.categoryBuilders = []
    this.taxonomyBuilders = []
  }

  taxonomy(name, ...taxonBuilders) {
    this.taxonomyBuilders.push(new TaxonomyBuilder(name, ...taxonBuilders))
    return this
  }

  categories(...categoryBuilders) {
    this.categoryBuilders = categoryBuilders
    return this
  }

  build() {
    let survey = Survey.newSurvey({
      ownerUuid: User.getUuid(this.user),
      name: this.name,
      label: this.label,
      languages: [this.lang],
    })

    // categories
    const categoriesByUuid = {}
    const categoryItemsRefData = []
    this.categoryBuilders.forEach((categoryBuilder) => {
      const { category, items } = categoryBuilder.build()
      const categoryUuid = Category.getUuid(category)
      categoriesByUuid[categoryUuid] = category
      // add category uuid to category items
      categoryItemsRefData.push(...items.map((item) => ({ ...item, categoryUuid })))
    })

    // taxonomies
    const taxonomiesByUuid = {}
    const taxaIndexRefData = []
    this.taxonomyBuilders.forEach((taxonomyBuilder) => {
      const { taxonomy, taxa } = taxonomyBuilder.build()
      const extraPropsDefs = {}

      taxaIndexRefData.push(...taxa)

      // extract extra props defs
      taxa.forEach((taxon) => {
        const extraPropsKeys = Object.keys(Taxon.getExtra(taxon))
        extraPropsKeys.forEach((extraPropKey) => {
          extraPropsDefs[extraPropKey] = { key: extraPropKey }
        })
      })
      taxonomiesByUuid[Taxonomy.getUuid(taxonomy)] = Taxonomy.assocExtraPropsDefs(extraPropsDefs)(taxonomy)
    })

    survey = A.pipe(
      Survey.assocCategories(categoriesByUuid),
      Survey.assocTaxonomies(taxonomiesByUuid),
      Survey.assocRefData({ categoryItemsRefData, taxaIndexRefData })
    )(survey)

    return Survey.assocNodeDefs({ nodeDefs: this.rootDefBuilder.build(survey), updateDependencyGraph: true })(survey)
  }

  /**
   * Builds the survey and saves it as draft or publish it.
   *
   * @param {boolean} [publish=true] - Whether to publish the survey.
   * @param {pgPromise.IDatabase} [client=db] - The database client.
   * @returns {Promise<Survey>} - The newly created survey object.
   */
  async buildAndStore(publish = true, client = db) {
    const surveyParam = this.build()

    return client.tx(async (t) => {
      const surveyCreationParams = {
        user: this.user,
        surveyInfo: surveyParam,
        createRootEntityDef: false,
        system: true,
      }
      const survey = await SurveyManager.insertSurvey(surveyCreationParams, t)

      const surveyId = Survey.getId(survey)

      // Node defs
      const nodeDefRoot = Survey.getNodeDefRoot(surveyParam)

      await _insertNodeDefRecursively(surveyId, surveyParam, t)(nodeDefRoot)

      // Taxonomies
      await Promise.all(
        this.taxonomyBuilders.map((taxonomyBuilder) => taxonomyBuilder.buildAndStore(this.user, surveyId, t))
      )

      if (publish) {
        await SurveyUtils.publishSurvey(this.user, surveyId, t)
      }

      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        {
          surveyId,
          cycle: Survey.cycleOneKey,
          draft: !publish,
          advanced: true,
        },
        t
      )
      return Survey.buildAndAssocDependencyGraph(surveyDb)
    })
  }
}

// ==== survey
export const survey = (user, rootDefBuilder) => new SurveyBuilder(user, rootDefBuilder)
export const entity = (name, ...childBuilders) => new NodeDefEntityBuilder(name, ...childBuilders)
export const attribute = (name, type = NodeDef.nodeDefType.text) => new NodeDefAttributeBuilder(name, type)
// ==== category
export const category = (name) => new CategoryBuilder(name)
export const categoryItem = (code) => new ItemBuilder(code)
// ==== taxonomy
export const taxon = (code, family, genus, scientificName, ...vernacularNames) =>
  new TaxonBuilder(code, family, genus, scientificName, ...vernacularNames)
