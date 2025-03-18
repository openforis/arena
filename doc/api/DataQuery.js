/**
 * @swagger
 * components:
 *   schemas:
 *     DataQuery:
 *       type: object
 *       required:
 *         - mode
 *         - entityDefUuid
 *       properties:
 *         mode:
 *           type: string
 *           description: It can be "raw" or "aggregate"
 *         displayType:
 *           type: string
 *           description: only "table" is supported now
 *         filter:
 *           type: string
 *           description: javascript expression to filter data
 *         sort:
 *           type: array
 *         attributeDefUuids:
 *           type: array
 *         dimensions:
 *           type: array
 *         measures:
 *           type: object
 *         filterRecordUuid:
 *           type: string
 *           format: uuid
 *         filterRecordUuids:
 *           type: array
 *       example:
 *         mode: raw
 *         entityDefUuid:
 *     DataQueryParameters:
 *       type: object
 *       properties:
 *         cycle:
 *           type: number
 *         query:
 *           type:
 *             $ref: '#/components/schemas/DataQuery'
 *         offset:
 *           type: number
 *         limit:
 *           type: number
 */
