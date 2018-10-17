import React from 'react'
import axios from 'axios'
import * as R from 'ramda'

import TaxonTable from './taxonTable'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { toQueryString } from '../../../../server/serverUtils/request'
import { isBlank } from '../../../../common/stringUtils'
import {
  getTaxonomyName,
} from '../../../../common/survey/taxonomy'
import { getFieldValidation } from '../../../../common/validation/validator'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import UploadButton from '../../../commonComponents/form/uploadButton'

const ROWS_PER_PAGE = 20

class TaxonomyEdit extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      taxa: [],
      currentPage: 0,
      totalPages: 0,
    }
  }

  async componentDidMount () {
    this.countTaxa(() => this.loadTaxa())
  }

  countTaxa (callback) {
    const {survey, taxonomy} = this.props

    const params = {
      draft: true
    }

    axios.get(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/taxa/count?${toQueryString(params)}`)
      .then(res => {
        const {count} = res.data
        this.setState({
          totalPages: Math.ceil(count / ROWS_PER_PAGE),
          currentPage: 1,
        }, () => callback())
      })
  }

  loadTaxa () {
    const {survey, taxonomy} = this.props
    const {currentPage} = this.state

    const params = {
      draft: true,
      limit: ROWS_PER_PAGE,
      offset: (currentPage - 1) * ROWS_PER_PAGE
    }

    axios.get(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/taxa?${toQueryString(params)}`)
      .then(res => {
        const {taxa} = res.data
        this.setState({
          taxa,
        })
      })
  }

  exportTaxonomy () {
    const {
      survey, taxonomy,
    } = this.props

    const params = {
      draft: true
    }
    window.open(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/export?${toQueryString(params)}`, '_blank')
  }

  onPageChange (page) {
    this.setState({
      currentPage: page
    }, () => this.loadTaxa())
  }

  render () {
    const {
      survey, taxonomy,
      putTaxonomyProp, setTaxonomyForEdit, uploadTaxonomyFile,
    } = this.props

    const {taxa, currentPage, totalPages} = this.state

    const {validation} = taxonomy

    const taxonomyName = getTaxonomyName(taxonomy)
    return (
      <div className="taxonomies__edit">

        <FormItem label="Taxonomy name">
          <Input value={taxonomyName}
                 validation={getFieldValidation('name')(validation)}
                 onChange={e => putTaxonomyProp(taxonomy.uuid, 'name', normalizeName(e.target.value))}/>
        </FormItem>

        <div className="action-bar">
          <UploadButton label="IMPORT"
                        onChange={(files) => uploadTaxonomyFile(survey.id, taxonomy.id, files[0])}/>

          <button className="btn btn-of btn-download"
                  disabled={R.isEmpty(taxa)}
                  onClick={() => this.exportTaxonomy()}>
            <span className="icon icon-cloud-download icon-16px icon-left"/>
            EXPORT
          </button>
        </div>

        {
          R.isEmpty(taxa)
            ? <div>Taxonomy not imported</div>
            : <TaxonTable taxonomy={taxonomy}
                          taxa={taxa}
                          currentPage={currentPage}
                          totalPages={totalPages}
                          rowsPerPage={ROWS_PER_PAGE}
                          onPageChange={(page) => this.onPageChange(page)}/>
        }

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