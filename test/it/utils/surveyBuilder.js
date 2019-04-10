const R = require('ramda')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')

class NodeDefBuilder {

  constructor (name) {
    this.props = {}
    this.props[NodeDef.propKeys.name] = name
  }

  multiple () {
    this.props[NodeDef.propKeys.multiple] = true
    return this
  }
}

class EntityDefBuilder extends NodeDefBuilder {

  constructor (name, ...childBuilders) {
    super(name)
    this.childBuilders = childBuilders
  }

  build (parentDefUUid = null) {
    const def = NodeDef.newNodeDef(NodeDef.nodeDefType.entity, parentDefUUid, this.props)

    const defUuid = NodeDef.getUuid(def)

    return R.pipe(
      R.map(childBuilder => childBuilder.build(defUuid)),
      R.mergeAll,
      R.assoc(defUuid, def),
    )(this.childBuilders)
  }
}

class AttributeDefBuilder extends NodeDefBuilder {

  constructor (name, type) {
    super(name)
    this.type = type
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

  build (parentDefUuid = null) {
    const def = NodeDef.newNodeDef(this.type, parentDefUuid, this.props)

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
    const survey = Survey.createSurvey(this.userId, this.name, this.label, this.lang)
    const nodeDefs = this.rootDefBuilder.build()
    return Survey.assocNodeDefs(nodeDefs)(survey)
  }

}

module.exports = {
  survey: (userId, name, label, lang, rootDefBuilder) => new SurveyBuilder(userId, name, label, lang, rootDefBuilder),
  entity: (name, ...childBuilders) => new EntityDefBuilder(name, childBuilders),
  attribute: (name) => new AttributeDefBuilder(name)
}