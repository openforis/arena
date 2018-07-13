const {restParam} = require('../request')

const {surveyStatus} = require('../../common/survey/survey')
const {userRoles} = require('../../common/user/userRole')

const getPath = path =>
  `/appModules${path}/dashboard/:surveyId`

const surveyIdRestParam = restParam('surveyId')

const init = app => {

  //survey section
  app.get(getPath('/survey'), (req, res) => {
    const survey = {
      dashboard: {
        surveyId: surveyIdRestParam(req),
        name: '',
        // name: 'Italian NFI 2020',

        countryIso: 'ITA',
        ownerId: 1,
        addedTime: new Date().toISOString(),
        // status: surveyStatus.draft,
        status: surveyStatus.new,
        version: {
          id: 1,
          addedTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
        },
        draftVersion: {
          id: 2,
          addedTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
        }
      }
    }
    res.json({survey})
  })

  //Survey Designer
  app.get(getPath('/surveyDesigner'), (req, res) => {
    const surveyDesigner = {
      dashboard: {
        surveyId: surveyIdRestParam(req),

        entityDefns: {count: 0},
        attributeDefns: {count: 0},
        pages: {count: 0},
        // entityDefns: {count: 5},
        // attributeDefns: {count: 20},
        // pages: {count: 2},
      }
    }
    res.json({surveyDesigner})
  })

  //Data Explorer
  app.get(getPath('/dataExplorer'), (req, res) => {
    const dataExplorer = {
      dashboard: {
        surveyId: surveyIdRestParam(req),
        entities: {},
        // entities: {
        //   tree: {count: 1236},
        //   deadWood: {count: 589},
        //   plot: {count: 90},
        //   cluster: {count: 11},
        // },
      }
    }
    res.json({dataExplorer})
  })

  //Data Analysis
  app.get(getPath('/dataAnalysis'), (req, res) => {
    const dataAnalysis = {
      dashboard: {
        surveyId: surveyIdRestParam(req),
        samplingDesign: null,
        entities: {count: 0},
        // attributes: {count: 0},
        outputAttributes: {count: 0},
      }
    }
    res.json({dataAnalysis})
  })

  //Users
  app.get(getPath('/users'), (req, res) => {
    const roles = {

      [userRoles.administrator.role]: {count: 0},
      [userRoles.surveyManager.role]: {count: 0},
      [userRoles.dataAnalysis.role]: {count: 0},
      [userRoles.dataEntry.role]: {count: 0},
      // [userRoles.dataEntry.role]: {count: 9},
      // [userRoles.dataAnalysis.role]: {count: 2},
      // [userRoles.surveyManager.role]: {count: 1},
      // [userRoles.administrator.role]: {count: 1},
    }
    const users = {
      dashboard: {
        surveyId: surveyIdRestParam(req),
        ...roles
      }
    }
    res.json({users})
  })

}

module.exports = {
  init
}