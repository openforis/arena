/**
 * @swagger
 * tags:
 *   name: DataTable
 *   description: The data table management API
 * /api/surveyRdb/{surveyId}/{tableNodeDefUuid}/query:
 *   post:
 *     summary: Query survey data table
 *     tags: []
 *     parameters:
 *       - name: surveyId
 *         description: The survey ID
 *         in: path
 *         schema:
 *           type: number
 *         required: true
 *       - name: tableNodeDefUuid
 *         description: The node definition UUID associated to the data table
 *         in: path
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
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
 *               items:
 *                 type: object
 *                 description: result item structure depends on the selected attributes or dimensions; it will be like a dictionary.
 */
