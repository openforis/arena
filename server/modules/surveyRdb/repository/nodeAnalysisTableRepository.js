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
      uuid                  uuid      NOT NULL,
      processing_step_uuid  uuid      NOT NULL,
      record_uuid           uuid      NOT NULL,
      parent_uuid           uuid          NULL,
      node_def_uuid         uuid      NOT NULL,
      value                 jsonb     NOT NULL,

      PRIMARY KEY (uuid),
      CONSTRAINT node_analysis_node_fk FOREIGN KEY (uuid)
        REFERENCES ${schemaSurvey}.node ("uuid") ON DELETE CASCADE,
      CONSTRAINT node_analysis_step_fk FOREIGN KEY (processing_step_uuid)
        REFERENCES ${schemaSurvey}.processing_step ("uuid") ON DELETE CASCADE,
      CONSTRAINT node_analysis_record_fk FOREIGN KEY (record_uuid)
        REFERENCES ${schemaSurvey}.record ("uuid") ON DELETE CASCADE,
      CONSTRAINT node_analysis_parent_fk FOREIGN KEY (parent_uuid)
        REFERENCES ${schemaSurvey}.node ("uuid") ON DELETE CASCADE,
      CONSTRAINT node_analysis_node_def_fk FOREIGN KEY (node_def_uuid)
        REFERENCES ${schemaSurvey}.node_def ("uuid") ON DELETE CASCADE
    )
  `)
}
