const R = require('ramda')

const Job = require('../../job/job')

const NodeDefManager = require('../../nodeDef/nodeDefManager')
const SurveyManager = require('../../survey/surveyManager')

const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')

//TODO move it to exprParser?
const findReferencedNodeDefNames = expr => {
  if (!expr) {
    return []
  }

  const names = []
  const regex = /(node|sibling)\('(\w+)'\)/g

  let matches
  while (matches = regex.exec(expr)) {
    names.push(matches[2])
  }
  return names
}

//TODO move it to exprParser?
const findSourceNamesByExpressions = nodeDefExpressions => {
  const names = []

  for (const nodeDefExpr of nodeDefExpressions) {
    names.push.apply(names, findReferencedNodeDefNames(NodeDefExpression.getExpression(nodeDefExpr)))
    names.push.apply(names, findReferencedNodeDefNames(NodeDefExpression.getApplyIf(nodeDefExpr)))
  }

  return names
}

class SurveyDependencyGraphsGenerationJob extends Job {

  constructor (params) {
    super(SurveyDependencyGraphsGenerationJob.type, params)
  }

  async execute (tx) {
    const surveyId = this.surveyId

    const nodeDefsByUuid = await NodeDefManager.fetchNodeDefsBySurveyId(surveyId, true, true, false, tx)
    const nodeDefs = R.values(nodeDefsByUuid)

    const dependencyGraphs = new DependencyGraphs(nodeDefs)

    for (const nodeDef of nodeDefs) {
      dependencyGraphs.addSources(nodeDef, 'defaultValues', NodeDef.getDefaultValues(nodeDef))
      dependencyGraphs.addSources(nodeDef, 'calculatedValues', R.pathOr([], ['props', 'calculatedValues'], nodeDef)) //TODO use NodeDef function
      dependencyGraphs.addSources(nodeDef, 'relevance', R.pathOr([], ['props', 'applicable'], nodeDef)) //TODO use NodeDef function
      dependencyGraphs.addSources(nodeDef, 'validations', R.pathOr([], ['props', 'validations', 'expressions'], nodeDef)) //TODO use NodeDef function
    }

    await SurveyManager.updateSurveyDependencyGraphs(surveyId, dependencyGraphs.toJson(), tx)
  }
}

SurveyDependencyGraphsGenerationJob.type = 'SurveyDependencyGraphsGenerationJob'

class DependencyGraphs {

  constructor (nodeDefs) {
    this.nodeDefs = nodeDefs
    this.graphsByNodeDefUuid = {}
  }

  /**
   * Finds the sources of the specified expressions and adds the nodeDef as dependent of that sources
   */
  addSources (nodeDef, dependencyType, nodeDefExpressions) {
    const sourceNames = findSourceNamesByExpressions(nodeDefExpressions)
    for (const sourceName of sourceNames) {
      const source = this.findNodeDefByName(sourceName)
      this.addDependent(source.uuid, dependencyType, nodeDef)
    }
  }

  addDependent (nodeUuid, dependencyType, dependentNodeDef) {
    const dependents = R.append(dependentNodeDef.uuid, this.getDependents(nodeUuid, dependencyType))
    this.graphsByNodeDefUuid = R.assocPath([nodeUuid, dependencyType], dependents, this.graphsByNodeDefUuid)
  }

  getDependents (nodeUuid, dependencyType) {
    return R.pathOr([], [nodeUuid, dependencyType], this.graphsByNodeDefUuid)
  }

  findNodeDefByName (name) {
    return R.find(n => NodeDef.getNodeDefName(n) === name, this.nodeDefs)
  }

  toJson () {
    return this.graphsByNodeDefUuid
  }
}

module.exports = SurveyDependencyGraphsGenerationJob