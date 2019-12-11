import React from 'react'
import { connect } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import { FormItem } from '@webapp/commonComponents/form/input'
import Dropdown from '@webapp/commonComponents/form/dropdown'
import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import * as SurveyState from '@webapp/survey/surveyState'
import { putNodeDefProp } from '@webapp/survey/nodeDefs/actions'
import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'
import * as NodeDefEditState from '../nodeDefEditState'

import { createTaxonomy, deleteTaxonomy } from '../../taxonomy/actions'

const { propKeys } = NodeDef

const TaxonProps = props => {
  const {
    nodeDef,
    validation,
    taxonomies,
    taxonomy,
    canUpdateTaxonomy,

    putNodeDefProp,
    createTaxonomy,
  } = props

  const putTaxonomyProp = taxonomy => putNodeDefProp(nodeDef, propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy))

  const i18n = useI18n()
  const history = useHistory()

  return (
    <React.Fragment>
      <FormItem label={'Taxonomy'}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(2, 100px)',
          }}
        >
          <Dropdown
            items={taxonomies}
            itemKeyProp={'uuid'}
            itemLabelFunction={Taxonomy.getName}
            validation={Validation.getFieldValidation(propKeys.taxonomyUuid)(validation)}
            selection={taxonomy}
            disabled={!canUpdateTaxonomy}
            onChange={putTaxonomyProp}
          />
          <button
            className="btn btn-s"
            style={{ justifySelf: 'center' }}
            onClick={async () => {
              putTaxonomyProp(await createTaxonomy(history))
            }}
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
    </React.Fragment>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDef = NodeDefEditState.getNodeDef(state)

  return {
    taxonomy: Survey.getTaxonomyByUuid(NodeDef.getTaxonomyUuid(nodeDef))(survey),
    taxonomies: Survey.getTaxonomiesArray(survey),
    canUpdateTaxonomy: Survey.canUpdateTaxonomy(nodeDef)(survey),
  }
}

export default connect(mapStateToProps, {
  putNodeDefProp,
  createTaxonomy,
  deleteTaxonomy,
})(TaxonProps)
