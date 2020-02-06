import * as UserAnalysis from '@common/analysis/userAnalysis'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'
import * as SurveySchemaRepositoryUtils from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ===== CREATE
export const createResultNodeTable = async (surveyId, client) => {
  const schemaRdb = SchemaRdb.getName(surveyId)
  const schemaSurvey = SurveySchemaRepositoryUtils.getSurveyDBSchema(surveyId)

  await client.query(`
    CREATE TABLE
      ${schemaRdb}.${ResultNodeTable.tableName}
    (
      uuid                                                uuid      NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${ResultNodeTable.colNames.processingChainUuid}     uuid      NOT NULL REFERENCES ${schemaSurvey}.processing_chain ("uuid") ON DELETE CASCADE,
      ${ResultNodeTable.colNames.processingStepUuid}      uuid      NOT NULL REFERENCES ${schemaSurvey}.processing_step ("uuid") ON DELETE CASCADE,
      record_uuid                                         uuid      NOT NULL REFERENCES ${schemaSurvey}.record ("uuid") ON DELETE CASCADE,
      ${ResultNodeTable.colNames.parentUuid}              uuid          NULL REFERENCES ${schemaSurvey}.node ("uuid") ON DELETE CASCADE,
      ${ResultNodeTable.colNames.nodeDefUuid}             uuid      NOT NULL REFERENCES ${schemaSurvey}.node_def ("uuid") ON DELETE CASCADE,
      ${ResultNodeTable.colNames.value}                   jsonb         NULL
    )
  `)
}

// ===== GRANT PRIVILEGES
export const grantWriteToUserAnalysis = async (surveyId, client) =>
  await client.query(`
    GRANT SELECT, INSERT, UPDATE, DELETE 
    ON ${SchemaRdb.getName(surveyId)}.${ResultNodeTable.tableName}
    TO "${UserAnalysis.getName(surveyId)}"
  `)
