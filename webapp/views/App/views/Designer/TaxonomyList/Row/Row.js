import './Row.scss'
import * as A from '@core/arena'
import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n, useLang } from '@webapp/store/system'
import { useSurvey, useSurveyInfo } from '@webapp/store/survey'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'
import * as ObjectUtils from '@core/objectUtils'
import { Link } from 'react-router-dom'

const Row = (props) => {
  const { row: taxonomy } = props
  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()
  const lang = useLang()
  const i18n = useI18n()

  const defaultLang = Survey.getDefaultLanguage(surveyInfo)

  /*
  conat readOnly = false
  const canDelete = (taxonomy) =>
    taxonomy.usedByNodeDefs ? dispatch(NotificationActions.notifyInfo({ key: 'taxonomy.cantBeDeleted' })) : true

  const onDelete = (taxonomy) =>
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'taxonomy.confirmDelete',
        params: { taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName') },
        onOk: () => dispatch(deleteTaxonomy(taxonomy)),
      })
    )

    const onSelect= (taxonomy) => {
        dispatch(NodeDefsActions.setNodeDefProp(NodeDef.propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy)))
      }

       const nodeDef = !readOnly && NodeDefState.getNodeDef(state)
       const canSelect = nodeDef && NodeDef.isTaxon(nodeDef)
       const selectedItemUuid = canSelect && NodeDef.getTaxonomyUuid(nodeDef)

 */
  const itemLink = ''
  /* open on click */
  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang, defaultLang)(taxonomy)}</div>
      <div>
        <ErrorBadge validation={taxonomy.validation} />
      </div>
      <div>
        <WarningBadge
          show={A.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))}
          label={i18n.t('itemsTable.unused')}
        />
      </div>
      <Link className="btn btn-s" to={`${itemLink}${ObjectUtils.getUuid(taxonomy)}/`}>
        <span className="icon icon-pencil2 icon-12px icon-left" />
        {i18n.t('common.edit')}
      </Link>
      <button type="button" className="btn btn-s" onClick={() => ({})}>
        <span className="icon icon-bin2 icon-12px icon-left" />
        {i18n.t('common.delete')}
      </button>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
