import './surveyInfoView.scss'

import React from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../commonComponents/useI18n'

import { Input } from '../../../../commonComponents/form/input'
import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'
import LanguagesEditor from './components/languagesEditor'
import SrsEditor from './components/srsEditor'
import { useSurveyInfoState } from './components/surveyInfoState'

import Authorizer from '../../../../../common/auth/authorizer'

import * as SurveyState from '../../../../survey/surveyState'
import * as AppState from '../../../../app/appState'

import { updateSurveyInfoProp } from '../../../../survey/surveyInfo/actions'

const SurveyInfoView = (props) => {
  const { readOnly } = props

  const i18n = useI18n()

  const {
    name, languages, srs, labels, descriptions,
    setName, setLanguageCodes, setSrs, setLabel, setDescription,
    getFieldValidation,
  } = useSurveyInfoState(props)

  return (
    <div className="home-survey-info">
      <div className="form">
        <div className="form-item">
          <label className="form-label">{i18n.t('common.name')}</label>
          <Input
            value={name}
            validation={getFieldValidation('name')}
            onChange={setName}
            readOnly={readOnly}/>

        </div>

        <LanguagesEditor
          readOnly={readOnly}
          languages={languages}
          setLanguageCodes={setLanguageCodes}
        />

        <div className="form-item">
          <label className="form-label">{i18n.t('common.srs')}</label>
          <SrsEditor
            readOnly={readOnly}
            srs={srs}
            setSrs={setSrs}
            validation={getFieldValidation('srs')}
          />
        </div>

        <LabelsEditor
          readOnly={readOnly}
          labels={labels}
          onChange={setLabel}
        />

        <LabelsEditor
          readOnly={readOnly}
          formLabelKey="common.description"
          labels={descriptions}
          onChange={setDescription}
        />

        <button className="btn btn-save">
          <span className="icon icon-floppy-disk icon-12px icon-left"/>
          {i18n.t('common.save')}
        </button>

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