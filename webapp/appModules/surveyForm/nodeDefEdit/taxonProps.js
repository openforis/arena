import React from 'react'

import { FormItem } from '../../../commonComponents/form/input'
import Dropdown from '../../../commonComponents/form/dropdown'

import Taxonomy from '../../../../common/survey/taxonomy'
import { getFieldValidation, getValidation } from '../../../../common/validation/validator'

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

export default TaxonProps