import '../react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import NodeDefEntityTable from './nodeDefEntityTable'
import NodeDefEntityForm from './nodeDefEntityForm'

import { getNodeDefChildren } from '../../../../../common/survey/survey'
import {
  isRenderForm,
  isRenderTable,
} from '../../../../../common/survey/nodeDefLayout'

import { putNodeDefProp, } from '../../actions'
import { getSurvey } from '../../../surveyState'

class NodeDefEntitySwitch extends React.Component {

  render () {
    const {nodeDef} = this.props

    if (isRenderForm(nodeDef))
      return <NodeDefEntityForm {...this.props} />
    else if (isRenderTable(nodeDef))
      return <NodeDefEntityTable {...this.props} />

    return null
  }
}

NodeDefEntitySwitch.defaultProps = {
  entityDef: {},
  draft: false,
  edit: false,
}

const mapStateToProps = (state, props) => ({
  childDefs: getNodeDefChildren(props.nodeDef)(getSurvey(state)),
})

export default connect(
  mapStateToProps,
  {putNodeDefProp}
)(NodeDefEntitySwitch)