import * as fs from 'fs'
import * as R from 'ramda'

import { SRSs } from '@openforis/arena-core'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import Job from '@server/job/job'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'

import BatchPersister from '@server/db/batchPersister'
import * as CategoryManager from '../manager/categoryManager'

export default class CategoriesExportJob extends Job {
  constructor(params, type = CategoriesExportJob.type) {
    super(type, params)
  }

  async execute() {}
}

CategoriesExportJob.type = 'CategoriesExportJob'
