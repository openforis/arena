const db = require('../db/db')
const {nodeDefType} = require('../../common/survey/nodeDef')
const {uuidv4} = require('../../common/uuid')

const defaultSurveyDef = () => ({
  1: {
    id: 1,
    uuid: uuidv4(),
    name: 'root_entity',
    type: nodeDefType.entity,
    labels: {
      en: 'Root entity'
    },

  }
})

const getSurvey = async (surveyId, client = db) => await client.one(`SELECT * FROM survey WHERE id = $1`, [surveyId])

const createSurvey = async (ownerId, props) => db.tx(
  async t => {
    const surveyId = await t.one(`
      INSERT INTO survey (owner_id, props)
      VALUES ($1, $2)
      RETURNING id
    `, [ownerId, props])

    const surveyVersionId = await t.one(`
      INSERT INTO survey_version (survey_id, survey_def)
      VALUES ($1, $2)
      RETURNING id
    `, [surveyId, defaultSurveyDef()])

    await t.any(`UPDATE survey SET draft_version_id = $1`, [surveyVersionId])

    return await getSurvey(surveyId, t)
  }
)

module.exports = {
  getSurvey,
  createSurvey,
}
