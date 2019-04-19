import * as R from 'ramda'
import { appModules } from '../../../appModules'

const records = 'records'

export const getRecordsList = R.pathOr([], [appModules.data, records, 'list'])

export const getRecordsNodeDefKeys = R.pathOr([], [appModules.data, records, 'nodeDefKeys'])

export const getRecordsCount = R.path([appModules.data, records, 'count'])

export const getRecordsLimit = R.path([appModules.data, records, 'limit'])

export const getRecordsOffset = R.path([appModules.data, records, 'offset'])