import {
  getRecordPrintableExportUrl,
  PrintableExportFormats,
  PrintableExportScopes,
  PrintOrientations,
} from '@webapp/service/api/data/recordPrintableExportUrl'

describe('getRecordPrintableExportUrl', () => {
  test('includes scope, entity, and orientation query params', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: PrintableExportFormats.pdf,
      exportScope: PrintableExportScopes.currentPage,
      entityDefUuid: 'def-1',
      entityNodeUuid: 'node-1',
      orientation: PrintOrientations.landscape,
    })
    expect(url).toContain('/api/survey/1/record/rec-1/export/pdf?')
    expect(url).toContain(`exportScope=${PrintableExportScopes.currentPage}`)
    expect(url).toContain('entityDefUuid=def-1')
    expect(url).toContain('entityNodeUuid=node-1')
    expect(url).toContain(`orientation=${PrintOrientations.landscape}`)
    expect(url).toContain('lang=en')
  })

  test('omits entity params for full export', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: PrintableExportFormats.docx,
      exportScope: PrintableExportScopes.full,
      orientation: PrintOrientations.portrait,
    })
    expect(url).toContain('/export/docx?')
    expect(url).toContain(`exportScope=${PrintableExportScopes.full}`)
    expect(url).not.toContain('entityDefUuid')
  })

  test('includes includeQrCode when true', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: PrintableExportFormats.pdf,
      exportScope: PrintableExportScopes.currentPage,
      entityDefUuid: 'def-1',
      entityNodeUuid: 'node-1',
      orientation: PrintOrientations.portrait,
      includeQrCode: true,
    })
    expect(url).toContain('includeQrCode=true')
  })

  test('omits includeQrCode when false or unset', () => {
    const params = {
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: PrintableExportFormats.pdf,
    }
    const urlWithoutQrCode = getRecordPrintableExportUrl(params)
    const urlWithQrCodeDisabled = getRecordPrintableExportUrl({ ...params, includeQrCode: false })

    expect(urlWithoutQrCode).not.toContain('includeQrCode')
    expect(urlWithQrCodeDisabled).not.toContain('includeQrCode')
  })
})
