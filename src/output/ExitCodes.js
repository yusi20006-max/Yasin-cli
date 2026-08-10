const ExitCodes = Object.freeze({
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_COMMAND: 2,
  SERVICE_UNAVAILABLE: 3,
  CONFIGURATION_ERROR: 4,
  DEPENDENCY_ERROR: 5
});

module.exports = ExitCodes;
