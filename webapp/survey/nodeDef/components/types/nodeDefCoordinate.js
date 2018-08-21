import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import NodeDefFormItem from './nodeDefFormItem'
import { getNodeValue } from '../../../../../common/record/record'
import { getSurveySrs } from '../../../../../common/survey/survey'
import { getCurrentSurvey } from '../../../surveyState'
import { toSrsItems } from '../../../../../common/app/srs'

class NodeDefCoordinate extends React.Component {

  getValue () {
    const { entry, node } = this.props

    return entry && node ? getNodeValue(node) : {}
  }

  handleInputChange (field, value) {
    const prevValue = this.getValue()
    const attrValue = R.assoc(field, value)(prevValue)

    this.props.onChange({
      value: attrValue
    })
  }

  render () {
    const {survey, nodeDef, draft, edit} = this.props
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