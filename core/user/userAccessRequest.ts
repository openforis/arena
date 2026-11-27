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
  title: 'title',
  firstName: 'firstName',
  lastName: 'lastName',
  country: 'country',
  institution: 'institution',
  purpose: 'purpose',
  surveyName: 'surveyName',
  templateUuid: 'templateUuid',
} as const

// props set by the server (not by the user filling the form)
export const keysPropsSystem = {
  selfRegistered: 'selfRegistered',
} as const

export const keysPropsNamesLowercase = Object.values(keysProps).map((prop) => prop.toLowerCase())

export const status = {
  ACCEPTED: 'ACCEPTED',
  CREATED: 'CREATED',
  REJECTED: 'REJECTED',
} as const

export type UserAccessRequestStatus = (typeof status)[keyof typeof status]

export type UserAccessRequestProps = {
  // user title key (see User.titleKeys)
  [keysProps.title]?: string
  [keysProps.firstName]?: string
  [keysProps.lastName]?: string
  [keysProps.country]?: string
  [keysProps.institution]?: string
  [keysProps.purpose]?: string
  [keysProps.surveyName]?: string
  [keysProps.templateUuid]?: string | null
  // accepted automatically: the user created the account (self-registration)
  [keysPropsSystem.selfRegistered]?: boolean
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

// access request submitted by a user (with the reCaptcha token)
export type UserAccessRequestSubmission = Pick<UserAccessRequest, 'email' | 'props'> & { reCaptchaToken?: string }

export const editableFields = [
  { name: keys.email, required: true },
  { name: `props.${keysProps.title}`, required: true },
  { name: `props.${keysProps.firstName}`, required: true },
  { name: `props.${keysProps.lastName}`, required: true },
  { name: `props.${keysProps.institution}`, required: true },
  { name: `props.${keysProps.country}`, required: true },
  { name: `props.${keysProps.purpose}`, required: true },
  { name: `props.${keysProps.surveyName}`, required: true, normalizeFn: normalizeName },
  { name: `props.${keysProps.templateUuid}`, required: false },
]

export const getEmail = A.prop(keys.email)
export const isSelfRegistered = (userAccessRequest: UserAccessRequest): boolean =>
  Boolean(userAccessRequest.props?.[keysPropsSystem.selfRegistered])
/**
 * Returns the props filled in by the user (without the ones set by the server).
 */
export const pickEditableProps = (props: UserAccessRequestProps = {}): UserAccessRequestProps =>
  Object.fromEntries(
    Object.values(keysProps)
      .filter((key) => props[key] !== undefined)
      .map((key) => [key, props[key]])
  )
export const getStatus = (userAccessRequest: UserAccessRequest): UserAccessRequestStatus => userAccessRequest.status
export const getAcceptedByName = (userAccessRequest: UserAccessRequest) => userAccessRequest.acceptedByName ?? null
export const getAcceptedByEmail = (userAccessRequest: UserAccessRequest) => userAccessRequest.acceptedByEmail ?? null
export const getCreatedSurveyName = (userAccessRequest: UserAccessRequest) =>
  userAccessRequest.createdSurveyName ?? null

export const { getDateCreated, getDateModified } = ObjectUtils
