import * as CollectImportReportItem from '@core/survey/collectImportReportItem'
import { ButtonIconEdit } from '@webapp/components'
import Checkbox from '@webapp/components/form/Checkbox'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { useCollectImportReportItem } from './store'

type RowProps = {
  item: Record<string, any>
  itemPosition: number
  onRowOpen: (item: Record<string, any>) => void
}

const Row = (props: RowProps) => {
  const { onRowOpen } = props
  const { rowNo, row, type, nodeDefPath, onUpdate } = useCollectImportReportItem(props)
  const { icon: typeIcon, label: typeLabel } = type

  return (
    <>
      <div>{rowNo}</div>
      <div className="width100">{nodeDefPath}</div>
      <div>
        {typeIcon}
        {typeLabel}
      </div>
      <div className="width100">{CollectImportReportItem.getExpression(row)}</div>
      <div className="width100">{CollectImportReportItem.getApplyIf(row)}</div>
      <div className="width100">
        <LabelsEditor
          labels={CollectImportReportItem.getMessages(row) || {}}
          readOnly
          showFormLabel={false}
          compactLanguage
        />
      </div>
      <div>
        <Checkbox
          checked={CollectImportReportItem.isResolved(row)}
          onChange={(checked) => onUpdate({ resolved: checked })}
        />
      </div>
      <div className="cell icon">
        <ButtonIconEdit onClick={() => onRowOpen(row)} />
      </div>
    </>
  )
}

export default Row
