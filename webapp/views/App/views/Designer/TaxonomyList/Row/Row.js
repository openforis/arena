import './Row.scss'
import * as A from '@core/arena'
import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n, useLang } from '@webapp/store/system'
import { useSurvey, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { State, useTaxonomyRow } from './store'

const TableButton = ({ show = true, label, onClick, icon }) => {
  if (!show) return null
  return (
    <button type="button" className="btn btn-s" onClick={onClick}>
      {icon && icon}
      {label}
    </button>
  )
}

TableButton.propTypes = {
  show: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.string.isRequired,
  icon: PropTypes.node,
}

TableButton.defaultProps = {
  show: true,
  icon: null,
}

const Row = (props) => {
  const { state, Actions } = useTaxonomyRow(props)

  const surveyInfo = useSurveyInfo()
  const survey = useSurvey()
  const defaultLang = Survey.getDefaultLanguage(surveyInfo)
  const lang = useLang()
  const i18n = useI18n()

  const taxonomy = State.getTaxonomy(state)
  const deleted = State.getDeleted(state)
  const canSelect = State.getCanSelect(state)
  const selected = State.getSelected(state)
  const canEdit = useAuthCanEditSurvey()

  if (!taxonomy) return <></>
  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang, defaultLang)(taxonomy)}</div>
      <div className="taxonomy__row__badge-container">
        {!deleted && <ErrorBadge validation={taxonomy.validation} />}
      </div>
      <div className="taxonomy__row__badge-container">
        <WarningBadge
          show={!deleted && A.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))}
          label={i18n.t('itemsTable.unused')}
        />
      </div>
      <div className="taxonomy__row__badge-container">
        <WarningBadge label={i18n.t('common.deleted')} show={deleted} />
      </div>

      <TableButton
        show={!deleted && (canSelect || selected)}
        label={selected ? i18n.t(`common.selected`) : i18n.t(`common.select`)}
        onClick={() => Actions.select({ state })}
        icon={<span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />}
      />

      <TableButton
        show={!deleted && canEdit}
        label={i18n.t('common.edit')}
        onClick={() => Actions.edit({ state })}
        icon={<span className="icon icon-pencil2 icon-12px icon-left" />}
      />

      <TableButton
        show={!deleted && canEdit}
        label={i18n.t('common.delete')}
        onClick={() => Actions.delete({ state })}
        icon={<span className="icon icon-bin2 icon-12px icon-left" />}
      />
    </>
  )
}

export default Row
