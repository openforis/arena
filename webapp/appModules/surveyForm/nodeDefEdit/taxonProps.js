import React from 'react'

import { FormItem } from '../../../commonComponents/form/input'
import Dropdown from '../../../commonComponents/form/dropdown'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import Taxonomy from '../../../../common/survey/taxonomy'
import { getFieldValidation, getValidation } from '../../../../common/validation/validator'

const TaxonProps = (props) => {
  const {
    survey,
    nodeDef,
    putNodeDefProp,

    createTaxonomy,
    toggleTaxonomyEdit,
  } = props

  const validation = getValidation(nodeDef)

  const selectedTaxonomy = Survey.getTaxonomyByUUID(NodeDef.getNodeDefTaxonomyUUID(nodeDef))(survey)

  return (
    <React.Fragment>

      <FormItem label={'Taxonomy'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown items={Survey.getTaxonomiesArray(survey)}
                    itemKeyProp={'uuid'}
                    itemLabelFunction={taxonomy => Taxonomy.getTaxonomyName(taxonomy)}
                    validation={getFieldValidation('taxonomyUUID')(validation)}
                    selection={selectedTaxonomy}
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

export default TaxonProps