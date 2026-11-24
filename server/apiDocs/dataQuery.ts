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
 *           required: true
 *         displayType:
 *           type: string
 *           default: "table"
 *           description: only "table" is supported now
 *         filter:
 *           type: string
 *           description: javascript expression to filter data. E.g. variable_name = "some_value"
 *         sort:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               variable:
 *                 type: string
 *                 required: true
 *                 description: attribute name to sort by
 *               order:
 *                 type: string
 *                 default: "asc"
 *                 description: sort order (asc=ascending or desc=descending)
 *         attributeDefUuids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           required: true
 *           description: list of attribute definition UUIDs to select
 *         dimensions:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: list of attribute definition UUIDs used as dimensions (required only if mode is "aggregate")
 *         measures:
 *           type: object
 *           description: dictionary of measures indexed by attribute definition UUID
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: string
 *               description: aggregate function name (e.g. sum, min, max, avg)
 *         filterRecordUuid:
 *           type: string
 *           format: uuid
 *         filterRecordUuids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *       example:
 *         mode: raw
 *         entityDefUuid: e19673e6-4cf2-4317-ac08-3d960d99d3d9
 *
 *     DataQueryParameters:
 *       type: object
 *       properties:
 *         cycle:
 *           type: string
 *           default: "0"
 *         query:
 *           $ref: '#/components/schemas/DataQuery'
 *         offset:
 *           type: number
 *           default: 0
 *         limit:
 *           type: number
 *           default: 100
 */
