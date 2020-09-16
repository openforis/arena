const { redis } = require("./infrastructure");

const prepareInstancesMiddleware = async (req, res, next) => {
  const INSTANCES_TO_INIT = {
    "/aaaa": "ec2-18-157-180-23.eu-central-1.compute.amazonaws.com",
    "/bbbb": "ec2-18-192-54-169.eu-central-1.compute.amazonaws.com",
  };
  await redis.flushAll();
  await Promise.all(
    Object.keys(INSTANCES_TO_INIT).map(async (instanceId) =>
      redis.set(
        instanceId,
        JSON.stringify({ instanceId, url: INSTANCES_TO_INIT[instanceId] })
      )
    )
  );
  const n = await redis.keys("");
  console.log("INIT ---> instancesIds ", n);

  next();
};

module.exports = {
  prepareInstancesMiddleware,
};
