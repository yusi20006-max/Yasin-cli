const ExitCodes = require('./ExitCodes');

function classifyError(error) {
  if (!error) return ExitCodes.SUCCESS;
  if (error.code === 'INVALID_COMMAND') return ExitCodes.INVALID_COMMAND;
  if (error.code === 'SERVICE_UNAVAILABLE') return ExitCodes.SERVICE_UNAVAILABLE;
  if (error.code === 'CONFIGURATION_ERROR') return ExitCodes.CONFIGURATION_ERROR;
  if (error.code === 'DEPENDENCY_ERROR') return ExitCodes.DEPENDENCY_ERROR;
  return ExitCodes.GENERAL_ERROR;
}

module.exports = { classifyError };
