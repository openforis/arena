import { getRecordPrintableExportUrl } from '@webapp/service/api/data/recordPrintableExportUrl'

describe('getRecordPrintableExportUrl', () => {
  test('includes scope, entity, and orientation query params', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: 'pdf',
      exportScope: 'currentPage',
      entityDefUuid: 'def-1',
      entityNodeUuid: 'node-1',
      orientation: 'landscape',
    })
    expect(url).toContain('/api/survey/1/record/rec-1/export/pdf?')
    expect(url).toContain('exportScope=currentPage')
    expect(url).toContain('entityDefUuid=def-1')
    expect(url).toContain('entityNodeUuid=node-1')
    expect(url).toContain('orientation=landscape')
    expect(url).toContain('lang=en')
  })

  test('omits entity params for full export', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: 'docx',
      exportScope: 'full',
      orientation: 'portrait',
    })
    expect(url).toContain('/export/docx?')
    expect(url).toContain('exportScope=full')
    expect(url).not.toContain('entityDefUuid')
  })
})
