import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'

import { FormItem, Input } from '@webapp/components/form/input'
import DownloadButton from '@webapp/components/form/downloadButton'
import ErrorBadge from '@webapp/components/errorBadge'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import UploadButton from '@webapp/components/form/uploadButton'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import * as TaxonomyActions from '../actions'
import * as TaxonomyState from '../taxonomyState'

const TaxonomyEditHeader = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()
  const taxonomy = useSelector(TaxonomyState.getTaxonomy)
  const validation = Validation.getValidation(taxonomy)

  return (
    <div className="taxonomy__header">
      <div>
        <ErrorBadge validation={validation} />
      </div>

      <div>
        <FormItem label={i18n.t('taxonomy.edit.taxonomyListName')}>
          <Input
            value={Taxonomy.getName(taxonomy)}
            validation={Validation.getFieldValidation(Taxonomy.keysProps.name)(validation)}
            onChange={(value) =>
              dispatch(
                TaxonomyActions.putTaxonomyProp(taxonomy, Taxonomy.keysProps.name, StringUtils.normalizeName(value))
              )
            }
            readOnly={!canEdit}
          />
        </FormItem>

        <LabelsEditor
          formLabelKey="common.description"
          labels={Taxonomy.getDescriptions(taxonomy)}
          onChange={(descriptions) =>
            dispatch(TaxonomyActions.putTaxonomyProp(taxonomy, Taxonomy.keysProps.descriptions, descriptions))
          }
        />
      </div>

      <div className="button-bar">
        {canEdit && (
          <UploadButton
            label={i18n.t('common.csvImport')}
            accept=".csv"
            onChange={async ([file]) => {
              await dispatch(TaxonomyActions.uploadTaxonomyFile(taxonomy, file))
            }}
          />
        )}
        <DownloadButton
          href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export?draft=${canEdit}`}
          label={i18n.t('common.csvExport')}
        />
      </div>
    </div>
  )
}

export default TaxonomyEditHeader
