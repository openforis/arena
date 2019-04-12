const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')

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

  multiple () {
    this.props[NodeDef.propKeys.multiple] = true
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

  constructor (name, type) {
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

  build (survey, parentDefUuid = null) {
    const def = NodeDef.newNodeDef(parentDefUuid, this.type, this.props)

    return {
      [NodeDef.getUuid(def)]: def
    }
  }
}

class SurveyBuilder {

  constructor (userId, name, label, lang, rootDefBuilder) {
    this.userId = userId
    this.name = name
    this.label = label
    this.lang = lang
    this.rootDefBuilder = rootDefBuilder
  }

  build () {
    const survey = Survey.newSurvey(this.userId, this.name, this.label, this.lang)
    const nodeDefs = this.rootDefBuilder.build(survey)

    return R.pipe(
      Survey.assocNodeDefs(nodeDefs),
      s => Survey.assocDependencyGraph(Survey.buildDependencyGraph(s))(s)
    )(survey)
  }

  async buildAndStore (user, publish = false, client = db) {
    const surveyParam = this.build()

    return await client.tx(async t => {
      const survey = await SurveyManager.insertSurvey(user, surveyParam, false, t)

      const surveyId = Survey.getId(survey)

      const { root } = Survey.getHierarchy(R.always)(surveyParam)

      await
        Survey.traverseHierarchyItem(root, async nodeDef =>
          await NodeDefRepository.insertNodeDef(surveyId, nodeDef, t)
        )

      if (publish) {
        await new SurveyPublishPerformJob({ user, surveyId }).start(t)
        await new SurveyRdbGeneratorJob({ user, surveyId }).start(t)
      }

      return await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, !publish, true, false, t)
    })
  }
}

module.exports = {
  survey: (userId, name, label, lang, rootDefBuilder) => new SurveyBuilder(userId, name, label, lang, rootDefBuilder),
  entity: (name, ...childBuilders) => new EntityDefBuilder(name, ...childBuilders),
  attribute: (name, type) => new AttributeDefBuilder(name, type)
}