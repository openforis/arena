const { redis } = require("../infrastructure");

const getInstanceIdByReferer = ({ instances, referer }) =>
  instances.find((instanceKey) => {
    const regex = new RegExp(`${instanceKey}$`);
    return regex.test(referer);
  });

const getInstanceMiddleware = async (req, res, next) => {
  const instances = await redis.keys();
  let instanceId = false;

  if (instances.includes(req.originalUrl)) {
    instanceId = req.originalUrl;
  }
  const instanceIdOnReferer = req.headers.referer
    ? getInstanceIdByReferer({
        instances,
        referer: req.headers.referer || "",
      })
    : false;
  if (instanceIdOnReferer) {
    instanceId = instanceIdOnReferer;
  }

  let instance = false;

  if (instanceId) {
    instance = await redis.get(instanceId);
  }

  if (instanceId && instance) {
    req.instance = instance;
    req.instanceId = instanceId;
  }
  next();
};

module.exports = {
  getInstanceMiddleware
};
