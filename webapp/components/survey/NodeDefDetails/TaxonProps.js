import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { DataTestId } from '@webapp/utils/dataTestId'

import { FormItem } from '@webapp/components/form/Input'
import Dropdown from '@webapp/components/form/Dropdown'
import PanelRight from '@webapp/components/PanelRight'
import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'

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

  return (
    <>
      <FormItem label="Taxonomy">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(2, 100px)',
          }}
        >
          <Dropdown
            items={itemsLookupFunction}
            itemKey="uuid"
            itemLabel={Taxonomy.getName}
            idInput={DataTestId.nodeDefDetails.taxonomySelector}
            validation={Validation.getFieldValidation(NodeDef.propKeys.taxonomyUuid)(validation)}
            selection={taxonomy}
            disabled={!canUpdateTaxonomy}
            onChange={onTaxonomySelect}
          />
          <ButtonMetaItemAdd
            id={DataTestId.nodeDefDetails.taxonomySelectorAddBtn}
            onAdd={setTaxonomyToEdit}
            metaItemType={metaItemTypes.taxonomy}
          />
          <button
            type="button"
            className="btn btn-s"
            style={{ justifySelf: 'center' }}
            onClick={() => setShowTaxonomiesPanel(true)}
          >
            <span className="icon icon-list icon-12px icon-left" />
            {i18n.t('common.manage')}
          </button>
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
          <PanelRight
            width="100vw"
            onClose={() => {
              onTaxonomySelect(taxonomyToEdit)
              setTaxonomyToEdit(null)
            }}
            header={i18n.t('taxonomy.header')}
          >
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
