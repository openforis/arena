import './DataImport.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'

import TabBar from '@webapp/components/tabBar'
import { TestId } from '@webapp/utils/testId'
import { DataImportCsvView } from './DataImportCsvView'
import { CollectDataImportView } from './DataImportCollectView'

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
        ]}
      />
    </div>
  )
}

export default DataImport
