import React from 'react'

import { FormItem, Input } from '../../../commonComponents/form/input'

import { isBlank } from '../../../../common/stringUtils'
import { getTaxonomyName } from '../../../../common/survey/taxonomy'
import { getFieldValidation } from '../../../../common/validation/validator'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import { uploadTaxonomyFile } from '../actions'

class TaxonomyEdit extends React.Component {
  constructor (props) {
    super(props)

    this.fileInput = React.createRef()
  }

  render () {
    const {
      survey, taxonomy,
      importingTaxonomy,
      putTaxonomyProp, setTaxonomyForEdit, uploadTaxonomyFile,
    } = this.props

    const {validation} = taxonomy

    const taxonomyName = getTaxonomyName(taxonomy)
    return (
      <div className="taxonomies__edit">

        <FormItem label="Taxonomy name">
          <Input value={taxonomyName}
                 validation={getFieldValidation('name')(validation)}
                 onChange={e => putTaxonomyProp(taxonomy.uuid, 'name', normalizeName(e.target.value))}/>
        </FormItem>


        <input
          ref={this.fileInput}
          type="file"
          style={{display: 'none'}}
          onChange={e => {
            console.log(e)
            uploadTaxonomyFile(survey.id, taxonomy.id, this.fileInput.current.files[0])
          }}
        />

        <button className="btn-s btn-primary btn-upload"
                disabled={importingTaxonomy}
                onClick={() => {
                  // first reset current value, then trigger click event
                  this.fileInput.current.value = ''
                  this.fileInput.current.dispatchEvent(new MouseEvent('click'))
                }}>
          <span className="icon icon-cloud-upload icon-16px icon-left"/>
          IMPORT
        </button>


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
}

export default TaxonomyEdit