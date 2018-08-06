import React from 'react'
import { connect } from 'react-redux'

import { FormInput, FormItem } from '../../../../commonComponents/formInput'
import Dropdown from '../../../../commonComponents/dropdown'
import LabelsEditor from '../../labelsEditor'

import {
  nodeDefType,
  getNodeDefLabels,
  getNodeDefDescriptions,
  getNodeDefProp
} from '../../../../../common/survey/nodeDef'
import { normalizeName } from './../../../../../common/survey/surveyUtils'

import { putNodeDefProp } from '../../../nodeDef/actions'

//
const attributeType = type => ({key: type, value: type})

const attributeTypes = [
  attributeType(nodeDefType.integer),
  attributeType(nodeDefType.decimal),

]

class CommonProps extends React.Component {

  render () {
    const {nodeDef, putNodeDefProp} = this.props

    return (
      <React.Fragment>

        <FormItem label={'name'}>
          <FormInput value={getNodeDefProp('name', '')(nodeDef)}
                     onChange={e => putNodeDefProp(nodeDef, 'name', normalizeName(e.target.value))}/>
        </FormItem>

        <FormItem label={'type'}>
          <Dropdown items={attributeTypes}/>
        </FormItem>

        <LabelsEditor labels={getNodeDefLabels(nodeDef)}
          // onChange={(item) => this.onPropsChange(item, 'labels', getSurveyLabels(survey))}/>
                      onChange={(item) => console.log(item)}/>
        <LabelsEditor formLabel="Description(s)"
                      labels={getNodeDefDescriptions(nodeDef)}
          // onChange={(item) => this.onPropsChange(item, 'labels', getSurveyLabels(survey))}/>
                      onChange={(item) => console.log(item)}/>
      </React.Fragment>
    )
  }

}

export default connect(null, {putNodeDefProp})(CommonProps)