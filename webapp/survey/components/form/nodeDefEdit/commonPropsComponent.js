import React from 'react'
import { FormInput } from '../../../../commonComponents/formInputComponents'
import DropdownComponent from '../../../../commonComponents/dropdownComponent'

import { attributeDefType, getNodeDefLabels, getNodeDefDescriptions } from '../../../../../common/survey/nodeDef'
import FormLabelsEditorComponent from '../../labelsEditorComponent'
import { getSurveyLabels, getSurveyLanguages } from '../../../../../common/survey/survey'

const attributeType = type => ({key: type, value: type})

const attributeTypes = [
  attributeType(attributeDefType.integer),
  attributeType(attributeDefType.decimal),

]

class CommonPropsComonent extends React.Component {

  render () {
    const {nodeDef} = this.props

    return (
      <React.Fragment>

        <div className="form-item">
          <label className="form-label">Name</label>
          <FormInput/>
        </div>

        <div className="form-item">
          <label className="form-label">Type</label>
          <DropdownComponent items={attributeTypes}/>
        </div>

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