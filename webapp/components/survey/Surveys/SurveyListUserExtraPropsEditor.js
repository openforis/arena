import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as ObjectUtils from '@core/objectUtils'
import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import PanelRight from '@webapp/components/PanelRight'
import * as API from '@webapp/service/api'
import { SurveyUserExtraPropDefsEditor } from '@webapp/views/App/views/Home/SurveyInfo/SurveyUserExtraPropDefsEditor'

export const SurveyListUserExtraPropsEditor = (props) => {
  const { onClose, onUpdate, surveyInfo } = props

  const onSurveyExtraPropDefsUpdate = useCallback(
    async (extraPropDefsUpdated) => {
      const surveyId = Survey.getIdSurveyInfo(surveyInfo)
      const propsUpdated = { ...Survey.getProps(surveyInfo), [Survey.infoKeys.userExtraPropDefs]: extraPropDefsUpdated }
      await API.updateSurveyProps({ surveyId, props: propsUpdated })
      onUpdate?.()
    },
    [onUpdate, surveyInfo]
  )

  const onSurveyExtraPropDefUpdate = useCallback(
    async ({ extraPropDef }) => {
      const prevExtraPropDefsArray = Survey.getUserExtraPropDefsArray(surveyInfo)
      const defIndex = ExtraPropDef.getIndex(extraPropDef)
      const extraPropDefsArrayUpdated = [...prevExtraPropDefsArray]
      extraPropDefsArrayUpdated[defIndex] = extraPropDef
      const extraPropDefsUpdated = ObjectUtils.toIndexedObj(extraPropDefsArrayUpdated, ExtraPropDef.keys.name)
      await onSurveyExtraPropDefsUpdate(extraPropDefsUpdated)
    },
    [onSurveyExtraPropDefsUpdate, surveyInfo]
  )

  const onSurveyExtraPropDefDelete = useCallback(
    async (extraPropDef) => {
      const prevExtraPropDefs = Survey.getUserExtraPropDefs(surveyInfo)
      const extraPropDefsUpdated = { ...prevExtraPropDefs }
      delete extraPropDefsUpdated[ExtraPropDef.getName(extraPropDef)]
      await onSurveyExtraPropDefsUpdate(extraPropDefsUpdated)
    },
    [onSurveyExtraPropDefsUpdate, surveyInfo]
  )

  return (
    <PanelRight
      className="surveys-user-extra-props"
      header="surveysView.editUserExtraPropsForSurvey"
      headerParams={{ surveyName: Survey.getName(surveyInfo) }}
      onClose={onClose}
      width="55rem"
    >
      {ProcessUtils.ENV.experimentalFeatures && (
        <SurveyUserExtraPropDefsEditor
          extraPropDefs={Survey.getUserExtraPropDefs(surveyInfo)}
          onExtraPropDefDelete={onSurveyExtraPropDefDelete}
          onExtraPropDefUpdate={onSurveyExtraPropDefUpdate}
        />
      )}
    </PanelRight>
  )
}

SurveyListUserExtraPropsEditor.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func,
  surveyInfo: PropTypes.object.isRequired,
}
