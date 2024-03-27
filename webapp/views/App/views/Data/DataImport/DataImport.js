import './DataImport.scss'

import React from 'react'

import TabBar from '@webapp/components/tabBar'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { DataImportArenaView } from './DataImportArenaView'
import { CollectDataImportView } from './DataImportCollectView'
import { DataImportCsvView } from './DataImportCsvView'

const DataImport = () => {
  const i18n = useI18n()

  return (
    <div className="data-import">
      <TabBar
        tabs={[
          {
            id: TestId.dataImport.importFromCsvTab,
            label: i18n.t('dataImportView.importFromCsv'),
            component: DataImportCsvView,
          },
          {
            id: TestId.dataImport.importFromCollectTab,
            label: i18n.t('dataImportView.importFromCollect'),
            component: CollectDataImportView,
          },
          {
            id: TestId.dataImport.importFromCollectTab,
            label: i18n.t('dataImportView.importFromArena'),
            component: DataImportArenaView,
          },
        ]}
      />
    </div>
  )
}

export default DataImport
