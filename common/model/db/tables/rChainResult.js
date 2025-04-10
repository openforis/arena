import * as R from 'ramda'

// Table name
export const tableName = 'r_chain_result'

// Columns
export const columns = {
  id: 'id',
  surveyId: 'survey_id',
  chainUuid: 'chain_uuid',
  cycle: 'cycle',
  entityDefUuid: 'entity_def_uuid',
  fileName: 'file_name',
  filePath: 'file_path',
  fileSize: 'file_size',
  dateCreated: 'date_created',
  dateModified: 'date_modified',
}

// Create table
export const createTable = `
CREATE TABLE ${tableName} (
  ${columns.id} bigserial NOT NULL,
  ${columns.surveyId} bigint NOT NULL,
  ${columns.chainUuid} uuid NOT NULL,
  ${columns.cycle} varchar(255) NOT NULL,
  ${columns.entityDefUuid} uuid NOT NULL,
  ${columns.fileName} varchar(255) NOT NULL,
  ${columns.filePath} varchar(1000) NOT NULL,
  ${columns.fileSize} bigint,
  ${columns.dateCreated} timestamp without time zone NOT NULL,
  ${columns.dateModified} timestamp without time zone NOT NULL,
  PRIMARY KEY (${columns.id})
);

CREATE INDEX ${tableName}_survey_id_idx ON ${tableName} (${columns.surveyId});
CREATE INDEX ${tableName}_chain_uuid_idx ON ${tableName} (${columns.chainUuid});
CREATE INDEX ${tableName}_entity_def_uuid_idx ON ${tableName} (${columns.entityDefUuid});
`

// Drop table
export const dropTable = `DROP TABLE IF EXISTS ${tableName}`

// CRUD operations
export const create = ({
  surveyId,
  chainUuid,
  cycle,
  entityDefUuid,
  fileName,
  filePath,
  fileSize,
  dateCreated = new Date(),
  dateModified = new Date(),
}) => ({
  [columns.surveyId]: surveyId,
  [columns.chainUuid]: chainUuid,
  [columns.cycle]: cycle,
  [columns.entityDefUuid]: entityDefUuid,
  [columns.fileName]: fileName,
  [columns.filePath]: filePath,
  [columns.fileSize]: fileSize,
  [columns.dateCreated]: dateCreated,
  [columns.dateModified]: dateModified,
})

// Accessors
export const getId = R.prop(columns.id)
export const getSurveyId = R.prop(columns.surveyId)
export const getChainUuid = R.prop(columns.chainUuid)
export const getCycle = R.prop(columns.cycle)
export const getEntityDefUuid = R.prop(columns.entityDefUuid)
export const getFileName = R.prop(columns.fileName)
export const getFilePath = R.prop(columns.filePath)
export const getFileSize = R.prop(columns.fileSize)
export const getDateCreated = R.prop(columns.dateCreated)
export const getDateModified = R.prop(columns.dateModified)
