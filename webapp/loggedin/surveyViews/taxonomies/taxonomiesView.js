import './taxonomiesView.scss'

import React from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import { useI18n } from '@webapp/components/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Authorizer from '@core/auth/authorizer'

import { SurveyState, NodeDefsActions } from '@webapp/store/survey'
import * as AppState from '@webapp/app/appState'
import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { createTaxonomy, deleteTaxonomy } from '@webapp/loggedin/surveyViews/taxonomy/actions'
import { NotificationActions } from '@webapp/store/ui'
import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'

import ItemsView from '@webapp/loggedin/surveyViews/items/itemsView'
import ItemsColumn from '@webapp/loggedin/surveyViews/items/itemsColumn'

const columnDescription = new ItemsColumn(
  'common.description',
  (props) => {
    const { item } = props
    const i18n = useI18n()
    const surveyInfo = useSelector(SurveyState.getSurveyInfo)

    const defaultLang = Survey.getDefaultLanguage(surveyInfo)

    return <>{Taxonomy.getDescription(i18n.lang, defaultLang)(item)}</>
  },
  'description'
)

const TaxonomiesView = (props) => {
  const { taxonomies, selectedItemUuid, canSelect, readOnly, createTaxonomy } = props

  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()

  const onClose = selectedItemUuid ? history.goBack : null

  const canDelete = (taxonomy) =>
    taxonomy.usedByNodeDefs ? dispatch(NotificationActions.notifyInfo({ key: 'taxonomy.cantBeDeleted' })) : true

  const onDelete = (taxonomy) =>
    dispatch(
      showDialogConfirm(
        'taxonomy.confirmDelete',
        { taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName') },
        () => dispatch(deleteTaxonomy(taxonomy))
      )
    )

  return (
    <ItemsView
      itemLabelFunction={(taxonomy) => Taxonomy.getName(taxonomy)}
      itemLink={appModuleUri(designerModules.taxonomy)}
      items={taxonomies}
      selectedItemUuid={selectedItemUuid}
      onAdd={createTaxonomy}
      canDelete={canDelete}
      onDelete={onDelete}
      canSelect={canSelect}
      onSelect={(taxonomy) =>
        dispatch(NodeDefsActions.setNodeDefProp(NodeDef.propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy)))
      }
      onClose={onClose}
      readOnly={readOnly}
      columns={[...ItemsView.defaultProps.columns, columnDescription]}
      className="taxonomies"
    />
  )
}

const mapStateToProps = (state) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)
  const readOnly = !Authorizer.canEditSurvey(user, surveyInfo)
  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map((t) => ({
      ...t,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(t))(survey)),
    }))
  )(survey)
  // A nodeDef taxon is begin edited.
  const nodeDef = !readOnly && NodeDefState.getNodeDef(state)
  const canSelect = nodeDef && NodeDef.isTaxon(nodeDef)
  const selectedItemUuid = canSelect && NodeDef.getTaxonomyUuid(nodeDef)

  return {
    taxonomies,
    readOnly,
    selectedItemUuid,
    canSelect,
  }
}

export default connect(mapStateToProps, { createTaxonomy })(TaxonomiesView)
