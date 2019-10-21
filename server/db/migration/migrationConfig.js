import ProcessUtils from '../../../core/processUtils';

export default {

  development: {
    driver: 'pg',
    user: ProcessUtils.ENV.pgUser,
    password: ProcessUtils.ENV.pgPassword,
    host: ProcessUtils.ENV.pgHost,
    database: ProcessUtils.ENV.pgDatabase,
    schema: ProcessUtils.ENV.pgSchema,
  },

  production: {
    ssl: true,
  }

};
