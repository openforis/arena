import './RecordsDataMatrixExportModal.scss'

import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import type { Survey as ArenaSurvey } from '@openforis/arena-core'

import { getDataMatrixAttributeDefs } from '@common/dataExport/dataMatrixExport'
import { FileFormats } from '@core/fileFormats'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { Button, RadioButtonGroup } from '@webapp/components'
import { ButtonGroup } from '@webapp/components/form'
import Dropdown from '@webapp/components/form/Dropdown'
import { FormItem } from '@webapp/components/form/Input'
import { Modal, ModalBody } from '@webapp/components/modal'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { RecordListActions } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'

import { useDataExportSource } from '../../DataExport/useDataExportSource'

const fileFormats = [FileFormats.xlsx, FileFormats.csv]

type DropdownItem = { value: string; label: string }

type Props = {
  onClose: () => void
  recordUuids?: string[]
  search?: string
}

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

export const RecordsDataMatrixExportModal = (props: Props) => {
  const { onClose, recordUuids, search } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey() as ArenaSurvey
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const { availableSources, multipleSources, onSourceChange, source, sourceParams } = useDataExportSource({
    recordUuids,
    search,
  })

  const [entityDefUuid, setEntityDefUuid] = useState<string | null>(null)
  const [rowDefUuid, setRowDefUuid] = useState<string | null>(null)
  const [secondRowDefUuid, setSecondRowDefUuid] = useState<string | null>(null)
  const [valueDefUuid, setValueDefUuid] = useState<string | null>(null)
  const [fileFormat, setFileFormat] = useState(FileFormats.xlsx)

  const hierarchy = useMemo(() => Survey.getHierarchy(NodeDef.isEntity, cycle)(survey), [cycle, survey])

  const attributeItems: DropdownItem[] = useMemo(() => {
    if (!entityDefUuid) return []
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    return getDataMatrixAttributeDefs({ survey, cycle, entityDef }).map((nodeDef) => ({
      value: NodeDef.getUuid(nodeDef),
      label: NodeDef.getLabel(nodeDef, lang),
    }))
  }, [cycle, entityDefUuid, lang, survey])

  const onEntityChange = useCallback((value: string | null) => {
    setEntityDefUuid(value)
    setRowDefUuid(null)
    setSecondRowDefUuid(null)
    setValueDefUuid(null)
  }, [])

  const onExportClick = () => {
    const rowAttributeDefUuids = [rowDefUuid, secondRowDefUuid].filter(Boolean)
    const options = { entityDefUuid, rowAttributeDefUuids, valueAttributeDefUuid: valueDefUuid, fileFormat }
    dispatch(RecordListActions.startDataMatrixExport({ ...sourceParams, options }) as any)
    onClose()
  }

  return (
    <Modal
      className="records-data-matrix-export"
      onClose={onClose}
      showCloseButton
      title="dataView:dataMatrixExport.title"
    >
      <ModalBody>
        <p className="records-data-matrix-export__info">{i18n.t('dataView:dataMatrixExport.info')}</p>
        {multipleSources && (
          <FormItem label="dataView:dataExport.source.label">
            <RadioButtonGroup onChange={onSourceChange} value={source} items={availableSources} />
          </FormItem>
        )}
        <FormItem info="dataView:dataMatrixExport.entityInfo" label="dataView:dataMatrixExport.entity">
          <EntitySelector
            filterFn={NodeDef.isMultipleEntity}
            hierarchy={hierarchy}
            nodeDefUuidEntity={entityDefUuid}
            onChange={onEntityChange}
            showSingleEntities={false}
          />
        </FormItem>
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
          disabled={!entityDefUuid || !rowDefUuid || !valueDefUuid}
          label="dataExportView:startExport"
          onClick={onExportClick}
          testId={TestId.dataExport.startExport}
        />
      </ModalBody>
    </Modal>
  )
}
