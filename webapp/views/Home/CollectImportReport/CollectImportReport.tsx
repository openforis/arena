import './CollectImportReport.scss'

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import Table from '@webapp/components/Table'

import { useSurveyId } from '@webapp/store/survey'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const CollectImportReport = () => {
  const surveyId = useSurveyId()

  const navigate = useNavigate()

  const [excludeResolved, setExcludeResolved] = useState(false)

  const onRowOpen = useCallback(
    (item) => navigate(`${appModuleUri(designerModules.nodeDef)}${CollectImportReportItem.getNodeDefUuid(item)}/`),
    [navigate]
  )

  return (
    <SurveyDefsLoader draft validate>
      <Table
        className="collect-import-report"
        keyExtractor={({ item }) => CollectImportReportItem.getId(item)}
        module="collect-import-report"
        moduleApiUri={`/api/survey/${surveyId}/collect-import/report`}
        restParams={{ excludeResolved }}
        gridTemplateColumns="3rem 0.3fr 12rem 0.3fr 0.2fr 0.2fr 7rem 3rem"
        headerLeftComponent={HeaderLeft}
        headerProps={{ excludeResolved, setExcludeResolved }}
        rowHeaderComponent={RowHeader}
        rowComponent={Row}
        rowProps={{ onRowOpen }}
        onRowOpen={onRowOpen}
      />
    </SurveyDefsLoader>
  )
}

export default CollectImportReport
