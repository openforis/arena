import './DataImport.scss'

import TabBar from '@webapp/components/TabBar'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { DataImportArenaView } from './DataImportArenaView'
import { CollectDataImportView } from './DataImportCollectView'
import { DataImportFlatDataView } from './DataImportFlatDataView'
import { DataImportOdkView } from './DataImportOdkView'

const DataImport = () => {
  const i18n = useI18n()

  return (
    <div className="data-import">
      <TabBar
        tabs={[
          {
            id: TestId.dataImport.importFromCsvTab,
            label: i18n.t('dataImportView:importFromCsvExcel'),
            component: DataImportFlatDataView,
          },
          {
            id: TestId.dataImport.importFromCollectTab,
            label: i18n.t('dataImportView:importFromCollect'),
            component: CollectDataImportView,
          },
          {
            id: TestId.dataImport.importFromCollectTab,
            label: i18n.t('dataImportView:importFromArena'),
            component: DataImportArenaView,
          },
          {
            id: TestId.dataImport.importFromOdkTab,
            label: i18n.t('dataImportView:importFromOdk'),
            component: DataImportOdkView,
          },
        ]}
      />
    </div>
  )
}

export default DataImport
