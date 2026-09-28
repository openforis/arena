import React, { useMemo, useState } from 'react'
import { Box } from '@mui/material'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import {
  PrintOrientations,
  PrintableExportFormats,
  PrintableExportScopes,
  type PrintOrientation,
  type PrintableExportFormat,
  type PrintableExportScope,
} from '@common/record/printableExport'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { Button, ButtonDownload } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { RadioButtonGroup } from '@webapp/components/RadioButtonGroup'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'
import {
  getPageEntity,
  hasUnresolvedMultipleAncestor,
  type PagesUuidMap,
} from '@webapp/store/ui/record/recordPageEntity'
import { getRecordPrintableExportUrl } from '@webapp/service/api/data/recordPrintableExportUrl'

type Props = {
  open: boolean
  initialFormat: PrintableExportFormat
  onClose: () => void
}

export const RecordPrintableExportModal = ({ open, initialFormat, onClose }: Props) => {
  const i18n = useI18n()
  const survey = useSurvey() as object
  const surveyId = useSurveyId() as string | number
  const lang = useSurveyPreferredLang() as string
  const record = useRecord() as object | null | undefined
  const nodeDefPage = useNodeDefPage() as object
  const pagesUuidMap = usePagesUuidMap() as PagesUuidMap

  const [format, setFormat] = useState<PrintableExportFormat>(initialFormat)
  const [exportScope, setExportScope] = useState<PrintableExportScope>(PrintableExportScopes.currentPage)
  const [orientation, setOrientation] = useState<PrintOrientation>(PrintOrientations.portrait)
  const [includeQrCode, setIncludeQrCode] = useState(false)
  const [prevInitialFormat, setPrevInitialFormat] = useState(initialFormat)
  const [prevOpen, setPrevOpen] = useState(open)

  // adjust the state when the props change (during rendering instead of in effects, to avoid cascading renders)
  if (initialFormat !== prevInitialFormat) {
    setPrevInitialFormat(initialFormat)
    setFormat(initialFormat)
  }
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setIncludeQrCode(false)
      setExportScope(PrintableExportScopes.currentPage)
      setOrientation(PrintOrientations.portrait)
    }
  }

  const onIncludeQrCodeChange = (checked: boolean) => {
    setIncludeQrCode(checked)
    if (checked) {
      // the QR code can be included only when exporting the current page
      setExportScope(PrintableExportScopes.currentPage)
    }
  }

  const entityDefUuid = NodeDef.getUuid(nodeDefPage)
  const entityLabel = NodeDef.getLabel(nodeDefPage, lang) || NodeDef.getName(nodeDefPage)

  const entityNodeIId = useMemo(() => {
    if (!record) return null
    const pageEntity = getPageEntity({
      survey,
      record,
      pagesUuidMap,
      pageNodeDefUuid: entityDefUuid,
    })
    return pageEntity ? Node.getIId(pageEntity) : null
  }, [survey, record, pagesUuidMap, entityDefUuid])

  const unresolvedMultipleAncestor = useMemo(
    () => hasUnresolvedMultipleAncestor(nodeDefPage, survey, pagesUuidMap),
    [nodeDefPage, survey, pagesUuidMap]
  )

  const href = useMemo(() => {
    if (!record) return null
    return getRecordPrintableExportUrl({
      surveyId,
      recordUuid: Record.getUuid(record),
      lang,
      format,
      exportScope,
      orientation,
      includeQrCode,
      ...(exportScope === PrintableExportScopes.currentPage
        ? { entityDefUuid, entityNodeIId: entityNodeIId ?? undefined }
        : {}),
    })
  }, [surveyId, record, lang, format, exportScope, orientation, includeQrCode, entityDefUuid, entityNodeIId])

  if (!open) return null

  const canDownload =
    exportScope === PrintableExportScopes.full || Boolean(entityDefUuid && entityNodeIId && !unresolvedMultipleAncestor)
  const showCurrentPageUnavailable =
    exportScope === PrintableExportScopes.currentPage && (!entityNodeIId || unresolvedMultipleAncestor)

  return (
    <Modal onClose={onClose} title="surveyForm:printableExport.title">
      <ModalBody>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormItem label="surveyForm:printableExport.format">
            <RadioButtonGroup
              row
              value={format}
              onChange={(value) => setFormat(value as PrintableExportFormat)}
              items={[
                { key: PrintableExportFormats.pdf, label: 'surveyForm:printableExport.formats.pdf' },
                { key: PrintableExportFormats.docx, label: 'surveyForm:printableExport.formats.docx' },
              ]}
            />
          </FormItem>
          <FormItem label="surveyForm:printableExport.scope">
            <RadioButtonGroup
              row
              value={exportScope}
              onChange={(value) => setExportScope(value as PrintableExportScope)}
              items={[
                {
                  key: PrintableExportScopes.full,
                  label: 'surveyForm:printableExport.scopes.full',
                  disabled: includeQrCode,
                },
                {
                  key: PrintableExportScopes.currentPage,
                  label: 'surveyForm:printableExport.scopes.currentPage',
                },
              ]}
            />
            {exportScope === PrintableExportScopes.currentPage && (
              <Box sx={{ mt: 1, typography: 'body2', color: 'text.secondary' }}>
                {i18n.t('surveyForm:printableExport.currentPageHint', { entityLabel })}
              </Box>
            )}
            {showCurrentPageUnavailable && (
              <Box sx={{ mt: 1, typography: 'body2', color: 'error.main' }}>
                {i18n.t('surveyForm:printableExport.currentPageUnavailable')}
              </Box>
            )}
          </FormItem>
          <Checkbox
            checked={includeQrCode}
            onChange={onIncludeQrCodeChange}
            label="surveyForm:printableExport.includeQrCode"
            info="surveyForm:printableExport.includeQrCodeInfo"
          />
          <FormItem label="surveyForm:printableExport.orientation">
            <RadioButtonGroup
              row
              value={orientation}
              onChange={(value) => setOrientation(value as PrintOrientation)}
              items={[
                {
                  key: PrintOrientations.portrait,
                  label: 'surveyForm:printableExport.orientations.portrait',
                },
                {
                  key: PrintOrientations.landscape,
                  label: 'surveyForm:printableExport.orientations.landscape',
                },
              ]}
            />
          </FormItem>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button label="common.cancel" onClick={onClose} variant="text" />
        <ButtonDownload
          disabled={!canDownload || !href}
          href={href}
          label="surveyForm:printableExport.download"
          onClick={onClose}
        />
      </ModalFooter>
    </Modal>
  )
}
