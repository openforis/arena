const express = require('express')

const router = express.Router()

//init apis

require('@server/modules/user/api/userApi').init(router)

require('@server/modules/activityLog/api/activityLogApi').init(router)

require('@server/modules/survey/api/surveyApi').init(router)
require('@server/modules/nodeDef/api/nodeDefApi').init(router)
require('@server/modules/category/api/categoryApi').init(router)
require('@server/modules/taxonomy/api/taxonomyApi').init(router)
require('@server/modules/geo/api/geoApi').init(router)

require('@server/modules/collectImport/api/collectImportApi').init(router)

require('@server/modules/record/api/recordApi').init(router)

require('@server/modules/surveyRdb/api/surveyRdbApi').init(router)

require('@server/modules/analysis/api/processingChainApi').init(router)
require('@server/job/jobApi').init(router)

require('@server/modules/expression/api/expressionApi').init(router)

module.exports = {
  router
}