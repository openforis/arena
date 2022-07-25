import { Router as expressRouter } from 'express'

import * as userApi from '@server/modules/user/api/userApi'
import * as activityLogApi from '@server/modules/activityLog/api/activityLogApi'
import * as surveyApi from '@server/modules/survey/api/surveyApi'
import * as nodeDefApi from '@server/modules/nodeDef/api'
import * as categoryApi from '@server/modules/category/api/categoryApi'
import * as taxonomyApi from '@server/modules/taxonomy/api/taxonomyApi'
import * as geoApi from '@server/modules/geo/api/geoApi'
import * as collectImportApi from '@server/modules/collectImport/api/collectImportApi'
import * as arenaImportApi from '@server/modules/arenaImport/api/arenaImportApi'
import * as recordApi from '@server/modules/record/api/recordApi'
import * as surveyRdbApi from '@server/modules/surveyRdb/api/surveyRdbApi'
import * as reportingApi from '@server/modules/reporting/api'
import * as analysisApi from '@server/modules/analysis/api'
import * as jobApi from '@server/job/jobApi'
import * as expressionApi from '@server/modules/expression/api/expressionApi'
import * as rstudioApi from '@server/modules/rstudio/api/rstudioApi'
import * as mobileApi from '@server/modules/mobile/api/mobileApi'

export const router = expressRouter()

// Init apis
userApi.init(router)

activityLogApi.init(router)

surveyApi.init(router)
nodeDefApi.init(router)
categoryApi.init(router)
taxonomyApi.init(router)
geoApi.init(router)

collectImportApi.init(router)
arenaImportApi.init(router)

recordApi.init(router)

surveyRdbApi.init(router)
reportingApi.init(router)

analysisApi.init(router)

jobApi.init(router)

expressionApi.init(router)

rstudioApi.init(router)
mobileApi.init(router)
