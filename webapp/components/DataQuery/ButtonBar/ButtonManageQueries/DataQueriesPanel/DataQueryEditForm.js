import PropTypes from 'prop-types'

import { DataQuerySummaries } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'

import { DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { Spinner } from '@webapp/components'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { Button, ButtonDelete, ButtonNew, ButtonSave } from '@webapp/components/buttons'

export const DataQueryEditForm = (props) => {
  const { draft, querySummary, setQuerySummary, onAiSuggestSummary, onDelete, onNew, onSave, summarizing, validating } =
    props

  const validation = Validation.getValidation(querySummary)

  const selectedQuerySummaryUuid = DataExplorerSelectors.useSelectedQuerySummaryUuid()
  const aiEnabled = useAiFeatureEnabled('dataQuery')

  return (
    <div className="data-query-form">
      {aiEnabled && (
        <div className="data-query-form__ai-bar">
          {summarizing && <Spinner size={18} />}
          <Button
            className="btn-s btn-ai"
            disabled={summarizing || validating}
            iconClassName="icon-magic-wand icon-14px"
            label="dataView:dataQuery.ai.suggestSummary"
            onClick={onAiSuggestSummary}
            title="dataView:dataQuery.ai.suggestSummaryTitle"
            variant="outlined"
          />
        </div>
      )}

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
        <ButtonSave disabled={!draft || validating || summarizing} onClick={onSave} />
        {selectedQuerySummaryUuid && <ButtonDelete onClick={onDelete} />}
      </div>
    </div>
  )
}

DataQueryEditForm.propTypes = {
  draft: PropTypes.bool,
  querySummary: PropTypes.object.isRequired,
  setQuerySummary: PropTypes.func.isRequired,
  onAiSuggestSummary: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  summarizing: PropTypes.bool,
  validating: PropTypes.bool,
}
