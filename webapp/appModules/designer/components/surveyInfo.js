import React from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import * as R from 'ramda'

import { Input } from '../../../commonComponents/form/input'
import InputChips from '../../../commonComponents/form/inputChips'
import LabelsEditorComponent from '../../../survey/components/labelsEditor'
import LanguagesEditorComponent from '../../../survey/components/languagesEditor'

import {
  getSurveyInfo,
  getSurveyName,
  getSurveyDescriptions,
  getSurveyLabels,
  getSurveySrs
} from '../../../../common/survey/survey'

import { getSurvey } from '../../../survey/surveyState'
import { updateSurveyInfoProp } from '../../../survey/surveyInfo/actions'

import { normalizeName } from './../../../../common/survey/surveyUtils'
import { toQueryString } from './../../../../server/serverUtils/request'
import { getValidation, getFieldValidation } from './../../../../common/validation/validator'

const SrsAutocomplete = props => {
  const {selection, validation, onChange} = props

  const itemsLookupFunction = async value => {
    const {data} = await axios.get('/api/srs/find', {
      params: {
        codeOrName: value
      }
    })
    return data.srss
  }

  return <InputChips itemsLookupFunction={itemsLookupFunction}
                     selection={selection}
                     dropdownAutocompleteMinChars={3}
                     validation={validation}
                     onChange={onChange}/>
}

class SurveyInfo extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      surveySrs: []
    }
  }

  componentDidMount() {
    this.fetchSrs()
  }

  componentDidUpdate (prevProps) {
    const {surveyInfo} = this.props
    const {surveyInfo: prevSurveyInfo} = prevProps

    const srsCodes = getSurveySrs(surveyInfo)
    const prevSrsCodes = getSurveySrs(prevSurveyInfo)

    if (!R.equals(srsCodes, prevSrsCodes)) {
      this.fetchSrs()
    }
  }

  fetchSrs () {
    const {surveyInfo} = this.props
    const codes = getSurveySrs(surveyInfo)

    axios.get(`/api/srs?${toQueryString({codes})}`).then(({data}) => {
      this.setState({
        surveySrs: data.srss
      })
    })
  }

  onPropLabelsChange (item, key, currentValue) {
    this.props.updateSurveyInfoProp(key, R.assoc(item.lang, item.label, currentValue))
  }

  render () {
    const {survey, surveyInfo, updateSurveyInfoProp} = this.props
    const {surveySrs} = this.state

    const validation = getValidation(surveyInfo)

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <Input value={getSurveyName(survey)}
                 validation={getFieldValidation('name')(validation)}
                 onChange={e => updateSurveyInfoProp('name', normalizeName(e.target.value))}/>

        </div>

        <LanguagesEditorComponent/>

        <div className="form-item">
          <label className="form-label">SRS</label>
          <SrsAutocomplete selection={R.values(surveySrs)}
                           validation={getFieldValidation('srs')}
                           onChange={(items) => updateSurveyInfoProp('srs', R.pluck('key')(items))}/>
        </div>

        <LabelsEditorComponent labels={getSurveyLabels(survey)}
                               onChange={(item) => this.onPropLabelsChange(item, 'labels', getSurveyLabels(survey))}/>

        <LabelsEditorComponent formLabel="Description(s)"
                               labels={getSurveyDescriptions(survey)}
                               onChange={(item) => this.onPropLabelsChange(item, 'descriptions', getSurveyDescriptions(survey))}/>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  survey: getSurvey(state),
  surveyInfo: getSurveyInfo(getSurvey(state)),
})

export default connect(
  mapStateToProps,
  {
    updateSurveyInfoProp,
  }
)(SurveyInfo)