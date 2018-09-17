import './codeListItemEdit.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import LabelsEditor from '../../components/labelsEditor'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getSurveyDefaultLanguage } from '../../../../common/survey/survey'
import { getCodeListItemCode, getCodeListItemLabel, getCodeListItemLabels } from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import { getSurvey } from '../../surveyState'
import { putCodeListItemProp } from '../../codeList/actions'

class CodeListItemEdit extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      edit: false,
    }
  }

  onPropLabelsChange (nodeDef, labelItem, key, currentValue) {
    this.props.putCodeListItemProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  render() {
    const {survey, item} = this.props
    const language = getSurveyDefaultLanguage(survey)

    return <div className="codeListItem">
      {
        edit
          ? <React.Fragment>
              <FormItem label={'code'}>
                <Input value={getCodeListItemCode(item)}
                       validation={getFieldValidation('code')(validation)}
                       onChange={e => putCodeListItemProp(item.uuid, 'code', normalizeName(e.target.value))}/>
              </FormItem>
              <LabelsEditor labels={getCodeListItemLabels(item)}
                            onChange={(labelItem) => this.onPropLabelsChange(item, labelItem, 'labels', getCodeItemLabels(item))}/>
          </React.Fragment>
          : <React.Fragment>
              <label>{getCodeListItemCode(item)}</label>
              <label>{getCodeListItemLabel(language)(item)}</label>
            </React.Fragment>
      }
    </div>
  }
}

const mapStateToProps = (state) => ({
  survey: getSurvey(state),
})

export default connect(mapStateToProps, {putCodeListItemProp})(CodeListItemEdit)