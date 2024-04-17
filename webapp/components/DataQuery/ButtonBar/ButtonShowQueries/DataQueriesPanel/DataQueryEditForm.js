import React from 'react'
import { useSelector } from 'react-redux'

import { DataQuerySummaries } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { DataExplorerState } from '@webapp/store/dataExplorer'

import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { ButtonDelete, ButtonNew, ButtonSave } from '@webapp/components/buttons'

export const DataQueryEditForm = (props) => {
  const { draft, querySummary, setQuerySummary, onDelete, onNew, onSave, validating } = props

  const i18n = useI18n()

  const validation = Validation.getValidation(querySummary)

  const selectedQuerySummaryUuid = useSelector(DataExplorerState.getSelectedQuerySummaryUuid)

  return (
    <div className="data-query-form">
      <FormItem label={i18n.t('common.name')}>
        <Input
          onChange={(value) =>
            setQuerySummary(DataQuerySummaries.assocName(StringUtils.normalizeName(value))(querySummary))
          }
          validation={Validation.getFieldValidation('name')(validation)}
          value={DataQuerySummaries.getName(querySummary)}
        />
      </FormItem>

      <LabelsEditor
        onChange={(labels) => setQuerySummary(DataQuerySummaries.assocLabels(labels)(querySummary))}
        labels={DataQuerySummaries.getLabels(querySummary)}
      />

      <LabelsEditor
        formLabelKey="common.description"
        labels={DataQuerySummaries.getDescriptions(querySummary)}
        onChange={(descriptions) => setQuerySummary(DataQuerySummaries.assocDescriptions(descriptions)(querySummary))}
      />

      <div className="button-bar">
        <ButtonNew onClick={onNew} />
        <ButtonSave disabled={!draft || validating} onClick={onSave} />
        {selectedQuerySummaryUuid && <ButtonDelete onClick={onDelete} />}
      </div>
    </div>
  )
}
