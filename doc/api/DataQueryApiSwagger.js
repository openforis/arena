/**
 * @swagger
 * tags:
 *   name: DataTable
 *   description: The data table management API
 * /surveyRdb/{surveyId}/{tableNodeDefUuid}/query:
 *   post:
 *     summary: Query survey data table
 *     tags: []
 *     requestBody:
 *       required: true
 *       parameters:
 *         - in: path
 *           name: surveyId
 *           schema:
 *             type: number
 *           required: true
 *           description: The survey id
 *         - in: path
 *           name: tableNodeDefUuid
 *           schema:
 *             type: string
 *             format: uuid
 *           required: true
 *           description: The node definition UUID associated to the data table
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DataQueryParameters'
 *     responses:
 *       200:
 *         description: The result items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: object
 */
