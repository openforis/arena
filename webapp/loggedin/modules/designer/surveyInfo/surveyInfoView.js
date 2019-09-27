import './surveyInfoView.scss'

import React from 'react'
import { connect } from 'react-redux'

import { useI18n } from '../../../../commonComponents/hooks'

import { Input } from '../../../../commonComponents/form/input'
import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'
import LanguagesEditor from './components/languagesEditor'
import SrsEditor from './components/srsEditor'
import CyclesEditor from './components/cyclesEditor'
import { useSurveyInfoViewState } from './components/surveyInfoViewState'

import Authorizer from '../../../../../common/auth/authorizer'

import * as SurveyState from '../../../../survey/surveyState'
import * as AppState from '../../../../app/appState'

import { updateSurveyInfoProps } from '../../../../survey/surveyInfo/actions'

const SurveyInfoView = (props) => {
  const { readOnly } = props

  const i18n = useI18n()

  const {
    name, languages, srs, labels, descriptions, cycles,
    setName, setLanguages, setSrs, setLabel, setDescription, setCycles,
    getFieldValidation, saveProps,
  } = useSurveyInfoViewState(props)

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

        <LabelsEditor
          readOnly={readOnly}
          languages={languages}
          labels={labels}
          onChange={setLabel}
        />

        <LabelsEditor
          readOnly={readOnly}
          formLabelKey="common.description"
          languages={languages}
          labels={descriptions}
          onChange={setDescription}
        />

        <LanguagesEditor
          readOnly={readOnly}
          languages={languages}
          setLanguages={setLanguages}
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

        <div className="form-item">
          <label className="form-label">{i18n.t('common.cycle_plural')}</label>
          <CyclesEditor
            readOnly={readOnly}
            cycles={cycles}
            setCycles={setCycles}
          />
        </div>

        {
          !readOnly &&
          <button className="btn btn-save"
                  onClick={saveProps}>
            <span className="icon icon-floppy-disk icon-12px icon-left"/>
            {i18n.t('common.save')}
          </button>
        }

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
  mapStateToProps, { updateSurveyInfoProps }
)(SurveyInfoView)