import React from 'react'

import { DataQuerySummaries } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { ButtonDelete, ButtonNew, ButtonSave } from '@webapp/components/buttons'

export const DataQueryEditForm = (props) => {
  const { querySummary, setQuerySummary, onDelete, onNew, onSave } = props

  const i18n = useI18n()

  return (
    <div className="data-query-form">
      <FormItem label={i18n.t('common.name')}>
        <Input
          onChange={(value) =>
            setQuerySummary(DataQuerySummaries.assocName(StringUtils.normalizeName(value))(querySummary))
          }
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
        <ButtonSave onClick={onSave} />
        <ButtonDelete onClick={onDelete} />
      </div>
    </div>
  )
}
