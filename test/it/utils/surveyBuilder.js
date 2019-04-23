const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const NodeDefValidations = require('../../../common/survey/nodeDefValidations')
const User = require('../../../common/user/user')

const SurveyManager = require('../../../server/modules/survey/persistence/surveyManager')
const NodeDefRepository = require('../../../server/modules/nodeDef/persistence/nodeDefRepository')

const SurveyPublishPerformJob = require('../../../server/modules/survey/service/publish/surveyPublishPerformJob')
const SurveyRdbGeneratorJob = require('../../../server/modules/survey/service/surveyRdbGeneratorJob')

class NodeDefBuilder {

  constructor (name, type) {
    this.type = type
    this.props = {
      [NodeDef.propKeys.name]: name
    }
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

    console.log('====newprops', this.props)
    return this
  }
}

class EntityDefBuilder extends NodeDefBuilder {

  constructor (name, ...childBuilders) {
    super(name, NodeDef.nodeDefType.entity)
    this.childBuilders = childBuilders
  }

  build (survey, parentDefUUid = null) {
    const def = NodeDef.newNodeDef(parentDefUUid, this.type, this.props)

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
    const def = NodeDef.newNodeDef(parentDefUuid, this.type, this.props)

    return {
      [NodeDef.getUuid(def)]: def
    }
  }
}

class SurveyBuilder {

  constructor (user, name, label, lang, rootDefBuilder) {
    this.user = user
    this.name = name
    this.label = label
    this.lang = lang
    this.rootDefBuilder = rootDefBuilder
  }

  build () {
    const survey = Survey.newSurvey(User.getId(this.user), this.name, this.label, this.lang)
    const nodeDefs = this.rootDefBuilder.build(survey)

    return R.pipe(
      Survey.assocNodeDefs(nodeDefs),
      s => Survey.assocDependencyGraph(Survey.buildDependencyGraph(s))(s)
    )(survey)
  }

  async buildAndStore (publish = true, client = db) {
    const surveyParam = this.build()

    return await client.tx(async t => {
      const survey = await SurveyManager.insertSurvey(this.user, surveyParam, false, t)

      const surveyId = Survey.getId(survey)

      const { root } = Survey.getHierarchy(R.always)(surveyParam)

      await
        Survey.traverseHierarchyItem(root, async nodeDef =>
          await NodeDefRepository.insertNodeDef(surveyId, nodeDef, t)
        )

      if (publish) {
        await new SurveyPublishPerformJob({ user: this.user, surveyId }).start(t)
        await new SurveyRdbGeneratorJob({ user: this.user, surveyId }).start(t)
      }

      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, !publish, true, false, t)
      return Survey.assocDependencyGraph(Survey.buildDependencyGraph(surveyDb))(surveyDb)
    })
  }
}

module.exports = {
  survey: (userId, name, label, lang, rootDefBuilder) => new SurveyBuilder(userId, name, label, lang, rootDefBuilder),
  entity: (name, ...childBuilders) => new EntityDefBuilder(name, ...childBuilders),
  attribute: (name, type = NodeDef.nodeDefType.text) => new AttributeDefBuilder(name, type)
}