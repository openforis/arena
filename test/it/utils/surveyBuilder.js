import * as R from 'ramda'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as User from '@core/user/user'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'

import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'

class NodeDefBuilder {

  constructor (name, type) {
    this.type = type
    this.props = {
      [NodeDef.propKeys.name]: name
    }
  }

  _setProp (prop, value) {
    this.props[prop] = value
    return this
  }

  _createNodeDef (survey, parentDefUuid) {
    const nodeDef = NodeDef.newNodeDef(parentDefUuid, this.type, Survey.cycleOneKey, this.props)
    const nodeDefParent = Survey.getNodeDefByUuid(parentDefUuid)(survey)
    const h = [...NodeDef.getMetaHierarchy(nodeDefParent), parentDefUuid]
    return NodeDef.assocMetaHierarchy(h)(nodeDef)
  }

  applyIf (expr) {
    this.props[NodeDef.propKeys.applicable] = [NodeDefExpression.createExpression(expr)]
    return this
  }

  multiple () {
    this.props[NodeDef.propKeys.multiple] = true
    return this
  }

  minCount (count) {
    this.props[NodeDef.propKeys.validations] = R.pipe(
      NodeDef.getValidations,
      NodeDefValidations.assocMinCount(count)
    )(this)
    return this
  }

  maxCount (count) {
    this.props[NodeDef.propKeys.validations] = R.pipe(
      NodeDef.getValidations,
      NodeDefValidations.assocMaxCount(count)
    )(this)
    return this
  }

  expressions (...expressions) {
    this.props[NodeDef.propKeys.validations] = R.pipe(
      NodeDef.getValidations,
      NodeDefValidations.assocExpressions(expressions)
    )(this)
    return this
  }
}

class EntityDefBuilder extends NodeDefBuilder {

  constructor (name, ...childBuilders) {
    super(name, NodeDef.nodeDefType.entity)
    this.childBuilders = childBuilders
  }

  build (survey, parentDefUuid = null) {
    const def = this._createNodeDef(survey, parentDefUuid)

    const defUuid = NodeDef.getUuid(def)

    return R.pipe(
      R.map(childBuilder => childBuilder.build(survey, defUuid)),
      R.mergeAll,
      R.assoc(defUuid, def),
    )(this.childBuilders)
  }
}

class AttributeDefBuilder extends NodeDefBuilder {

  constructor (name, type = NodeDef.nodeDefType.text) {
    super(name, type)
    this._analysis = false
  }

  key () {
    return this._setProp(NodeDef.propKeys.key, true)
  }

  readOnly () {
    this.props[NodeDef.propKeys.readOnly] = true
    return this
  }

  defaultValues (...defaultValues) {
    return this._setProp(NodeDef.propKeys.defaultValues, defaultValues)
  }

  required (required = true) {
    const validations = NodeDef.getValidations(this)
    const validationsUpdated = NodeDefValidations.assocRequired(required)(validations)
    return this._setProp(NodeDef.propKeys.validations, validationsUpdated)
  }

  analysis () {
    this._analysis = true
    return this
  }

  build (survey, parentDefUuid = null) {
    const def = this._createNodeDef(survey, parentDefUuid)
    def[NodeDef.keys.analysis] = this._analysis

    return {
      [NodeDef.getUuid(def)]: def
    }
  }
}

class SurveyBuilder {

  constructor (user, rootDefBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = 'en'
    this.rootDefBuilder = rootDefBuilder
  }

  build () {
    const survey = Survey.newSurvey(User.getUuid(this.user), this.name, this.label, [this.lang])
    const nodeDefs = this.rootDefBuilder.build(survey)

    return R.pipe(
      Survey.assocNodeDefs(nodeDefs),
      s => Survey.assocDependencyGraph(Survey.buildDependencyGraph(s))(s)
    )(survey)
  }

  /**
   * Builds the survey and saves it as draft.
   * If 'publish' is true, publishes the survey.
   */
  async buildAndStore (publish = true, client = db) {
    const surveyParam = this.build()

    return await client.tx(async t => {
      const survey = await SurveyManager.insertSurvey(this.user, surveyParam, false, true, t)

      const surveyId = Survey.getId(survey)

      const { root } = Survey.getHierarchy(R.always, true)(surveyParam)

      await Survey.traverseHierarchyItem(root, async nodeDef =>
        await NodeDefRepository.insertNodeDef(surveyId, nodeDef, t)
      )

      if (publish) {
        const publishJob = new SurveyPublishJob({ user: this.user, surveyId })
        await publishJob.start(t)
        if (publishJob.isFailed())
          throw new Error(`Test survey buildAndStore failed: ${JSON.stringify(publishJob)}`)
      }
      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, Survey.cycleOneKey, !publish, true, false, false, t)
      return Survey.assocDependencyGraph(Survey.buildDependencyGraph(surveyDb))(surveyDb)
    })
  }
}

export const survey = (user, rootDefBuilder) => new SurveyBuilder(user, rootDefBuilder)
export const entity = (name, ...childBuilders) => new EntityDefBuilder(name, ...childBuilders)
export const attribute = (name, type = NodeDef.nodeDefType.text) => new AttributeDefBuilder(name, type)
