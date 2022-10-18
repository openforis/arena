import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { ButtonIconEdit, ButtonManage } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'
import Dropdown from '@webapp/components/form/Dropdown'
import PanelRight from '@webapp/components/PanelRight'
import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { State } from './store'

const TaxonProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const canUpdateTaxonomy = !NodeDef.isPublished(nodeDef)
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)

  const [taxonomy, setTaxonomy] = useState({})
  const [showTaxonomiesPanel, setShowTaxonomiesPanel] = useState(false)
  const [taxonomyToEdit, setTaxonomyToEdit] = useState(null)

  const onTaxonomySelect = (taxonomySelected) =>
    Actions.setProp({ state, key: NodeDef.propKeys.taxonomyUuid, value: Taxonomy.getUuid(taxonomySelected) })

  const itemsLookupFunction = async (value) => API.fetchTaxonomies({ surveyId, search: value })

  useEffect(() => {
    ;(async () => {
      if (!A.isEmpty(taxonomyUuid)) {
        const taxonomySelected = await API.fetchTaxonomy({ surveyId, taxonomyUuid })
        setTaxonomy(taxonomySelected)
      } else {
        setTaxonomy(null)
      }
    })()
  }, [taxonomyUuid, showTaxonomiesPanel])

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
  }, [taxonomyToEdit])

  return (
    <>
      <FormItem label="Taxonomy">
        <div className="taxonomy-selector">
          <Dropdown
            items={itemsLookupFunction}
            itemKey="uuid"
            itemLabel={Taxonomy.getName}
            validation={Validation.getFieldValidation(NodeDef.propKeys.taxonomyUuid)(validation)}
            selection={taxonomy}
            disabled={!canUpdateTaxonomy}
            onChange={onTaxonomySelect}
            testId={TestId.nodeDefDetails.taxonomySelector}
          />
          {taxonomy && <ButtonIconEdit onClick={() => setTaxonomyToEdit(taxonomy)} size="small" showLabel />}

          <ButtonMetaItemAdd
            id={TestId.nodeDefDetails.taxonomySelectorAddBtn}
            onAdd={setTaxonomyToEdit}
            metaItemType={metaItemTypes.taxonomy}
          />
          <ButtonManage size="small" onClick={() => setShowTaxonomiesPanel(true)} />
        </div>
      </FormItem>

      <LabelsEditor
        formLabelKey="taxonomy.vernacularNameLabel"
        placeholder="surveyForm.nodeDefTaxon.vernacularName"
        labels={NodeDef.getVernacularNameLabels(nodeDef)}
        onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.vernacularNameLabels, value })}
      />

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

TaxonProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default TaxonProps
