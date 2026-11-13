import { I18n } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'

export const UploadedRecordAction = {
  inserted: 'inserted',
  updated: 'updated',
} as const

export type UploadedRecordAction = (typeof UploadedRecordAction)[keyof typeof UploadedRecordAction]

export interface UploadedRecordInfo {
  uuid: string
  action: UploadedRecordAction
  cycle: string
  keyValues: { label: string; value: string }[]
  ownerName: string
  dateCreated: Date | string | null
  dateModified: Date | string | null
  errors: number
  warnings: number
}

const msgKey = 'emails:recordsUploadedFromMobile'

// dates are shown in UTC: the recipients can be in any time zone
const formatDateUTC = (date: Date | string | null | undefined): string => {
  if (!date) return ''
  const dateObj = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(dateObj.getTime())) return ''
  return `${dateObj.toISOString().substring(0, 16).replace('T', ' ')} UTC`
}

const escape = (text: string | number | null | undefined): string => StringUtils.escapeHtml(String(text ?? ''))

const cell = (content: string, tag = 'td'): string =>
  `<${tag} style="border: 1px solid; padding: 4px 8px; text-align: left;">${content}</${tag}>`

const formatKeyValues = (keyValues: UploadedRecordInfo['keyValues']): string =>
  keyValues.map(({ label, value }) => `${escape(label)}: <b>${escape(value)}</b>`).join('<br/>')

const buildRecordsTable = ({
  i18n,
  records,
  cycleVisible,
}: {
  i18n: I18n
  records: UploadedRecordInfo[]
  cycleVisible: boolean
}): string => {
  const t = (key: string): string => i18n.t(`${msgKey}.${key}`)
  const headers = [
    t('table.keys'),
    ...(cycleVisible ? [t('table.cycle')] : []),
    t('table.action'),
    t('table.owner'),
    t('table.dateCreated'),
    t('table.dateModified'),
    t('table.validation'),
    t('table.uuid'),
  ]
  const headerRow = headers.map((header) => cell(escape(header), 'th')).join('')
  const rows = records.map((record) => {
    const cells = [
      formatKeyValues(record.keyValues),
      // cycle keys are 0-based, cycles are shown 1-based in the UI
      ...(cycleVisible ? [String(Number(record.cycle) + 1)] : []),
      escape(t(`action.${record.action}`)),
      escape(record.ownerName),
      formatDateUTC(record.dateCreated),
      formatDateUTC(record.dateModified),
      `${record.errors} / ${record.warnings}`,
      `<code>${escape(record.uuid)}</code>`,
    ]
    return `<tr>${cells.map((content) => cell(content)).join('')}</tr>`
  })
  return `<table style="border-collapse: collapse;"><thead><tr>${headerRow}</tr></thead><tbody>${rows.join('')}</tbody></table>`
}

/**
 * Generates the params of the email sent to a survey admin when records are uploaded from Arena Mobile.
 * @param params - The parameters.
 * @param params.i18n - The i18n instance used to translate the email.
 * @param params.recipientName - Name of the survey admin receiving the email.
 * @param params.surveyName - Name of the survey.
 * @param params.surveyLabel - Label of the survey in its default language.
 * @param params.cycleVisible - Whether to show the record cycle (survey with more than one cycle).
 * @param params.uploadedByName - Name of the user who uploaded the records.
 * @param params.uploadedByEmail - Email of the user who uploaded the records.
 * @param params.dateSubmitted - Date of the upload.
 * @param params.records - The uploaded records.
 * @param params.serverUrl - The public URL of the server (the link to it is omitted when empty).
 * @returns The message params.
 */
const getMsgParams = (params: {
  i18n: I18n
  recipientName: string
  surveyName: string
  surveyLabel?: string | null
  cycleVisible: boolean
  uploadedByName: string
  uploadedByEmail: string
  dateSubmitted: Date
  records: UploadedRecordInfo[]
  serverUrl?: string | null
}): Record<string, unknown> => {
  const { i18n, recipientName, surveyName, surveyLabel, cycleVisible, records, serverUrl } = params
  return {
    count: records.length,
    name: recipientName,
    surveyName,
    surveyFullName: surveyLabel ? `${surveyName} - ${surveyLabel}` : surveyName,
    uploadedByName: params.uploadedByName,
    uploadedByEmail: params.uploadedByEmail,
    dateSubmitted: formatDateUTC(params.dateSubmitted),
    recordsTable: buildRecordsTable({ i18n, records, cycleVisible }),
    accessLinkMsg: serverUrl ? i18n.t(`${msgKey}.accessLink`, { serverUrl }) : '',
  }
}

export const RecordsUploadedFromMobileEmail = { msgKey, getMsgParams }
