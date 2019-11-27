import './collectImportReportView.scss'

import React, {useEffect} from 'react'
import {connect} from 'react-redux'
import * as R from 'ramda'

import NodeDefEdit from '../../../surveyViews/nodeDefEdit/nodeDefEdit'
import SurveyDefsLoader from '../../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import * as NodeDefEditState from '../../../surveyViews/nodeDefEdit/nodeDefEditState'
import TableHeader from './components/tableHeader'
import TableRows from './components/tableRows'

import * as CollectImportReportState from './collectImportReportState'

import {fetchCollectImportReportItems} from './actions'

const CollectImportReportView = props => {
  const {
    reportItems,
    isNodeDefEditOpened,
    fetchCollectImportReportItems,
  } = props

  useEffect(() => {
    fetchCollectImportReportItems()
  }, [])

  return R.isEmpty(reportItems) ? null : (
    <SurveyDefsLoader draft={true} validate={true}>
      {isNodeDefEditOpened && <NodeDefEdit />}

      <div className="collect-import-report table">
        <TableHeader />

        <TableRows reportItems={reportItems} />
      </div>
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => ({
  reportItems: CollectImportReportState.getState(state),
  isNodeDefEditOpened: NodeDefEditState.hasNodeDef(state),
})
export default connect(mapStateToProps, {fetchCollectImportReportItems})(
  CollectImportReportView,
)
