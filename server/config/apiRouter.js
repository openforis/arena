const express = require('express')

const router = express.Router()

//init apis
require('../mockApi/surveyDashboardApi').init(router)
require('../survey/surveyApi').init(router)
require('../nodeDef/nodeDefApi').init(router)

module.exports = {
  router
}