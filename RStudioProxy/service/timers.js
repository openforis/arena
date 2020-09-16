const { redis } = require("../infrastructure");

var timeoutsMap = {};
var areTimersInitialized = false;

const setTimer = async ({ instanceId }) =>
  new Promise((resolve) => {
    clearTimeout(timeoutsMap[instanceId]);

    const timer = setTimeout(async () => {
      console.log("KILL_TIMER", instanceId);
    }, 10000);

    timeoutsMap[instanceId] = timer;
    resolve();
  });

const initTimers = async () => {
  const instances = await redis.keys();
  console.log("INSTANCES", instances);
  return Promise.all(
    (instances || []).map(async (instance) => {
      console.log("NEW_TIMER", instanceId, Object.keys(timeoutsMap).length);
      return setTimer({ instanceId: instance });
    })
  );
};

const timeoutMiddleware = async (req, res, next) => {
  instanceId = req.instanceId;

  if (!areTimersInitialized) {
    console.log("INIT TIMERS");
    await initTimers();
    areTimersInitialized = true;
  }

  if (instanceId) {
    await setTimer({ instanceId });
  }

  next();
};

const timmersMiddleware = (req, res, next) => {
  console.log(
    "TIMMERS",
    Object.keys(timeoutsMap),
    "initialized:",
    areTimersInitialized
  );
  next();
};

module.exports = {
  timeoutMiddleware,
  timmersMiddleware,
};
