import React from 'react'

import { FormInput, FormItemComponent } from '../../../../commonComponents/formInputComponents'
import DropdownComponent from '../../../../commonComponents/dropdownComponent'
import FormLabelsEditorComponent from '../../labelsEditorComponent'

import { nodeDefType, getNodeDefLabels, getNodeDefDescriptions } from '../../../../../common/survey/nodeDef'
import { normalizeName } from './../../../../../common/survey/surveyUtils'

const attributeType = type => ({key: type, value: type})

const attributeTypes = [
  attributeType(nodeDefType.integer),
  attributeType(nodeDefType.decimal),

]

class CommonPropsComonent extends React.Component {

  render () {
    const {nodeDef} = this.props

    return (
      <React.Fragment>

        <FormItemComponent label={'name'}>
          <FormInput/>
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

export default CommonPropsComonent