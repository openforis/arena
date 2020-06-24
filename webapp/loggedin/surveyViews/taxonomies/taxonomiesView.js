import './taxonomiesView.scss'

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyState, useSurvey } from '@webapp/store/survey'

import { createTaxonomy, deleteTaxonomy } from '@webapp/loggedin/surveyViews/taxonomy/actions'

import { useI18n } from '@webapp/store/system'
import ItemsView from '@webapp/loggedin/surveyViews/items/itemsView'
import ItemsColumn from '@webapp/loggedin/surveyViews/items/itemsColumn'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import * as NodeDefState from '@webapp/views/App/views/NodeDef/NodeDefEdit/store/state'
import * as NodeDefStorage from '@webapp/views/App/views/NodeDef/NodeDefEdit/store/storage'

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

const TaxonomiesView = () => {
  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()

  const survey = useSurvey()
  const readOnly = !useAuthCanEditSurvey()
  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map((t) => ({
      ...t,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(t))(survey)),
    }))
  )(survey)

  // A nodeDef taxon is begin edited.
  const nodeDefState = NodeDefStorage.getNodeDefState()
  const nodeDef = !readOnly && nodeDefState && NodeDefState.getNodeDef(nodeDefState)
  const canSelect = nodeDef && NodeDef.isTaxon(nodeDef)
  const [nodeDefTaxonomyUuid, setNodeDefTaxonomyUuid] = useState(canSelect && NodeDef.getTaxonomyUuid(nodeDef))

  const onClose = () => {
    if (nodeDef) {
      const nodeDefStateUpdated = NodeDefState.assocNodeDefProp(
        NodeDef.propKeys.taxonomyUuid,
        nodeDefTaxonomyUuid
      )(nodeDefState)
      NodeDefStorage.setNodeDefState(nodeDefStateUpdated)
      history.goBack()
    }
  }

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

  return (
    <ItemsView
      itemLabelFunction={(taxonomy) => Taxonomy.getName(taxonomy)}
      itemLink={appModuleUri(designerModules.taxonomy)}
      items={taxonomies}
      selectedItemUuid={nodeDefTaxonomyUuid}
      onAdd={createTaxonomy}
      canDelete={canDelete}
      onDelete={onDelete}
      canSelect={canSelect}
      onSelect={(taxonomy) => setNodeDefTaxonomyUuid(Taxonomy.getUuid(taxonomy))}
      onClose={onClose}
      readOnly={readOnly}
      columns={[...ItemsView.defaultProps.columns, columnDescription]}
      className="taxonomies"
    />
  )
}

export default TaxonomiesView
