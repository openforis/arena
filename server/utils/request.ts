import * as R from 'ramda';
import User from '../../core/user/user';
import express from 'express';
import { IUser } from '../../core/user/_user/userKeys';

export const getServerUrl = (req: express.Request) => `${req.protocol}://${req.get('host')}`

export const getParams = (req: express.Request) => R.pipe(
  R.mergeLeft(R.prop('query', req)),
  R.mergeLeft(R.prop('params', req)),
  R.mergeLeft(R.prop('body', req)),
  // convert String boolean values to Boolean type
  R.mapObjIndexed(val =>
    R.ifElse(
      v => v === 'true' || v === 'false',
      R.always(val === 'true'),
      R.identity
    )(val)
  )
)({})

export const getJsonParam = (req: express.Request, param: string, defaultValue = null) => {
  const jsonStr = R.prop(param, getParams(req))
  return jsonStr
    ? JSON.parse(jsonStr)
    : defaultValue
}

export const getFile: (x: any) => any | null = R.pathOr(null, ['files', 'file'])

export const getBody: (x: any) => any | null = R.propOr(null, 'body')

// User
export const getUser: (x: any) => IUser = R.prop('user')
export const getUserUuid: (x: any) => string = R.pipe(getUser, R.prop('uuid'))
export const getSurveyCycleKey: (x: any) => string = R.pipe(getUser, User.getPrefSurveyCurrentCycle)

// i18n

export const getI18n = R.prop('i18n')

// Cookies

export const getCookie = name => R.path(['cookies', name])

export const getSocketId = getCookie('io')

export default {
  getServerUrl,
  getParams,
  getJsonParam,
  getFile,
  getBody,

  // User
  getUserUuid,
  getUser,
  getSurveyCycleKey,

  // i18n
  getI18n,

  // Cookies
  getSocketId
};
