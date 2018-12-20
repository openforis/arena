import React from 'react'
import { connect } from 'react-redux'

import { FormItem } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import Taxonomy from '../../../../../common/survey/taxonomy'
import Validator from '../../../../../common/validation/validator'

import { getSurvey } from '../../../../survey/surveyState'
import { getFormNodeDefEdit, getSurveyForm } from '../../surveyFormState'

import { putNodeDefProp } from '../../../../survey/nodeDefs/actions'
import { createTaxonomy, deleteTaxonomy } from '../../taxonomyEdit/actions'

const {propKeys} = NodeDef

const TaxonProps = (props) => {
  const {
    nodeDef,
    putNodeDefProp,
    taxonomies,
    taxonomy,
    createTaxonomy,
    toggleTaxonomyEdit,
  } = props

  const validation = Validator.getValidation(nodeDef)

  const putTaxonomyProp = taxonomy => putNodeDefProp(nodeDef, propKeys.taxonomyUuid, taxonomy ? taxonomy.uuid : null)

  return (
    <React.Fragment>

      <FormItem label={'Taxonomy'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown items={taxonomies}
                    itemKeyProp={'uuid'}
                    itemLabelFunction={Taxonomy.getTaxonomyName}
                    validation={Validator.getFieldValidation(propKeys.taxonomyUuid)(validation)}
                    selection={taxonomy}
                    onChange={putTaxonomyProp}/>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={async () => {
                    putTaxonomyProp(await createTaxonomy())
                    toggleTaxonomyEdit(true)
                  }}>
            <span className="icon icon-plus icon-12px icon-left"/>
            ADD
          </button>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={() => toggleTaxonomyEdit(true)}>
            <span className="icon icon-list icon-12px icon-left"/>
            MANAGE
          </button>
        </div>
      </FormItem>
    </React.Fragment>
  )
}

const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const nodeDef = getFormNodeDefEdit(survey)(surveyForm)

  const isTaxon = NodeDef.isNodeDefTaxon(nodeDef)

  return {
    taxonomy: isTaxon ? Survey.getTaxonomyByUuid(NodeDef.getNodeDefTaxonomyUuid(nodeDef))(survey) : null,
    taxonomies: isTaxon ? Survey.getTaxonomiesArray(survey) : null,
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