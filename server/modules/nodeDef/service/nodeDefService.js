const NodeDefManager = require('../persistence/nodeDefManager')

module.exports = {

  insertNodeDef: NodeDefManager.insertNodeDef,

  fetchNodeDefsBySurveyId: NodeDefManager.fetchNodeDefsBySurveyId,

  updateNodeDefProps: NodeDefManager.updateNodeDefProps,

  markNodeDefDeleted: NodeDefManager.markNodeDefDeleted,

}
