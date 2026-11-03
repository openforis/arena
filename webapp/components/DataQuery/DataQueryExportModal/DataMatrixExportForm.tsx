import './DataMatrixExportForm.scss'

import { useState } from 'react'
import { useDispatch } from 'react-redux'

import type { Survey as ArenaSurvey } from '@openforis/arena-core'

import { getDataMatrixAttributeDefs } from '@common/dataExport/dataMatrixExport'
import { Query } from '@common/model/query'
import { FileFormats } from '@core/fileFormats'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { Button } from '@webapp/components'
import { ButtonGroup } from '@webapp/components/form'
import Dropdown from '@webapp/components/form/Dropdown'
import { FormItem } from '@webapp/components/form/Input'
import Markdown from '@webapp/components/markdown'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useSurvey, useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { DataMatrixExportDownloadButton } from './DataMatrixExportDownloadButton'

const fileFormats = [FileFormats.xlsx, FileFormats.csv]
const previewRecordNumbers = [1, 2]

type DropdownItem = { value: string; label: string }

type AttributeDropdownProps = {
  info: string
  items: DropdownItem[]
  label: string
  onChange: (value: string | null) => void
  testId: string
  value: string | null
}

const AttributeDropdown = ({ info, items, label, onChange, testId, value }: AttributeDropdownProps) => (
  <FormItem info={info} label={label}>
    <Dropdown
      items={items}
      onChange={(item: DropdownItem | null) => onChange(item?.value ?? null)}
      selection={items.find((item) => item.value === value) ?? null}
      testId={testId}
    />
  </FormItem>
)

type PreviewProps = {
  keysLabel: string
  rowLabels: string[]
  valueLabel: string
}

// structure of the exported table, built with the labels of the selected attributes
const DataMatrixPreview = ({ keysLabel, rowLabels, valueLabel }: PreviewProps) => {
  const i18n = useI18n()
  return (
    <div className="data-matrix-export__preview">
      <span className="data-matrix-export__preview-title">{i18n.t('dataView:dataMatrixExport.preview')}</span>
      <table>
        <thead>
          <tr>
            {rowLabels.map((label) => (
              <th key={label}>{label}</th>
            ))}
            {previewRecordNumbers.map((number) => (
              <th key={number}>{i18n.t('dataView:dataMatrixExport.previewRecord', { number, keys: keysLabel })}</th>
            ))}
            <th>…</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {rowLabels.map((label) => (
              <td key={label}>‹{label}›</td>
            ))}
            {previewRecordNumbers.map((number) => (
              <td key={number}>‹{valueLabel}›</td>
            ))}
            <td>…</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

type Props = {
  onClose: () => void
}

export const DataMatrixExportForm = (props: Props) => {
  const { onClose } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey() as ArenaSurvey
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const query = DataExplorerSelectors.useQuery()

  const entityDefUuid = Query.getEntityDefUuid(query)
  const filter = Query.getFilter(query)

  const [rowDefUuid, setRowDefUuid] = useState<string | null>(null)
  const [secondRowDefUuid, setSecondRowDefUuid] = useState<string | null>(null)
  const [valueDefUuid, setValueDefUuid] = useState<string | null>(null)
  const [fileFormat, setFileFormat] = useState(FileFormats.xlsx)

  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const entityLabel = NodeDef.getLabel(entityDef, lang)
  const keysLabel = Survey.getNodeDefRootKeys(survey)
    .map((keyDef: any) => NodeDef.getLabel(keyDef, lang))
    .join(' - ')

  const attributeItems: DropdownItem[] = getDataMatrixAttributeDefs({ survey, cycle, entityDef }).map((nodeDef) => ({
    value: NodeDef.getUuid(nodeDef),
    label: NodeDef.getLabel(nodeDef, lang),
  }))

  const getAttributeLabel = (nodeDefUuid: string | null, defaultLabelKey: string): string =>
    attributeItems.find((item) => item.value === nodeDefUuid)?.label ?? i18n.t(defaultLabelKey)

  const previewRowLabels = [getAttributeLabel(rowDefUuid, 'dataView:dataMatrixExport.rowAttribute')]
  if (secondRowDefUuid) {
    previewRowLabels.push(getAttributeLabel(secondRowDefUuid, 'dataView:dataMatrixExport.secondRowAttribute'))
  }

  const onExportClick = async () => {
    const rowAttributeDefUuids = [rowDefUuid, secondRowDefUuid].filter(Boolean)
    const options = { entityDefUuid, rowAttributeDefUuids, valueAttributeDefUuid: valueDefUuid, filter, fileFormat }
    const job = await API.startExportDataMatrixJob({ surveyId, cycle, options })
    dispatch(JobActions.showJobMonitor({ job, closeButton: DataMatrixExportDownloadButton }) as any)
    onClose()
  }

  return (
    <div className="data-matrix-export">
      <Markdown
        className="data-matrix-export__intro"
        source={i18n.t('dataView:dataMatrixExport.intro', {
          entity: entityLabel,
          keys: keysLabel,
          interpolation: { escapeValue: false },
        })}
      />
      <AttributeDropdown
        info="dataView:dataMatrixExport.rowAttributeInfo"
        items={attributeItems}
        label="dataView:dataMatrixExport.rowAttribute"
        onChange={setRowDefUuid}
        testId={TestId.dataExport.dataMatrixRowAttribute}
        value={rowDefUuid}
      />
      <AttributeDropdown
        info="dataView:dataMatrixExport.secondRowAttributeInfo"
        items={attributeItems.filter((item) => item.value !== rowDefUuid)}
        label="dataView:dataMatrixExport.secondRowAttribute"
        onChange={setSecondRowDefUuid}
        testId={TestId.dataExport.dataMatrixSecondRowAttribute}
        value={secondRowDefUuid}
      />
      <AttributeDropdown
        info="dataView:dataMatrixExport.valueAttributeInfo"
        items={attributeItems}
        label="dataView:dataMatrixExport.valueAttribute"
        onChange={setValueDefUuid}
        testId={TestId.dataExport.dataMatrixValueAttribute}
        value={valueDefUuid}
      />
      <DataMatrixPreview
        keysLabel={keysLabel}
        rowLabels={previewRowLabels}
        valueLabel={getAttributeLabel(valueDefUuid, 'dataView:dataMatrixExport.valueAttribute')}
      />
      <p className="data-matrix-export__records">
        {i18n.t(filter ? 'dataView:dataMatrixExport.recordsFiltered' : 'dataView:dataMatrixExport.recordsAll')}
      </p>
      <FormItem label="dataExportView:options.fileFormatLabel">
        <ButtonGroup
          groupName="fileFormat"
          items={fileFormats.map((key) => ({ key, label: `dataExportView:options.fileFormat.${key}` }))}
          onChange={setFileFormat as any}
          selectedItemKey={fileFormat}
        />
      </FormItem>
      <Button
        className="btn-primary"
        disabled={!rowDefUuid || !valueDefUuid}
        label="dataExportView:startExport"
        onClick={onExportClick}
        testId={TestId.dataExport.startExport}
      />
    </div>
  )
}
