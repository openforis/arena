import './taxonomyEdit.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import UploadButton from '../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../commonComponents/form/downloadButton'
import { useI18n, useOnUpdate } from '../../../../commonComponents/hooks'

import Taxonomy from '../../../../../common/survey/taxonomy'
import Taxon from '../../../../../common/survey/taxon'
import StringUtils from '../../../../../common/stringUtils'
import Validation from '../../../../../common/validation/validation'
import { languages } from '../../../../../common/app/languages'

import * as SurveyState from '../../../../survey/surveyState'
import * as AppState from '../../../../app/appState'
import * as TaxonomyEditState from '../taxonomyEditState'
import * as TableViewState from '../../../tableViews/tableViewsState'

import { putTaxonomyProp, setTaxonomyForEdit, uploadTaxonomyFile } from '../actions'
import { initList } from '../../../tableViews/actions'

import Authorizer from '../../../../../common/auth/authorizer'

import TableView from '../../../tableViews/tableView'

const TaxonRowHeader = ({ vernacularLanguageCodes, taxonomy }) => {
  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('#')}</div>
      <div>{i18n.t('common.code')}</div>
      <div>{i18n.t('taxonomy.edit.family')}</div>
      <div>{i18n.t('taxonomy.edit.genus')}</div>
      <div>{i18n.t('taxonomy.edit.scientificName')}</div>
      {
        vernacularLanguageCodes.map(lang =>
          <div key={`vernacular_name_header_${Taxonomy.getUuid(taxonomy)}_${lang}`}>
            {R.propOr(lang, lang)(languages)}
          </div>
        )
      }
    </>
  )
}
const TaxonRow = ({ row, idx, offset, vernacularLanguageCodes }) => (
  <>
    <div>{idx + offset + 1}</div>
    <div>{Taxon.getCode(row)}</div>
    <div>{Taxon.getFamily(row)}</div>
    <div>{Taxon.getGenus(row)}</div>
    <div>{Taxon.getScientificName(row)}</div>
    {
      vernacularLanguageCodes.map(lang =>
        <div key={`vernacular_name_${Taxon.getUuid(row)}_${lang}`}>
          {Taxon.getVernacularName(lang)(row)}
        </div>
      )
    }
  </>
)

const TaxonEditHeader = props => {
  const { surveyId, taxonomy, taxa, readOnly, putTaxonomyProp, uploadTaxonomyFile } = props
  const i18n = useI18n()
  const validation = Validation.getValidation(taxonomy)

  return (
    <div className="taxonomy-edit__header">

      <FormItem label={i18n.t('taxonomy.edit.taxonomyName')}>
        <div>
          <Input value={Taxonomy.getName(taxonomy)}
                 validation={Validation.getFieldValidation('name')(validation)}
                 onChange={value => putTaxonomyProp(taxonomy, 'name', StringUtils.normalizeName(value))}
                 readOnly={readOnly} />
        </div>
      </FormItem>

      <div className="button-bar">
        {
          !readOnly &&
          <UploadButton label={i18n.t('common.csvImport')}
                        disabled={Taxonomy.isPublished(taxonomy)}
                        accept=".csv"
                        onChange={async ([file]) => { await uploadTaxonomyFile(taxonomy, file) } }/>

        }
        <DownloadButton href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export?draft=true`}
                        disabled={R.isEmpty(taxa)}
                        label={i18n.t('common.csvExport')} />
      </div>
    </div>
  )
}

const TaxonomyEdit = props => {

  const {
    surveyId, taxonomy, taxa,
    setTaxonomyForEdit,
    readOnly,
    putTaxonomyProp,
    uploadTaxonomyFile,
    initList,
    activeJob,
  } = props

  const i18n = useI18n()

  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  const vernacularLanguageCodes = R.reduce(
    (acc, taxon) => R.concat(acc, R.difference(R.keys(Taxon.getVernacularNames(taxon)), acc)),
    [],
    taxa
  )

  useOnUpdate(() => {
    if (!activeJob) {
      initList(TaxonomyEditState.keys.taxa, moduleApiUri, moduleApiCountUri)
    }
  }, [activeJob])

  const gridTemplateColumns = `.1fr .1fr .2fr .2fr .4fr ${R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`}`
  const moduleApiUri = `/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa?draft=true&validate=true`
  const moduleApiCountUri = `/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa/count`

  return (
    <div className="taxonomy-edit">

      <TableView
        className="taxonomy-edit"
        module={TaxonomyEditState.keys.taxa}
        moduleApiUri={moduleApiUri}
        moduleApiCountUri={moduleApiCountUri}
        gridTemplateColumns={gridTemplateColumns}
        headerLeftComponent={TaxonEditHeader}
        rowHeaderComponent={TaxonRowHeader}
        rowComponent={TaxonRow}
        noItemsLabelKey={'taxonomy.edit.taxaNotImported'}

        surveyId={surveyId}
        putTaxonomyProp={putTaxonomyProp}
        uploadTaxonomyFile={uploadTaxonomyFile}
        vernacularLanguageCodes={vernacularLanguageCodes}
        taxonomy={taxonomy}
        readOnly={readOnly}
      />

      <div style={{ justifySelf: 'center' }}>
        <button className="btn"
                onClick={() => setTaxonomyForEdit(null)}>
          {i18n.t('common.done')}
        </button>
      </div>

    </div>
  )
}

const mapStateToProps = state => {
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)
  const activeJob = AppState.getActiveJob(state)

  return {
    surveyId: SurveyState.getSurveyId(state),
    taxonomy: TaxonomyEditState.getTaxonomy(state),
    taxa: TableViewState.getList('taxa')(state),
    activeJob,
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  {
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, initList,
  }
)(TaxonomyEdit)
