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

export type SurveyDocImageProps = {
  documentPlace?: DocumentPlace
  expression?: string
  labels?: Record<string, string>
  name?: string
  size?: number | null
  temporary?: boolean
  type?: string
}

export type SurveyDocImage = {
  uuid: string
  props: SurveyDocImageProps
  content: unknown | null
  dateCreated: string
}

export const getDocumentPlace = (image: SurveyDocImage): DocumentPlace | undefined =>
  ObjectUtils.getProp<DocumentPlace | undefined>(propKeys.documentPlace)(image)

export const getExpression = (image: SurveyDocImage): string =>
  ObjectUtils.getProp<string>(propKeys.expression, '')(image)

export const assocDocumentPlace =
  (place: DocumentPlace) =>
  (image: SurveyDocImage): SurveyDocImage =>
    ObjectUtils.setProp(propKeys.documentPlace, place)(image) as SurveyDocImage

export const assocExpression =
  (expr: string) =>
  (image: SurveyDocImage): SurveyDocImage =>
    ObjectUtils.setProp(propKeys.expression, expr)(image) as SurveyDocImage

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
}: CreateSurveyDocImageParams): SurveyDocImage => {
  let file = SurveyFile.createFile({
    name,
    labels,
    size,
    type: SurveyFile.SurveyFileType.surveyDocImage,
    temporary,
  }) as SurveyDocImage
  if (documentPlace) file = assocDocumentPlace(documentPlace)(file)
  if (expression) file = assocExpression(expression)(file)
  return file
}

export const assocLabels =
  (labels: Record<string, string>) =>
  (image: SurveyDocImage): SurveyDocImage =>
    R.pipe(SurveyFile.assocLabels(labels))(image) as SurveyDocImage
