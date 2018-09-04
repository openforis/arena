import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Input, FormItem } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import LabelsEditor from '../../labelsEditor'

import {
  getNodeDefLabels,
  getNodeDefDescriptions,
  getNodeDefName,
  isNodeDefKey,
  isNodeDefMultiple,
  canNodeDefBeMultiple,
} from '../../../../../common/survey/nodeDef'
import { isRenderTable } from '../../../../../common/survey/nodeDefLayout'

import { normalizeName } from './../../../../../common/survey/surveyUtils'

import { getValidation, getFieldValidation } from './../../../../../common/validation/validator'

import { putNodeDefProp } from '../../../nodeDef/actions'

class CommonProps extends React.Component {

  onPropLabelsChange (nodeDef, labelItem, key, currentValue) {
    this.props.putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  render () {
    const {nodeDef, putNodeDefProp} = this.props
    const validation = getValidation(nodeDef)

    return (
      <React.Fragment>

        <FormItem label={'name'}>
          <Input value={getNodeDefName(nodeDef)}
                 validation={getFieldValidation('name')(validation)}
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
          <Checkbox checked={isNodeDefKey(nodeDef)}
                    onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
        </FormItem>

        {
          canNodeDefBeMultiple(nodeDef)
            ? <FormItem label={'multiple'}>
              <Checkbox checked={isNodeDefMultiple(nodeDef)}
                        disabled={isRenderTable(nodeDef)}
                        onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
            </FormItem>
            : null
        }

      </React.Fragment>
    )
  }
}

export default connect(null, {putNodeDefProp})(CommonProps)