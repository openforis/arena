import React from 'react'

import { FormItem } from '../../../commonComponents/form/input'
import Dropdown from '../../../commonComponents/form/dropdown'

import Taxonomy from '../../../../common/survey/taxonomy'
import NodeDef from '../../../../common/survey/nodeDef'
import Survey from '../../../../common/survey/survey'
import { getFieldValidation, getValidation } from '../../../../common/validation/validator'
import connect from 'react-redux/es/connect/connect'
import { getSurvey } from '../../../survey/surveyState'
import { getFormNodeDefEdit, getSurveyForm } from '../surveyFormState'
import { putNodeDefProp } from '../../../survey/nodeDefs/actions'
import { createTaxonomy, deleteTaxonomy } from '../taxonomyEdit/actions'

const TaxonProps = (props) => {
  const {
    nodeDef,
    putNodeDefProp,
    taxonomies,
    taxonomy,
    createTaxonomy,
    toggleTaxonomyEdit,
  } = props

  const validation = getValidation(nodeDef)

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
                    validation={getFieldValidation('taxonomyUUID')(validation)}
                    selection={taxonomy}
                    onChange={taxonomy => putNodeDefProp(nodeDef, 'taxonomyUUID', taxonomy ? taxonomy.uuid : null)}/>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={() => {
                    createTaxonomy()
                    toggleTaxonomyEdit(true)
                  }}>
            <span className="icon icon-plus icon-16px icon-left"/>
            ADD
          </button>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={() => toggleTaxonomyEdit(true)}>
            <span className="icon icon-list icon-16px icon-left"/>
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
    taxonomy: isTaxon ? Survey.getTaxonomyByUUID(NodeDef.getNodeDefTaxonomyUUID(nodeDef))(survey) : null,
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