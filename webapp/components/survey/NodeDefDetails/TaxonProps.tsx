import { useCallback, useMemo, useState } from 'react'

import { NodeDefs } from '@openforis/arena-core'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import { ButtonIconEdit, ButtonManage } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import Dropdown from '@webapp/components/form/Dropdown'
import { FormItem } from '@webapp/components/form/Input'
import PanelRight from '@webapp/components/PanelRight'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'
import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import * as API from '@webapp/service/api'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'
import { useTaxonomyByUuid } from '@webapp/store/survey/hooks'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import { TaxonomySelector } from '../TaxonomySelector'

import { State, useNodeDefEditReadOnly } from './store'

const valueProps = Node.valuePropsTaxon

const visibleFieldsDropdownItems = [
  NodeDef.visibleFieldsDefaultByType[NodeDef.nodeDefType.taxon],
  [valueProps.code, valueProps.scientificName],
  [valueProps.scientificName],
  [valueProps.scientificName, valueProps.vernacularName],
]

type TaxonPropsProps = {
  state: Record<string, any>
  Actions: Record<string, any>
}

const TaxonProps = (props: TaxonPropsProps) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()
  const readOnly = useNodeDefEditReadOnly()

  const [showTaxonomiesPanel, setShowTaxonomiesPanel] = useState(false)
  const [taxonomyToEdit, setTaxonomyToEdit] = useState(null)

  const nodeDef = useMemo(() => State.getNodeDef(state), [state])
  const validation = useMemo(() => State.getValidation(state), [state])

  const taxonomyUuid = useMemo(() => NodeDef.getTaxonomyUuid(nodeDef), [nodeDef])
  const taxonomy = useTaxonomyByUuid(taxonomyUuid)

  const canUpdateTaxonomy = !NodeDef.isPublished(nodeDef) || Survey.isTemplate(surveyInfo)

  const onTaxonomySelect = useCallback(
    (taxonomySelected) =>
      Actions.setProp({ state, key: NodeDef.propKeys.taxonomyUuid, value: Taxonomy.getUuid(taxonomySelected) }),
    [Actions, state]
  )

  const onTaxonomyEditPanelClose = useCallback(async () => {
    const taxonomyEditedUuid = taxonomyToEdit.uuid

    // on edit panel close, delete the taxonomy if empty
    if (await API.deleteTaxonomyIfEmpty({ surveyId, taxonomyUuid: taxonomyEditedUuid })) {
      if (taxonomyUuid === taxonomyEditedUuid) {
        // previously selected taxonomy has been deleted
        onTaxonomySelect(null)
      }
    } else if (!taxonomyUuid) {
      // new taxonomy added, select it
      onTaxonomySelect(taxonomyToEdit)
    }
    setTaxonomyToEdit(null)
  }, [onTaxonomySelect, surveyId, taxonomyToEdit, taxonomyUuid])

  const visibleFieldsLabelFunction = (fields) =>
    fields.map((field) => i18n.t(`surveyForm:nodeDefTaxon.${field}`)).join(', ')

  return (
    <>
      <FormItem label="taxonomy.header">
        <div className="taxonomy-selector">
          <TaxonomySelector
            disabled={readOnly || !canUpdateTaxonomy}
            onChange={onTaxonomySelect}
            selectedTaxonomyUuid={taxonomyUuid}
            testId={TestId.nodeDefDetails.taxonomySelector}
            validation={Validation.getFieldValidation(NodeDef.propKeys.taxonomyUuid)(validation)}
          />
          {taxonomy && (
            <ButtonIconEdit onClick={() => setTaxonomyToEdit(taxonomy)} size="small" showLabel variant="outlined" />
          )}

          <ButtonMetaItemAdd
            id={TestId.nodeDefDetails.taxonomySelectorAddBtn}
            onAdd={setTaxonomyToEdit}
            metaItemType={metaItemTypes.taxonomy}
            variant="outlined"
          />
          <ButtonManage size="small" onClick={() => setShowTaxonomiesPanel(true)} />
        </div>
      </FormItem>

      <FormItem label="surveyForm:nodeDefTaxon.visibleFields">
        <Dropdown
          disabled={readOnly}
          items={visibleFieldsDropdownItems}
          itemLabel={visibleFieldsLabelFunction}
          itemValue={JSON.stringify}
          onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.visibleFields, value })}
          selection={NodeDef.getVisibleFields(nodeDef)}
        />
      </FormItem>

      <LabelsEditor
        formLabelKey="taxonomy.vernacularNameLabel"
        placeholder="surveyForm:nodeDefTaxon.vernacularName"
        labels={NodeDef.getVernacularNameLabels(nodeDef)}
        onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.vernacularNameLabels, value })}
        readOnly={readOnly}
      />

      <FormItem
        label="surveyForm:nodeDefTaxon.vernacularNameSelectionKept"
        info="surveyForm:nodeDefTaxon.vernacularNameSelectionKeptInfo"
        infoTitleMaxWidth={600}
        isInfoMarkdown
      >
        <div className="form-item_body">
          <Checkbox
            checked={NodeDef.isVernacularNameSelectionKept(nodeDef)}
            disabled={readOnly}
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.vernacularNameSelectionKept, value })}
            validation={Validation.getFieldValidation(NodeDef.propKeys.vernacularNameSelectionKept)(validation)}
          />
          <FormItem
            label="surveyForm:nodeDefTaxon.vernacularNameAlwaysIncludedIfSingle"
            info="surveyForm:nodeDefTaxon.vernacularNameAlwaysIncludedIfSingleInfo"
            infoTitleMaxWidth={600}
            isInfoMarkdown
          >
            <Checkbox
              checked={NodeDefs.isVernacularNameAlwaysIncludedIfSingle(nodeDef)}
              disabled={readOnly}
              onChange={(value) =>
                Actions.setProp({ state, key: NodeDef.propKeys.vernacularNameAlwaysIncludedIfSingle, value })
              }
              validation={Validation.getFieldValidation(NodeDef.propKeys.vernacularNameAlwaysIncludedIfSingle)(
                validation
              )}
            />
          </FormItem>
        </div>
      </FormItem>

      <div className="taxon-props__panel-right">
        {showTaxonomiesPanel && !taxonomyToEdit && (
          <PanelRight
            width="100vw"
            onClose={() => setShowTaxonomiesPanel(false)}
            header={i18n.t('appModules.taxonomies')}
          >
            <TaxonomyList
              canSelect
              selectedItemUuid={taxonomyUuid}
              onSelect={onTaxonomySelect}
              onTaxonomyCreated={setTaxonomyToEdit}
              onTaxonomyOpen={setTaxonomyToEdit}
            />
          </PanelRight>
        )}

        {taxonomyToEdit && (
          <PanelRight width="100vw" onClose={onTaxonomyEditPanelClose} header={i18n.t('taxonomy.header')}>
            <TaxonomyDetails showClose={false} taxonomyUuid={Taxonomy.getUuid(taxonomyToEdit)} />
          </PanelRight>
        )}
      </div>
    </>
  )
}

export default TaxonProps
