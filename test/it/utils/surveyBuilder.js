const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const NodeDefValidations = require('../../../common/survey/nodeDefValidations')
const User = require('../../../common/user/user')

const SurveyManager = require('../../../server/modules/survey/manager/surveyManager')
const NodeDefRepository = require('../../../server/modules/nodeDef/repository/nodeDefRepository')

const SurveyPublishJob = require('../../../server/modules/survey/service/publish/surveyPublishJob')

class NodeDefBuilder {

  constructor (name, type) {
    this.type = type
    this.props = {
      [NodeDef.propKeys.name]: name
    }
  }

  _createNodeDef (survey, parentDefUuid) {
    const cycle = R.pipe(
      Survey.getSurveyInfo,
      Survey.getCycleOneKey
    )(survey)

    return NodeDef.newNodeDef(parentDefUuid, this.type, cycle, this.props)
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
  }

  key () {
    this.props[NodeDef.propKeys.key] = true
    return this
  }

  readOnly () {
    this.props[NodeDef.propKeys.readOnly] = true
    return this
  }

  defaultValues (...defaultValues) {
    this.props[NodeDef.propKeys.defaultValues] = defaultValues
    return this
  }

  required (required = true) {
    const validations = NodeDef.getValidations(this)
    const validationsUpdated = NodeDefValidations.assocRequired(required)(validations)
    this.props[NodeDef.propKeys.validations] = validationsUpdated
    return this
  }

  build (survey, parentDefUuid = null) {
    const def = this._createNodeDef(survey, parentDefUuid)

    return {
      [NodeDef.getUuid(def)]: def
    }
  }
}

class SurveyBuilder {

  constructor (user, rootDefBuilder) {
    this.user = user
    this.name = `test_${new Date().getTime()}`
    this.label = 'Test'
    this.lang = 'en'
    this.rootDefBuilder = rootDefBuilder
  }

  build () {
    const survey = Survey.newSurvey(User.getUuid(this.user), this.name, this.label, this.lang)
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
      const survey = await SurveyManager.insertSurvey(this.user, surveyParam, false, t)

      const surveyId = Survey.getId(survey)

      const { root } = Survey.getHierarchy(R.always)(surveyParam)

      await Survey.traverseHierarchyItem(root, async nodeDef =>
        await NodeDefRepository.insertNodeDef(surveyId, nodeDef, t)
      )

      if (publish) {
        const publishJob = new SurveyPublishJob({ user: this.user, surveyId })
        await publishJob.start(t)
        if (publishJob.isFailed())
          throw new Error(`Test survey buildAndStore failed: ${JSON.stringify(publishJob)}`)
      }
      const cycle = R.pipe(Survey.getSurveyInfo, Survey.getCycleOneKey)(survey)
      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, !publish, true, false, false, t)
      return Survey.assocDependencyGraph(Survey.buildDependencyGraph(surveyDb))(surveyDb)
    })
  }
}

module.exports = {
  survey: (user, rootDefBuilder) => new SurveyBuilder(user, rootDefBuilder),
  entity: (name, ...childBuilders) => new EntityDefBuilder(name, ...childBuilders),
  attribute: (name, type = NodeDef.nodeDefType.text) => new AttributeDefBuilder(name, type)
}