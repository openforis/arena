import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

import * as SurveyFile from './surveyFile'

export enum DocumentPlace {
  header = 'header',
  footer = 'footer',
}

export const propKeys = {
  documentPlace: 'documentPlace',
  expression: 'expression',
} as const

export const getDocumentPlace = ObjectUtils.getProp<DocumentPlace | undefined>(propKeys.documentPlace)
export const getExpression = ObjectUtils.getProp<string>(propKeys.expression, '')

export const assocDocumentPlace = (place: DocumentPlace) => ObjectUtils.setProp(propKeys.documentPlace, place)
export const assocExpression = (expr: string) => ObjectUtils.setProp(propKeys.expression, expr)

type CreateSurveyDocImageParams = {
  name?: string
  labels?: Record<string, string> | null
  size?: number | null
  documentPlace?: DocumentPlace | null
  expression?: string
  temporary?: boolean
}

export const createSurveyDocImage = ({
  name,
  labels,
  size,
  documentPlace,
  expression,
  temporary = false,
}: CreateSurveyDocImageParams) => {
  let file = SurveyFile.createFile({
    name,
    labels,
    size,
    type: SurveyFile.SurveyFileType.surveyDocImage,
    temporary,
  })
  if (documentPlace) file = assocDocumentPlace(documentPlace)(file)
  if (expression) file = assocExpression(expression)(file)
  return file
}

export const assocLabels = (labels: Record<string, string>) => (file: object) =>
  R.pipe(SurveyFile.assocLabels(labels))(file)
