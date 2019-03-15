const R = require('ramda')

const NodeDefManager = require('../persistence/nodeDefManager')

const updateNodeDefProps = async (user, surveyId, nodeDefUuid, propsArray) => {

  const getIndexedProps = (advanced) => R.pipe(
    R.filter(R.propEq('advanced', advanced)),
    R.reduce((acc, prop) => R.assocPath(R.split('.', prop.key), prop.value)(acc), {})
  )

  const props = getIndexedProps(false)(propsArray)
  const propsAdvanced = getIndexedProps(true)(propsArray)

  return await NodeDefManager.updateNodeDefProps(user, surveyId, nodeDefUuid, props, propsAdvanced)
}

module.exports = {

  createNodeDef: NodeDefManager.createNodeDef,

  fetchNodeDefsBySurveyId: NodeDefManager.fetchNodeDefsBySurveyId,

  updateNodeDefProps,

  markNodeDefDeleted: NodeDefManager.markNodeDefDeleted,

}
