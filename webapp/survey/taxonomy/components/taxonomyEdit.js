import React from 'react'

import { FormItem, Input } from '../../../commonComponents/form/input'

import { isBlank } from '../../../../common/stringUtils'
import { getTaxonomyName } from '../../../../common/survey/taxonomy'
import { getFieldValidation } from '../../../../common/validation/validator'
import { normalizeName } from '../../../../common/survey/surveyUtils'

const TaxonomyEdit = props => {
  const {
    taxonomy,
    putTaxonomyProp, setTaxonomyForEdit,
  } = props
  const {validation} = taxonomy

  const taxonomyName = getTaxonomyName(taxonomy)
  return (
    <div className="taxonomies__edit">

      <FormItem label="Taxonomy name">
        <Input value={taxonomyName}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putTaxonomyProp(taxonomy.uuid, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <div style={{justifySelf: 'center'}}>
        <button className="btn btn-of-light"
                aria-disabled={isBlank(taxonomyName)}
                onClick={() => setTaxonomyForEdit(null)}>
          Done
        </button>
      </div>

    </div>
  )
}

export default TaxonomyEdit