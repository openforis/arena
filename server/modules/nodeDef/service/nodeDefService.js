const NodeDefManager = require('../persistence/nodeDefManager')

module.exports = {

  createNodeDef: NodeDefManager.createNodeDef,

  fetchNodeDefsBySurveyId: NodeDefManager.fetchNodeDefsBySurveyId,

  updateNodeDefProps: NodeDefManager.updateNodeDefProps,

  markNodeDefDeleted: NodeDefManager.markNodeDefDeleted,

}
