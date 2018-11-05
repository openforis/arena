const express = require('express')

const router = express.Router()

//init apis
require('../mockApi/surveyDashboardApi').init(router)

require('../user/userApi').init(router)

require('../survey/surveyApi').init(router)
require('../nodeDef/nodeDefApi').init(router)
require('../codeList/codeListApi').init(router)
require('../taxonomy/taxonomyApi').init(router)
require('../srs/srsApi').init(router)

require('../job/jobApi').init(router)

require('../record/recordApi').init(router)

module.exports = {
  router
}