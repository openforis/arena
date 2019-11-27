import React from 'react'
import {connect} from 'react-redux'

import {FormItem} from '@webapp/commonComponents/form/input'
import Dropdown from '@webapp/commonComponents/form/dropdown'
import {useI18n} from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import * as SurveyState from '@webapp/survey/surveyState'
import {putNodeDefProp} from '@webapp/survey/nodeDefs/actions'
import * as NodeDefEditState from '../nodeDefEditState'

import {createTaxonomy, deleteTaxonomy} from '../../taxonomyEdit/actions'

const {propKeys} = NodeDef

const TaxonProps = props => {
  const {
    nodeDef, validation,
    taxonomies,
    taxonomy,
    canUpdateTaxonomy,

    putNodeDefProp,
    createTaxonomy,
    toggleTaxonomyEdit,
  } = props

  const putTaxonomyProp = taxonomy => putNodeDefProp(nodeDef, propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy))

  const i18n = useI18n()

  return (
    <React.Fragment>

      <FormItem label={'Taxonomy'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown items={taxonomies}
            itemKeyProp={'uuid'}
            itemLabelFunction={Taxonomy.getName}
            validation={Validation.getFieldValidation(propKeys.taxonomyUuid)(validation)}
            selection={taxonomy}
            disabled={!canUpdateTaxonomy}
            onChange={putTaxonomyProp}/>
          <button className="btn btn-s"
            style={{justifySelf: 'center'}}
            onClick={async () => {
              putTaxonomyProp(await createTaxonomy())
              toggleTaxonomyEdit(true)
            }}>
            <span className="icon icon-plus icon-12px icon-left"/>
            {i18n.t('common.add')}
          </button>
          <button className="btn btn-s"
            style={{justifySelf: 'center'}}
            onClick={() => toggleTaxonomyEdit(true)}>
            <span className="icon icon-list icon-12px icon-left"/>
            {i18n.t('common.manage')}
          </button>
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

export default connect(
  mapStateToProps,
  {
    putNodeDefProp,
    createTaxonomy,
    deleteTaxonomy,
  }
)(TaxonProps)
