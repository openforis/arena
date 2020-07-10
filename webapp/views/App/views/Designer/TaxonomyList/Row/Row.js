import React from 'react'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n, useLang } from '@webapp/store/system'
import { useSurvey, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { State, useTaxonomyRow } from './store'

const Row = (props) => {
  const { state, Actions } = useTaxonomyRow(props)

  const surveyInfo = useSurveyInfo()
  const survey = useSurvey()
  const defaultLang = Survey.getDefaultLanguage(surveyInfo)
  const lang = useLang()
  const i18n = useI18n()

  const taxonomy = State.getTaxonomy(state)
  const canSelect = State.getCanSelect(state)
  const selected = State.getSelected(state)
  const canEdit = useAuthCanEditSurvey()

  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang, defaultLang)(taxonomy)}</div>
      <div className="taxonomy-row__badge-container">
        <ErrorBadge validation={taxonomy.validation} />
      </div>
      <div className="taxonomy-row__badge-container">
        <WarningBadge
          show={A.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))}
          label={i18n.t('itemsTable.unused')}
        />
      </div>

      {(canSelect || selected) && (
        <button type="button" className="btn btn-s" onClick={() => Actions.select({ state })}>
          <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
          {selected ? i18n.t(`common.selected`) : i18n.t(`common.select`)}
        </button>
      )}

      {canEdit && (
        <button type="button" className="btn btn-s" onClick={() => Actions.edit({ state })}>
          <span className="icon icon-pencil2 icon-12px icon-left" />
          {i18n.t('common.edit')}
        </button>
      )}
      {canEdit && (
        <button type="button" className="btn btn-s" onClick={() => Actions.delete({ state })}>
          <span className="icon icon-bin2 icon-12px icon-left" />
          {i18n.t('common.delete')}
        </button>
      )}
    </>
  )
}

export default Row
