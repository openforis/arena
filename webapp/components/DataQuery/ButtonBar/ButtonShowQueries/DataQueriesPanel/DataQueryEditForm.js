import React, { useCallback, useState } from 'react'

// import { UUIDs } from '@openforis/arena-core'
// import { DataQuerySummaries } from '@openforis/arena-server'

// import { FormItem, Input } from '@webapp/components/form/Input'
// import LabelsEditor from '@webapp/components/survey/LabelsEditor'
// import { ButtonSave } from '@webapp/components/buttons'

// import * as API from '@webapp/service/api'
// import { useI18n } from '@webapp/store/system'
// import { useSurveyId } from '@webapp/store/survey'

export const DataQueryEditForm = (props) => {
  //   const { dataQuerySummary, query } = props

  //   const i18n = useI18n()
  //   const surveyId = useSurveyId()

  //   const [state, setState] = useState({
  //     editedQuerySummary: dataQuerySummary ?? DataQuerySummaries.create(),
  //   })
  //   const { editedQuerySummary } = state

  //   const updateDataQuerySummary = (updatedDataQuerySummary) =>
  //     setState((statePrev) => ({
  //       ...statePrev,
  //       editedQuerySummary: updatedDataQuerySummary,
  //     }))

  //   const onSaveClick = useCallback(async () => {
  //     const insertedDataQuerySummary = await API.insertDataQuerySummary({ surveyId, querySummary: editedQuerySummary })
  //     console.log(insertedDataQuerySummary)
  //   }, [editedQuerySummary, surveyId])

  return (
    <>
      {/* <FormItem label={i18n.t('common.name')}>
        <Input
          onChange={(value) => updateDataQuerySummary(DataQuerySummaries.assocName(value))}
          value={DataQuerySummaries.getName(editedQuerySummary)}
        />
      </FormItem>

      <LabelsEditor
        labels={DataQuerySummaries.getLabels(editedQuerySummary)}
        onChange={(labels) => updateDataQuerySummary(DataQuerySummaries.assocLabels(labels))}
      />

      <LabelsEditor
        formLabelKey="common.description"
        labels={DataQuerySummaries.getDescriptions(editedQuerySummary)}
        onChange={(descriptions) => updateDataQuerySummary(DataQuerySummaries.assocDescriptions(descriptions))}
      />

      <ButtonSave onClick={onSaveClick} /> */}
    </>
  )
}
