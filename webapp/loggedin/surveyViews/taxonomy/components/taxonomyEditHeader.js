import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '@webapp/commonComponents/form/input'
import UploadButton from '@webapp/commonComponents/form/uploadButton'
import DownloadButton from '@webapp/commonComponents/form/downloadButton'
import { useI18n } from '@webapp/commonComponents/hooks'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'

const TaxonomyEditHeader = props => {
  const { surveyId, taxonomy, taxa, canEdit, putTaxonomyProp, uploadTaxonomyFile } = props
  const i18n = useI18n()
  const validation = Validation.getValidation(taxonomy)

  return (
    <div className="taxonomy__header">
      <div>
        <FormItem label={i18n.t('taxonomy.edit.taxonomyListName')}>
          <Input
            value={Taxonomy.getName(taxonomy)}
            validation={Validation.getFieldValidation(Taxonomy.keysProps.name)(validation)}
            onChange={value => putTaxonomyProp(taxonomy, Taxonomy.keysProps.name, StringUtils.normalizeName(value))}
            readOnly={!canEdit}
          />
        </FormItem>

        <LabelsEditor
          formLabelKey="common.description"
          labels={Taxonomy.getDescriptions(taxonomy)}
          onChange={descriptions => putTaxonomyProp(taxonomy, Taxonomy.keysProps.descriptions, descriptions)}
        />
      </div>

      <div className="button-bar">
        {canEdit && (
          <UploadButton
            label={i18n.t('common.csvImport')}
            accept=".csv"
            onChange={async ([file]) => {
              await uploadTaxonomyFile(taxonomy, file)
            }}
          />
        )}
        <DownloadButton
          href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export?draft=${canEdit}`}
          disabled={R.isEmpty(taxa)}
          label={i18n.t('common.csvExport')}
        />
      </div>
    </div>
  )
}

export default TaxonomyEditHeader
