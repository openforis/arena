const express = require('express')

const router = express.Router()

//init apis

require('../user/userApi').init(router)

require('../survey/surveyApi').init(router)
require('../nodeDef/nodeDefApi').init(router)
require('../modules/category/api/categoryApi').init(router)
require('../modules/taxonomy/api/taxonomyApi').init(router)
require('../srs/srsApi').init(router)

require('../modules/record/api/recordApi').init(router)

require('../surveyRdb/surveyRdbApi').init(router)

require('../job/jobApi').init(router)

require('../expression/expressionApi').init(router)

module.exports = {
  router
}