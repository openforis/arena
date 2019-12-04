import * as R from 'ramda'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as User from '@core/user/user'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'

import * as SurveyUtils from './surveyUtils'

import { TaxonomyBuilder, TaxonBuilder } from './surveyBuilder/surveyBuilderTaxonomy'

class NodeDefBuilder {
  constructor(name, type) {
    this.type = type
    this.props = {
      [NodeDef.propKeys.name]: name,
    }
  }

  _setProp(prop, value) {
    this.props[prop] = value
    return this
  }

  _createNodeDef(survey, parentDef) {
    return NodeDef.newNodeDef(parentDef, this.type, Survey.cycleOneKey, this.props)
  }

  applyIf(expr) {
    return this._setProp(NodeDef.propKeys.applicable, [NodeDefExpression.createExpression(expr)])
  }

  multiple() {
    return this._setProp(NodeDef.propKeys.multiple, true)
  }

  minCount(count) {
    return this._setProp(
      NodeDef.propKeys.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocMinCount(count))(this),
    )
  }

  maxCount(count) {
    return this._setProp(
      NodeDef.propKeys.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocMaxCount(count))(this),
    )
  }

  expressions(...expressions) {
    return this._setProp(
      NodeDef.propKeys.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocExpressions(expressions))(this),
    )
  }
}

class EntityDefBuilder extends NodeDefBuilder {
  constructor(name, ...childBuilders) {
    super(name, NodeDef.nodeDefType.entity)
    this.childBuilders = childBuilders
  }

  build(survey, parentDef = null) {
    const def = this._createNodeDef(survey, parentDef)

    return R.pipe(
      R.map(childBuilder => childBuilder.build(survey, def)),
      R.mergeAll,
      R.assoc(NodeDef.getUuid(def), def),
    )(this.childBuilders)
  }
}

class AttributeDefBuilder extends NodeDefBuilder {
  constructor(name, type = NodeDef.nodeDefType.text) {
    super(name, type)
    this._analysis = false
  }

  key() {
    return this._setProp(NodeDef.propKeys.key, true)
  }

  readOnly() {
    return this._setProp(NodeDef.propKeys.readOnly, true)
  }

  defaultValues(...defaultValues) {
    return this._setProp(NodeDef.propKeys.defaultValues, defaultValues)
  }

  required(required = true) {
    const validations = NodeDef.getValidations(this)
    const validationsUpdated = NodeDefValidations.assocRequired(required)(validations)
    return this._setProp(NodeDef.propKeys.validations, validationsUpdated)
  }

  analysis() {
    this._analysis = true
    return this
  }

  build(survey, parentDef = null) {
    const def = this._createNodeDef(survey, parentDef)
    def[NodeDef.keys.analysis] = this._analysis

    return {
      [NodeDef.getUuid(def)]: def,
    }
  }
}

class SurveyBuilder {
  constructor(user, rootDefBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = 'en'
    this.rootDefBuilder = rootDefBuilder

    this.taxonomyBuilders = []
  }

  build() {
    const survey = Survey.newSurvey(User.getUuid(this.user), this.name, this.label, [this.lang])
    const nodeDefs = this.rootDefBuilder.build(survey)

    return R.pipe(Survey.assocNodeDefs(nodeDefs), s => Survey.assocDependencyGraph(Survey.buildDependencyGraph(s))(s))(
      survey,
    )
  }

  taxonomy(name, ...taxonBuilders) {
    const taxonomyBuilder = new TaxonomyBuilder(name, ...taxonBuilders)
    this.taxonomyBuilders.push(taxonomyBuilder)
    return this
  }

  /**
   * Builds the survey and saves it as draft.
   * If 'publish' is true, publishes the survey.
   */
  async buildAndStore(publish = true, client = db) {
    const surveyParam = this.build()

    return await client.tx(async t => {
      const survey = await SurveyManager.insertSurvey(this.user, surveyParam, false, true, t)

      const surveyId = Survey.getId(survey)

      // Node defs
      const { root } = Survey.getHierarchy(R.always, true)(surveyParam)
      await Survey.traverseHierarchyItem(
        root,
        async nodeDef => await NodeDefRepository.insertNodeDef(surveyId, nodeDef, t),
      )

      // Taxonomies
      for (const taxonomyBuilder of this.taxonomyBuilders) {
        await taxonomyBuilder.buildAndStore(this.user, surveyId, t)
      }

      if (publish) {
        await SurveyUtils.publishSurvey(this.user, surveyId, t)
      }

      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        surveyId,
        Survey.cycleOneKey,
        !publish,
        true,
        false,
        false,
        t,
      )
      return Survey.assocDependencyGraph(Survey.buildDependencyGraph(surveyDb))(surveyDb)
    })
  }
}

// ==== survey
export const survey = (user, rootDefBuilder) => new SurveyBuilder(user, rootDefBuilder)
export const entity = (name, ...childBuilders) => new EntityDefBuilder(name, ...childBuilders)
export const attribute = (name, type = NodeDef.nodeDefType.text) => new AttributeDefBuilder(name, type)
// ==== taxonomy
export const taxon = (code, family, genus, scientificName, ...vernacularNames) =>
  new TaxonBuilder(code, family, genus, scientificName, ...vernacularNames)
