import * as i18nFactory from '@core/i18n/i18nFactory'

import {
  RecordsUploadedFromMobileEmail,
  UploadedRecordAction,
  UploadedRecordInfo,
} from '@server/modules/mobile/service/recordsUploadedFromMobileEmail'

const { msgKey, getMsgParams } = RecordsUploadedFromMobileEmail

const newRecord = (overrides: Partial<UploadedRecordInfo> = {}): UploadedRecordInfo => ({
  uuid: '11111111-2222-3333-4444-555555555555',
  action: UploadedRecordAction.inserted,
  cycle: '0',
  keyValues: [
    { label: 'Cluster', value: '12' },
    { label: 'Plot', value: '3' },
  ],
  ownerName: 'Field Collector',
  dateCreated: '2026-11-10T08:30:00.000Z',
  dateModified: new Date('2026-11-11T17:05:00.000Z'),
  errors: 2,
  warnings: 1,
  ...overrides,
})

const renderEmail = async (
  params: { records?: UploadedRecordInfo[]; surveyLabel?: string; cycleVisible?: boolean; serverUrl?: string } = {}
) => {
  const { records = [newRecord()], surveyLabel = 'My Survey', cycleVisible = false, serverUrl = '' } = params
  const i18n = await i18nFactory.createI18nAsync('en')
  const msgParams = getMsgParams({
    i18n,
    recipientName: 'Survey Admin',
    surveyName: 'my_survey',
    surveyLabel,
    cycleVisible,
    uploadedByName: 'Mobile User',
    uploadedByEmail: 'mobile.user@example.org',
    dateSubmitted: new Date('2026-11-13T09:15:00.000Z'),
    records,
    serverUrl,
  })
  return { subject: i18n.t(`${msgKey}.subject`, msgParams), body: i18n.t(`${msgKey}.body`, msgParams) }
}

describe('Records uploaded from Arena Mobile email', () => {
  test('subject contains the number of records and the survey name', async () => {
    expect((await renderEmail()).subject).toBe(
      "Open Foris Arena - 1 record uploaded from Arena Mobile to survey 'my_survey'"
    )
    const { subject } = await renderEmail({ records: [newRecord(), newRecord({ uuid: 'other' })] })
    expect(subject).toBe("Open Foris Arena - 2 records uploaded from Arena Mobile to survey 'my_survey'")
  })

  test('body contains the uploading user, the survey and the submission date', async () => {
    const { body } = await renderEmail()
    expect(body).toContain('Hello Survey Admin,')
    expect(body).toContain('Mobile User (mobile.user@example.org)')
    expect(body).toContain('<b>my_survey - My Survey</b>')
    expect(body).toContain('2026-11-13 09:15 UTC')
  })

  test('survey label is omitted when empty', async () => {
    const { body } = await renderEmail({ surveyLabel: '' })
    expect(body).toContain('<b>my_survey</b>')
  })

  test('body lists the record details', async () => {
    const { body } = await renderEmail()
    expect(body).toContain('Cluster: <b>12</b><br/>Plot: <b>3</b>')
    expect(body).toContain('>New<')
    expect(body).toContain('>Field Collector<')
    expect(body).toContain('2026-11-10 08:30 UTC')
    expect(body).toContain('2026-11-11 17:05 UTC')
    expect(body).toContain('>2 / 1<')
    expect(body).toContain('<code>11111111-2222-3333-4444-555555555555</code>')
  })

  test('updated records are marked as such', async () => {
    const { body } = await renderEmail({ records: [newRecord({ action: UploadedRecordAction.updated })] })
    expect(body).toContain('>Updated<')
  })

  test('cycle column is shown only when the survey has more than one cycle', async () => {
    expect((await renderEmail()).body).not.toContain('>Cycle<')
    const { body } = await renderEmail({ cycleVisible: true, records: [newRecord({ cycle: '1' })] })
    expect(body).toContain('>Cycle<')
    expect(body).toContain('>2<')
  })

  test('values are HTML escaped', async () => {
    const records = [newRecord({ keyValues: [{ label: 'Name', value: '<script>x</script>' }], ownerName: 'A & B' })]
    const { body } = await renderEmail({ records })
    expect(body).not.toContain('<script>')
    expect(body).toContain('&lt;script&gt;')
    expect(body).toContain('A &amp; B')
  })

  test('link to the server is included only when its public URL is known', async () => {
    expect((await renderEmail()).body).not.toContain('Click here to access')
    const { body } = await renderEmail({ serverUrl: 'https://arena.example.org' })
    // the URL is HTML escaped (browsers decode it in the href)
    expect(body).toContain('<a href="https:&#x2F;&#x2F;arena.example.org">Click here to access Open Foris Arena</a>')
  })

  test('body has no unresolved placeholders', async () => {
    const { body } = await renderEmail({ serverUrl: 'https://arena.example.org', cycleVisible: true })
    expect(body).not.toMatch(/\{\{|\$t\(|undefined/)
  })
})
