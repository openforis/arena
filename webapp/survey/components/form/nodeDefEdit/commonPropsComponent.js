import React from 'react'
import { connect } from 'react-redux'

import { FormInput, FormItemComponent } from '../../../../commonComponents/formInputComponents'
import DropdownComponent from '../../../../commonComponents/dropdownComponent'
import FormLabelsEditorComponent from '../../labelsEditorComponent'

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

class CommonPropsComonent extends React.Component {

  render () {
    const {nodeDef, putNodeDefProp} = this.props

    return (
      <React.Fragment>

        <FormItemComponent label={'name'}>
          <FormInput value={getNodeDefProp('name', '')(nodeDef)}
                     onChange={e => putNodeDefProp(nodeDef, 'name', normalizeName(e.target.value))}/>
        </FormItemComponent>

        <FormItemComponent label={'type'}>
          <DropdownComponent items={attributeTypes}/>
        </FormItemComponent>

        <FormLabelsEditorComponent labels={getNodeDefLabels(nodeDef)}
          // onChange={(item) => this.onPropsChange(item, 'labels', getSurveyLabels(survey))}/>
                                   onChange={(item) => console.log(item)}/>
        <FormLabelsEditorComponent formLabel="Description(s)"
                                   labels={getNodeDefDescriptions(nodeDef)}
          // onChange={(item) => this.onPropsChange(item, 'labels', getSurveyLabels(survey))}/>
                                   onChange={(item) => console.log(item)}/>
      </React.Fragment>
    )
  }

}

export default connect(null, {putNodeDefProp})(CommonPropsComonent)