import './Row.scss'
import * as A from '@core/arena'
import React from 'react'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n, useLang } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import useTaxonomyRow from '@webapp/views/App/views/Designer/TaxonomyList/Row/useTaxonomyRow'

const Row = (props) => {
  const { taxonomy, selected, defaultLang, onDelete, deleted, onEdit, canSelect, selectTaxonomy } = useTaxonomyRow(
    props
  )

  const survey = useSurvey()
  const lang = useLang()
  const i18n = useI18n()

  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang, defaultLang)(taxonomy)}</div>
      <div>{!deleted && <ErrorBadge validation={taxonomy.validation} />}</div>
      <div>
        <WarningBadge
          show={!deleted && A.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))}
          label={i18n.t('itemsTable.unused')}
        />
      </div>
      <div>
        <WarningBadge label={i18n.t('common.deleted')} show={deleted} />
      </div>
      <div>
        {!deleted && (canSelect || selected) && (
          <button type="button" className={`btn btn-s${selected ? ' active' : ''}`} onClick={selectTaxonomy}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {selected ? i18n.t(`common.selected`) : i18n.t(`common.select`)}
          </button>
        )}
      </div>
      {!deleted && (
        <button type="button" className="btn btn-s" onClick={onEdit}>
          <span className="icon icon-pencil2 icon-12px icon-left" />
          {i18n.t('common.edit')}
        </button>
      )}
      {!deleted && (
        <button type="button" className="btn btn-s" onClick={onDelete}>
          <span className="icon icon-bin2 icon-12px icon-left" />
          {i18n.t('common.delete')}
        </button>
      )}
    </>
  )
}

export default Row
