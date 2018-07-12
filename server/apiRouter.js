const express = require('express')

const router = express.Router()

//init apis
require('./mockApi/surveyDashboard').init(router)

module.exports = {
  router
}