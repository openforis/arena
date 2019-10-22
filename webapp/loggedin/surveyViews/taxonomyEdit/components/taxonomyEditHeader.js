import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '@webapp/commonComponents/form/input'
import UploadButton from '@webapp/commonComponents/form/uploadButton'
import DownloadButton from '@webapp/commonComponents/form/downloadButton'
import { useI18n } from '@webapp/commonComponents/hooks'

import Taxonomy from '@core/survey/taxonomy'
import Validation from '@core/validation/validation'
import StringUtils from '@core/stringUtils'

const TaxonomyEditHeader = props => {
  const { surveyId, taxonomy, taxa, canEdit, putTaxonomyProp, uploadTaxonomyFile } = props
  const i18n = useI18n()
  const validation = Validation.getValidation(taxonomy)

  return (
    <div className="taxonomy-edit__header">

      <FormItem label={i18n.t('taxonomy.edit.taxonomyName')}>
        <div>
          <Input
            value={Taxonomy.getName(taxonomy)}
            validation={Validation.getFieldValidation('name')(validation)}
            onChange={value => putTaxonomyProp(taxonomy, 'name', StringUtils.normalizeName(value))}
            readOnly={!canEdit}/>
        </div>
      </FormItem>

      <div className="button-bar">
        {
          canEdit &&
          <UploadButton
            label={i18n.t('common.csvImport')}
            disabled={Taxonomy.isPublished(taxonomy)}
            accept=".csv"
            onChange={async ([file]) => { await uploadTaxonomyFile(taxonomy, file) }}/>

        }
        <DownloadButton
          href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export?draft=${canEdit}`}
          disabled={R.isEmpty(taxa)}
          label={i18n.t('common.csvExport')}/>
      </div>
    </div>
  )
}

export default TaxonomyEditHeader