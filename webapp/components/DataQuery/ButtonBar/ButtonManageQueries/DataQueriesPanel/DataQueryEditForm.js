import React from 'react'
import PropTypes from 'prop-types'

import { DataQuerySummaries } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'

import { DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { ButtonDelete, ButtonNew, ButtonSave } from '@webapp/components/buttons'

export const DataQueryEditForm = (props) => {
  const { draft, querySummary, setQuerySummary, onDelete, onNew, onSave, validating } = props

  const validation = Validation.getValidation(querySummary)

  const selectedQuerySummaryUuid = DataExplorerSelectors.useSelectedQuerySummaryUuid()

  return (
    <div className="data-query-form">
      <FormItem label="common.name">
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

DataQueryEditForm.propTypes = {
  draft: PropTypes.bool,
  querySummary: PropTypes.object.isRequired,
  setQuerySummary: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  validating: PropTypes.bool,
}
