import { DataQuerySummaries } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'

import { DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { Spinner } from '@webapp/components'
import { isAiFeatureShown, isAiFeatureUsable } from '@webapp/ai/policy/aiFeatureAvailability'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { AiPolicyBlockedTooltip } from '@webapp/components/ai/AiPolicyBlockedTooltip'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { Button, ButtonDelete, ButtonNew, ButtonSave } from '@webapp/components/buttons'

type DataQueryEditFormProps = {
  draft?: boolean
  querySummary: Record<string, any>
  setQuerySummary: (...args: any[]) => any
  onAiSuggestSummary: (...args: any[]) => any
  onDelete: (...args: any[]) => any
  onNew: (...args: any[]) => any
  onSave: (...args: any[]) => any
  summarizing?: boolean
  validating?: boolean
}

export const DataQueryEditForm = (props: DataQueryEditFormProps) => {
  const { draft, querySummary, setQuerySummary, onAiSuggestSummary, onDelete, onNew, onSave, summarizing, validating } =
    props

  const validation = Validation.getValidation(querySummary)

  const selectedQuerySummaryUuid = DataExplorerSelectors.useSelectedQuerySummaryUuid()
  const aiSummarize = useAiFeatureAvailability('dataQuerySummarize')

  return (
    <div className="data-query-form">
      {isAiFeatureShown(aiSummarize) && (
        <div className="data-query-form__ai-bar">
          {summarizing && <Spinner size={18} />}
          <AiPolicyBlockedTooltip availability={aiSummarize}>
            <Button
              className="btn-s btn-ai"
              disabled={summarizing || validating || !isAiFeatureUsable(aiSummarize)}
              iconClassName="icon-magic-wand icon-14px"
              label="dataView:dataQuery.ai.suggestSummary"
              onClick={onAiSuggestSummary}
              title="dataView:dataQuery.ai.suggestSummaryTitle"
              variant="outlined"
            />
          </AiPolicyBlockedTooltip>
          {isAiFeatureUsable(aiSummarize) && <AiFeatureDataLocationBadge feature="dataQuerySummarize" />}
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
