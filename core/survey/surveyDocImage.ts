import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

import * as SurveyFile from './surveyFile'

export enum DocumentPlace {
  header = 'header',
  footer = 'footer',
}

export const propKeys = {
  documentPlace: 'documentPlace',
  applyIf: 'applyIf',
} as const

export type SurveyDocImageProps = {
  documentPlace?: DocumentPlace
  applyIf?: string
  labels?: Record<string, string>
  name?: string
  size?: number | null
  temporary?: boolean
  type?: string
}

export type SurveyDocImage = {
  uuid: string
  props: SurveyDocImageProps
  content?: Buffer | null
  dateCreated: string
}

export const getDocumentPlace = (image: SurveyDocImage): DocumentPlace | undefined =>
  ObjectUtils.getProp<DocumentPlace | undefined>(propKeys.documentPlace)(image)

export const getApplyIf = (image: SurveyDocImage): string => ObjectUtils.getProp<string>(propKeys.applyIf, '')(image)

export const assocDocumentPlace =
  (place: DocumentPlace) =>
  (image: SurveyDocImage): SurveyDocImage =>
    ObjectUtils.setProp(propKeys.documentPlace, place)(image) as SurveyDocImage

export const assocApplyIf =
  (expr: string) =>
  (image: SurveyDocImage): SurveyDocImage =>
    ObjectUtils.setProp(propKeys.applyIf, expr)(image) as SurveyDocImage

type CreateSurveyDocImageParams = {
  name?: string
  labels?: Record<string, string> | null
  size?: number | null
  documentPlace?: DocumentPlace | null
  applyIf?: string
  temporary?: boolean
}

export const createSurveyDocImage = ({
  name,
  labels,
  size,
  documentPlace,
  applyIf,
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
  if (applyIf) file = assocApplyIf(applyIf)(file)
  return file
}

export const assocLabels =
  (labels: Record<string, string>) =>
  (image: SurveyDocImage): SurveyDocImage =>
    R.pipe(SurveyFile.assocLabels(labels))(image) as SurveyDocImage
