import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import { normalizeName } from '@core/stringUtils'

export const keys = {
  acceptedByEmail: 'acceptedByEmail',
  acceptedByName: 'acceptedByName',
  email: 'email',
  props: ObjectUtils.keys.props,
  status: 'status',
} as const

export const keysProps = {
  firstName: 'firstName',
  lastName: 'lastName',
  country: 'country',
  institution: 'institution',
  purpose: 'purpose',
  surveyName: 'surveyName',
  templateUuid: 'templateUuid',
} as const

export const keysPropsNamesLowercase = Object.values(keysProps).map((prop) => prop.toLowerCase())

export const status = {
  ACCEPTED: 'ACCEPTED',
  CREATED: 'CREATED',
  REJECTED: 'REJECTED',
} as const

export type UserAccessRequestStatus = (typeof status)[keyof typeof status]

export type UserAccessRequestProps = {
  [keysProps.firstName]?: string
  [keysProps.lastName]?: string
  [keysProps.country]?: string
  [keysProps.institution]?: string
  [keysProps.purpose]?: string
  [keysProps.surveyName]?: string
  [keysProps.templateUuid]?: string | null
}

// not defined in @openforis/arena-core yet
export type UserAccessRequest = {
  uuid: string
  email: string
  props: UserAccessRequestProps
  status: UserAccessRequestStatus
  dateCreated?: string
  dateModified?: string | null
  acceptedByName?: string | null
  acceptedByEmail?: string | null
  templateName?: string | null
  createdSurveyName?: string | null
}

export const editableFields = [
  { name: keys.email, required: true },
  { name: `props.${keysProps.firstName}`, required: true },
  { name: `props.${keysProps.lastName}`, required: true },
  { name: `props.${keysProps.institution}`, required: true },
  { name: `props.${keysProps.country}`, required: true },
  { name: `props.${keysProps.purpose}`, required: true },
  { name: `props.${keysProps.surveyName}`, required: true, normalizeFn: normalizeName },
  { name: `props.${keysProps.templateUuid}`, required: false },
]

export const getEmail = A.prop(keys.email)
export const getStatus = (userAccessRequest: UserAccessRequest): UserAccessRequestStatus => userAccessRequest.status
export const getAcceptedByName = (userAccessRequest: UserAccessRequest) => userAccessRequest.acceptedByName ?? null
export const getAcceptedByEmail = (userAccessRequest: UserAccessRequest) => userAccessRequest.acceptedByEmail ?? null
export const getCreatedSurveyName = (userAccessRequest: UserAccessRequest) =>
  userAccessRequest.createdSurveyName ?? null

export const { getDateCreated, getDateModified } = ObjectUtils
