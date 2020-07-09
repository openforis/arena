import './TaxonProps.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import { FormItem } from '@webapp/components/form/input'
import Dropdown from '@webapp/components/form/Dropdown'
import PanelRight from '@webapp/components/PanelRight'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'

import { State } from './store'

const TaxonProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const canUpdateTaxonomy = !NodeDef.isPublished(nodeDef)
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxonomy = Survey.getTaxonomyByUuid(taxonomyUuid)(survey)
  const taxonomies = Survey.getTaxonomiesArray(survey)

  const [showTaxonomiesPanel, setShowTaxonomiesPanel] = useState(false)
  const [showTaxonomyPanel, setShowTaxonomyPanel] = useState(false)
  const [taxonomyToEdit, setTaxonomyToEdit] = useState(null)

  const onTaxonomySelect = (taxonomySelected) =>
    Actions.setProp({ state, key: NodeDef.propKeys.taxonomyUuid, value: Taxonomy.getUuid(taxonomySelected) })

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
            items={taxonomies}
            itemKey="uuid"
            itemLabel={Taxonomy.getName}
            validation={Validation.getFieldValidation(NodeDef.propKeys.taxonomyUuid)(validation)}
            selection={taxonomy}
            disabled={!canUpdateTaxonomy}
            onChange={onTaxonomySelect}
          />
          <button
            type="button"
            className="btn btn-s"
            style={{ justifySelf: 'center' }}
            onClick={() => {
              setShowTaxonomyPanel(true)
            }}
          >
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
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
        {(showTaxonomyPanel || taxonomyToEdit) && (
          <PanelRight
            width="100vw"
            onClose={() => {
              setShowTaxonomyPanel(false)
              setTaxonomyToEdit(null)
            }}
            header={i18n.t('taxonomy.header')}
          >
            <TaxonomyDetails showClose={false} onTaxonomyCreated={onTaxonomySelect} taxonomy={taxonomyToEdit} />
          </PanelRight>
        )}
        {!showTaxonomyPanel && showTaxonomiesPanel && !taxonomyToEdit && (
          <PanelRight
            width="100vw"
            onClose={() => setShowTaxonomiesPanel(false)}
            header={i18n.t('appModules.taxonomies')}
          >
            <TaxonomyList
              canSelect
              selectedItemUuid={taxonomyUuid}
              onSelect={onTaxonomySelect}
              onOpenTaxonomy={(taxonomySelected) => {
                setTaxonomyToEdit(taxonomySelected)
              }}
            />
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
