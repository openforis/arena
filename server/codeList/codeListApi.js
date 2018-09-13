const {sendErr} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {insertCodeList, fetchCodeListsBySurveyId} = require('./codeListRepository')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:id/codeLists', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const {body} = req

      const codeList = await insertCodeList(surveyId, body)

      res.json({codeList})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  // fetch code lists
  app.get('/survey/:id/codeLists', async (req, res) => {
    try {

      const draft = getRestParam(req, 'draft') === 'true'
      const surveyId = getRestParam(req, 'id')

      //const codeLists = await fetchCodeListsBySurveyId(surveyId, draft)

      const codeLists = [
        {
          id: 1,
          uuid: '122132',
          props: {
            name: 'list1',
            labels: {
              en: 'Code List 1'
            }
          }
        },
        {
          id: 2,
          uuid: '122133',
          props: {
            name: 'list2',
            labels: {
              en: 'Code List2 '
            }
          }
        },
      ]
      res.json({codeLists})
    } catch (err) {
      sendErr(res, err)
    }
  })
}
