import React, { useCallback } from 'react'

import * as ObjectUtils from '@core/objectUtils'
import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import PanelRight from '@webapp/components/PanelRight'
import * as API from '@webapp/service/api'
import { SurveyUserExtraPropDefsEditor } from '@webapp/views/App/views/Home/SurveyInfo/SurveyUserExtraPropDefsEditor'

export const SurveyListUserExtraPropsEditor = (props) => {
  const { onClose, survey } = props

  const onSurveyExtraPropDefsArrayUpdate = useCallback(
    async (extraPropDefsArrayUpdated) => {
      const surveyId = Survey.getId(survey)
      const extraPropDefsUpdated = ObjectUtils.toIndexedObj(extraPropDefsArrayUpdated, ExtraPropDef.keys.name)
      const propsUpdated = { ...Survey.getProps(survey), [Survey.infoKeys.userExtraPropDefs]: extraPropDefsUpdated }
      await API.updateSurveyProps({ surveyId, props: propsUpdated })
    },
    [survey]
  )

  const onSurveyExtraPropDefUpdate = useCallback(
    async ({ prevExtraPropDef, extraPropDef }) => {
      const prevExtraPropDefsArray = Survey.getUserExtraPropDefsArray(survey)
      const defIndex = prevExtraPropDefsArray.findIndex(
        (def) => ExtraPropDef.getName(def) === ExtraPropDef.getName(prevExtraPropDef)
      )
      const extraPropDefsArrayUpdated = [...prevExtraPropDefsArray]
      extraPropDefsArrayUpdated[defIndex] = extraPropDef
      await onSurveyExtraPropDefsArrayUpdate(extraPropDefsArrayUpdated)
    },
    [onSurveyExtraPropDefsArrayUpdate, survey]
  )

  const onSurveyExtraPropDefDelete = useCallback((extraPropDef) => {}, [])

  return (
    <PanelRight className="surveys-user-extra-props" onClose={onClose} width="55rem">
      {ProcessUtils.ENV.experimentalFeatures && (
        <SurveyUserExtraPropDefsEditor
          extraPropDefs={Survey.getUserExtraPropDefs(survey)}
          onExtraPropDefDelete={onSurveyExtraPropDefDelete}
          onExtraPropDefUpdate={onSurveyExtraPropDefUpdate}
        />
      )}
    </PanelRight>
  )
}
