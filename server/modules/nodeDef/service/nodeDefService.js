const NodeDefManager = require('../manager/nodeDefManager')

module.exports = {

  insertNodeDef: NodeDefManager.insertNodeDef,

  fetchNodeDefsBySurveyId: NodeDefManager.fetchNodeDefsBySurveyId,

  updateNodeDefProps: NodeDefManager.updateNodeDefProps,

  markNodeDefDeleted: NodeDefManager.markNodeDefDeleted,

}
