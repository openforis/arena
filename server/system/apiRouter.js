const express = require('express')

const router = express.Router()

//init apis

require('../modules/user/api/userApi').init(router)

require('../modules/survey/api/surveyApi').init(router)
require('../modules/nodeDef/api/nodeDefApi').init(router)
require('../modules/category/api/categoryApi').init(router)
require('../modules/taxonomy/api/taxonomyApi').init(router)
require('../modules/srs/api/srsApi').init(router)
require('../modules/collectImport/api/collectImportApi').init(router)

require('../modules/record/api/recordApi').init(router)

require('../modules/surveyRdb/api/surveyRdbApi').init(router)

require('../job/jobApi').init(router)

require('../modules/expression/api/expressionApi').init(router)

module.exports = {
  router
}