import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { getNodeValue } from '../../../../../common/record/record'
import { getSurveySrs } from '../../../../../common/survey/survey'
import { toSrsItems } from '../../../../../common/app/srs'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import NodeDefFormItem from './nodeDefFormItem'

import { getCurrentSurvey } from '../../../surveyState'

class NodeDefCoordinate extends React.Component {

  getValue () {
    const {entry, nodes} = this.props
    return entry ? getNodeValue(nodes[0]) : {}
  }

  handleInputChange (field, value) {
    const {nodeDef, nodes, updateNodeValue} = this.props

    const newValue = R.assoc(field, value)(this.getValue())

    updateNodeValue(nodeDef, nodes[0], newValue)
  }

  render () {
    const {survey, nodeDef, edit} = this.props

    const value = this.getValue()
    const srsItems = toSrsItems(getSurveySrs(survey))

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr'
        }}>
          <FormItem label="X">
            <Input ref="xInput"
                   readOnly={edit}
                   value={value.x}
                   onChange={(e) => this.handleInputChange('x', e.target.value)}/>
          </FormItem>
          <FormItem label="Y">
            <Input ref="yInput"
                   readOnly={edit}
                   value={value.y}
                   onChange={(e) => this.handleInputChange('y', e.target.value)}/>
          </FormItem>
          <FormItem label="SRS">
            <Dropdown ref="srsDropdown"
                      readOnly={edit}
                      items={srsItems}
                      selection={value.srs}
                      onChange={(selection) => this.handleInputChange('srs', R.prop('key')(selection))}/>
          </FormItem>
        </div>
      </NodeDefFormItem>
    )
  }
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
})

export default connect(mapStateToProps)(NodeDefCoordinate)