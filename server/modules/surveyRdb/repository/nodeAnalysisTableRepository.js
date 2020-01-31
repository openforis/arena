import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeAnalysisTable from '@common/surveyRdb/nodeAnalysisTable'
import * as SurveySchemaRepositoryUtils from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

export const createNodeAnalysisTable = async (surveyId, client) => {
  const schemaRdb = SchemaRdb.getName(surveyId)
  const schemaSurvey = SurveySchemaRepositoryUtils.getSurveyDBSchema(surveyId)

  await client.query(`
    CREATE TABLE
      ${schemaRdb}.${NodeAnalysisTable.tableName}
    (
      uuid                                                  uuid      NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${NodeAnalysisTable.colNames.processingChainUuid}     uuid      NOT NULL REFERENCES ${schemaSurvey}.processing_chain ("uuid") ON DELETE CASCADE,
      processing_step_uuid                                  uuid      NOT NULL REFERENCES ${schemaSurvey}.processing_step ("uuid") ON DELETE CASCADE,
      record_uuid                                           uuid      NOT NULL REFERENCES ${schemaSurvey}.record ("uuid") ON DELETE CASCADE,
      ${NodeAnalysisTable.colNames.parentUuid}              uuid          NULL REFERENCES ${schemaSurvey}.node ("uuid") ON DELETE CASCADE,
      node_def_uuid                                         uuid      NOT NULL REFERENCES ${schemaSurvey}.node_def ("uuid") ON DELETE CASCADE,
      value                                                 jsonb         NULL
    )
  `)
}
