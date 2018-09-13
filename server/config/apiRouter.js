const express = require('express')

const router = express.Router()

//init apis
require('../mockApi/surveyDashboardApi').init(router)
require('../codeList/codeListApi').init(router)
require('../nodeDef/nodeDefApi').init(router)
require('../record/recordApi').init(router)
require('../survey/surveyApi').init(router)

module.exports = {
  router
}