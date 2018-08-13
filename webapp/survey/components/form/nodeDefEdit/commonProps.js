import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Input, FormItem } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import LabelsEditor from '../../labelsEditor'

import {
  getNodeDefLabels,
  getNodeDefDescriptions,
  getNodeDefProp,
  getNodeDefPropValidation,
} from '../../../../../common/survey/nodeDef'
import { normalizeName } from './../../../../../common/survey/surveyUtils'

import { putNodeDefProp } from '../../../nodeDef/actions'

class CommonProps extends React.Component {

  onPropLabelsChange (nodeDef, labelItem, key, currentValue) {
    this.props.putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  render () {
    const {nodeDef, putNodeDefProp} = this.props

    return (
      <React.Fragment>

        <FormItem label={'name'}>
          <Input value={getNodeDefProp('name', '')(nodeDef)}
                 validation={getNodeDefPropValidation(nodeDef, 'name')}
                 onChange={e => putNodeDefProp(nodeDef, 'name', normalizeName(e.target.value))}/>
        </FormItem>

        <FormItem label={'type'}>
          <label>{nodeDef.type}</label>
        </FormItem>

        <LabelsEditor labels={getNodeDefLabels(nodeDef)}
                      onChange={(labelItem) => this.onPropLabelsChange(nodeDef, labelItem, 'labels', getNodeDefLabels(nodeDef))}/>

        <LabelsEditor formLabel="Description(s)"
                      labels={getNodeDefDescriptions(nodeDef)}
                      onChange={(labelItem) => this.onPropLabelsChange(nodeDef, labelItem, 'descriptions', getNodeDefDescriptions(nodeDef))}/>

        <FormItem label={'key'}>
          <Checkbox checked={getNodeDefProp('key', false)(nodeDef)}
                    onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
        </FormItem>

        <FormItem label={'multiple'}>
          <Checkbox checked={getNodeDefProp('multiple', false)(nodeDef)}
                    onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
        </FormItem>
      </React.Fragment>
    )
  }
}

export default connect(null, {putNodeDefProp})(CommonProps)