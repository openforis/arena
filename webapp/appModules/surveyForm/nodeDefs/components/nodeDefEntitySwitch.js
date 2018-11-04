import '../../style/react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import NodeDefEntityTable from './nodeDefEntityTable'
import NodeDefEntityForm from './nodeDefEntityForm'

import Survey from '../../../../../common/survey/survey'

import {
  isRenderForm,
  isRenderTable,
} from '../../../../../common/survey/nodeDefLayout'

import { putNodeDefProp, } from '../../actions'
import { getSurvey } from '../../../../survey/surveyState'

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
  edit: false,
}

const mapStateToProps = (state, props) => ({
  childDefs: Survey.getNodeDefChildren(props.nodeDef)(getSurvey(state)),
})

export default connect(
  mapStateToProps,
  {putNodeDefProp}
)(NodeDefEntitySwitch)