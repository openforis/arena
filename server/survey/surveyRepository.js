const db = require('../db/db')

const {nodeDefType} = require('../../common/survey/nodeDef')

const createSurvey = async (ownerId, props) => db.tx(
  async t => {
    const surveyId = await t.one(`
      INSERT INTO survey (owner_id, props)
      VALUES ($1, $2)
      RETURNING id
    `, [ownerId, props])

    const surveyVersionId = await t.one(`
      INSERT INTO survey_version (survey_id)
      VALUES ($1)
      RETURNING id
    `, [surveyId])

    const rootDefId = await t.one(`
      INSERT INTO node_def (survey_version_id, type, props)
      VALUES ($1, $2)
      RETURNING id
    `, [surveyVersionId, nodeDefType.entity, {name: 'root_entity'}])

    await t.any(`UPDATE survey SET draft_version_id = $1`, [surveyVersionId])
    await t.any(`UPDATE survey_version SET root_def_id = $1`, [rootDefId])

    return await t.one(`SELECT * FROM survey WHERE id = $1`, [surveyId])
  }
)

module.exports = {
  createSurvey
}
