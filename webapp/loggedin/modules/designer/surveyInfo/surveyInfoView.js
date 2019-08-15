import './surveyInfoView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import useI18n from '../../../../commonComponents/useI18n'

import { Input } from '../../../../commonComponents/form/input'
import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'
import LanguagesEditor from './components/languagesEditor'
import SrsEditor from './components/srsEditor'

import Survey from '../../../../../common/survey/survey'
import Authorizer from '../../../../../common/auth/authorizer'
import Validator from '../../../../../common/validation/validator'
import { normalizeName } from '../../../../../common/stringUtils'

import * as SurveyState from '../../../../survey/surveyState'
import * as AppState from '../../../../app/appState'

import { updateSurveyInfoProp } from '../../../../survey/surveyInfo/actions'

const SurveyInfoView = (props) => {
  const { surveyInfo, readOnly, updateSurveyInfoProp } = props
  const validation = Validator.getValidation(surveyInfo)

  const onPropLabelsChange = (item, key, value) => {
    props.updateSurveyInfoProp(
      key,
      R.assoc(item.lang, item.label, value)
    )
  }

  const i18n = useI18n()

  return (
    <div className="home-survey-info">
      <div className="form">
        <div className="form-item">
          <label className="form-label">{i18n.t('common.name')}</label>
          <Input
            value={Survey.getName(surveyInfo)}
            validation={Validator.getFieldValidation('name')(validation)}
            onChange={value => updateSurveyInfoProp('name', normalizeName(value))}
            readOnly={readOnly}/>

        </div>

        <LanguagesEditor
          surveyInfo={surveyInfo}
          readOnly={readOnly}
          updateSurveyInfoProp={updateSurveyInfoProp}
        />

        <div className="form-item">
          <label className="form-label">{i18n.t('common.srs')}</label>
          <SrsEditor
            surveyInfo={surveyInfo}
            readOnly={readOnly}
            updateSurveyInfoProp={updateSurveyInfoProp}
            validation={Validator.getFieldValidation('srs')(validation)}
          />
        </div>

        <LabelsEditor
          labels={Survey.getLabels(surveyInfo)}
          onChange={item => onPropLabelsChange(item, 'labels', Survey.getLabels(surveyInfo))}
          readOnly={readOnly}
        />

        <LabelsEditor
          formLabelKey="common.description"
          labels={Survey.getDescriptions(surveyInfo)}
          onChange={item => onPropLabelsChange(item, 'descriptions', Survey.getDescriptions(surveyInfo))}
          readOnly={readOnly}
        />

      </div>
    </div>
  )
}


const mapStateToProps = state => {
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)
  const readOnly = !Authorizer.canEditSurvey(user, surveyInfo)

  return {
    surveyInfo,
    readOnly,
  }
}

export default connect(
  mapStateToProps, { updateSurveyInfoProp }
)(SurveyInfoView)