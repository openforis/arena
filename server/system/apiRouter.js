import * as express from 'express'

import * as userApi from '@server/modules/user/api/userApi'
import * as activityLogApi from '@server/modules/activityLog/api/activityLogApi'
import * as surveyApi from '@server/modules/survey/api/surveyApi'
import * as nodeDefApi from '@server/modules/nodeDef/api/nodeDefApi'
import * as categoryApi from '@server/modules/category/api/categoryApi'
import * as taxonomyApi from '@server/modules/taxonomy/api/taxonomyApi'
import * as geoApi from '@server/modules/geo/api/geoApi'
import * as collectImportApi from '@server/modules/collectImport/api/collectImportApi'
import * as recordApi from '@server/modules/record/api/recordApi'
import * as surveyRdbApi from '@server/modules/surveyRdb/api/surveyRdbApi'
import * as processingChainApi from '@server/modules/analysis/api/processingChainApi'
import * as jobApi from '@server/job/jobApi'
import * as expressionApi from '@server/modules/expression/api/expressionApi'

export const router = express.Router()

//init apis
userApi.init(router)

activityLogApi.init(router)

surveyApi.init(router)
nodeDefApi.init(router)
categoryApi.init(router)
taxonomyApi.init(router)
geoApi.init(router)

collectImportApi.init(router)

recordApi.init(router)

surveyRdbApi.init(router)

processingChainApi.init(router)
jobApi.init(router)

expressionApi.init(router)
