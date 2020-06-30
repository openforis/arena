import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import { FormItem } from '@webapp/components/form/input'
import Dropdown from '@webapp/components/form/dropdown'
import { useI18n } from '@webapp/store/system'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useSurvey } from '@webapp/store/survey'
import { createTaxonomy } from '@webapp/loggedin/surveyViews/taxonomy/actions'

import { NodeDefState } from './store'

const TaxonProps = (props) => {
  const { nodeDefState, actions } = props

  const dispatch = useDispatch()
  const history = useHistory()

  const survey = useSurvey()
  const i18n = useI18n()

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)
  const canUpdateTaxonomy = !NodeDef.isPublished(nodeDef)
  const taxonomy = Survey.getTaxonomyByUuid(NodeDef.getTaxonomyUuid(nodeDef))(survey)
  const taxonomies = Survey.getTaxonomiesArray(survey)

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
            itemKeyProp="uuid"
            itemLabelFunction={Taxonomy.getName}
            validation={Validation.getFieldValidation(NodeDef.propKeys.taxonomyUuid)(validation)}
            selection={taxonomy}
            disabled={!canUpdateTaxonomy}
            onChange={(taxonomySelected) =>
              actions.setProp({ key: NodeDef.propKeys.taxonomyUuid, value: Taxonomy.getUuid(taxonomySelected) })
            }
          />
          <button
            type="button"
            className="btn btn-s"
            style={{ justifySelf: 'center' }}
            onClick={() => dispatch(createTaxonomy(history))}
          >
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
          <Link className="btn btn-s" style={{ justifySelf: 'center' }} to={appModuleUri(designerModules.taxonomies)}>
            <span className="icon icon-list icon-12px icon-left" />
            {i18n.t('common.manage')}
          </Link>
        </div>
      </FormItem>
    </>
  )
}

TaxonProps.propTypes = {
  nodeDefState: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
}

export default TaxonProps
