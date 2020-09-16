const { API_SERVICE_URL, ROUTE_TO_REPLACE} = require("../config");

const customRouter = (req) => {
  const instanceId = req.instanceId;
  const instance = req.instance;
  let route = API_SERVICE_URL;
  if (instanceId && instance) {
    const instanceUrl = JSON.parse(instance).url;
    route = ROUTE_TO_REPLACE.replace("REPLACE_ME", instanceUrl);
  }

  return route;
};

const rewriteFn = (path, req) => {
  const instanceId = req.instanceId;
  return (path || "").replace(instanceId, "");
};

const config = {
  target: API_SERVICE_URL,
  router: customRouter,
  changeOrigin: true,
  pathRewrite: rewriteFn,
};

module.exports = {
  config,
};
