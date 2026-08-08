import React, { useEffect, useMemo, useState } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import CropPortraitIcon from '@mui/icons-material/CropPortrait'
import CropLandscapeIcon from '@mui/icons-material/CropLandscape'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { Button, ButtonDownload } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'
import { RadioButtonGroup } from '@webapp/components/RadioButtonGroup'
import { useI18n } from '@webapp/store/system'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'
import {
  getRecordPrintableExportUrl,
  PrintableExportFormat,
  PrintableExportScope,
  PrintOrientation,
} from '@webapp/service/api/data/recordPrintableExportUrl'

type Props = {
  open: boolean
  initialFormat: PrintableExportFormat
  onClose: () => void
}

export const RecordPrintableExportModal = ({ open, initialFormat, onClose }: Props) => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const record = useRecord()
  const nodeDefPage = useNodeDefPage()
  const pagesUuidMap = usePagesUuidMap()

  const [format, setFormat] = useState<PrintableExportFormat>(initialFormat)
  const [exportScope, setExportScope] = useState<PrintableExportScope>('currentPage')
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait')

  useEffect(() => {
    setFormat(initialFormat)
  }, [initialFormat])

  const entityDefUuid = NodeDef.getUuid(nodeDefPage)
  const entityLabel = NodeDef.getLabel(nodeDefPage, lang) || NodeDef.getName(nodeDefPage)

  const entityNodeUuid = useMemo(() => {
    const mapped = pagesUuidMap?.[entityDefUuid]
    if (mapped) return mapped
    if (!record) return null
    const nodes = Record.getNodesByDefUuid(entityDefUuid)(record)
    if (nodes.length === 1) return Node.getUuid(nodes[0])
    return null
  }, [entityDefUuid, pagesUuidMap, record])

  const href = useMemo(() => {
    if (!record) return null
    return getRecordPrintableExportUrl({
      surveyId,
      recordUuid: Record.getUuid(record),
      lang,
      format,
      exportScope,
      orientation,
      ...(exportScope === 'currentPage' ? { entityDefUuid, entityNodeUuid: entityNodeUuid ?? undefined } : {}),
    })
  }, [surveyId, record, lang, format, exportScope, orientation, entityDefUuid, entityNodeUuid])

  if (!open) return null

  const canDownload = exportScope === 'full' || Boolean(entityDefUuid && entityNodeUuid)
  const showCurrentPageUnavailable = exportScope === 'currentPage' && !entityNodeUuid

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
                { key: 'pdf', label: 'surveyForm:printableExport.formats.pdf' },
                { key: 'docx', label: 'surveyForm:printableExport.formats.docx' },
              ]}
            />
          </FormItem>
          <FormItem label="surveyForm:printableExport.scope">
            <RadioButtonGroup
              row
              value={exportScope}
              onChange={(value) => setExportScope(value as PrintableExportScope)}
              items={[
                { key: 'full', label: 'surveyForm:printableExport.scopes.full' },
                { key: 'currentPage', label: 'surveyForm:printableExport.scopes.currentPage' },
              ]}
            />
            {exportScope === 'currentPage' && (
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
          <FormItem label="surveyForm:printableExport.orientation">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={i18n.t('surveyForm:printableExport.orientations.portrait')}>
                <IconButton
                  color={orientation === 'portrait' ? 'primary' : 'default'}
                  onClick={() => setOrientation('portrait')}
                  aria-label={i18n.t('surveyForm:printableExport.orientations.portrait')}
                >
                  <CropPortraitIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={i18n.t('surveyForm:printableExport.orientations.landscape')}>
                <IconButton
                  color={orientation === 'landscape' ? 'primary' : 'default'}
                  onClick={() => setOrientation('landscape')}
                  aria-label={i18n.t('surveyForm:printableExport.orientations.landscape')}
                >
                  <CropLandscapeIcon />
                </IconButton>
              </Tooltip>
            </Box>
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
