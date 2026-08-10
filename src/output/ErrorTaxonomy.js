const ExitCodes = require('./ExitCodes');

const ErrorTypes = Object.freeze({
  GENERAL: 'GENERAL_ERROR',
  INVALID_COMMAND: 'INVALID_COMMAND',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CONFIGURATION: 'CONFIGURATION_ERROR',
  DEPENDENCY: 'DEPENDENCY_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  ADAPTER: 'ADAPTER_ERROR',
  RUNTIME: 'RUNTIME_ERROR'
});

const TYPE_TO_CODE = Object.freeze({
  [ErrorTypes.GENERAL]: ExitCodes.GENERAL_ERROR,
  [ErrorTypes.INVALID_COMMAND]: ExitCodes.INVALID_COMMAND,
  [ErrorTypes.SERVICE_UNAVAILABLE]: ExitCodes.SERVICE_UNAVAILABLE,
  [ErrorTypes.CONFIGURATION]: ExitCodes.CONFIGURATION_ERROR,
  [ErrorTypes.DEPENDENCY]: ExitCodes.DEPENDENCY_ERROR,
  [ErrorTypes.VALIDATION]: ExitCodes.GENERAL_ERROR,
  [ErrorTypes.ADAPTER]: ExitCodes.GENERAL_ERROR,
  [ErrorTypes.RUNTIME]: ExitCodes.GENERAL_ERROR
});

const CODE_TO_TYPE = Object.freeze(
  Object.fromEntries(Object.entries(TYPE_TO_CODE).map(([type, code]) => [code, type]))
);

function classify(error, fallbackType = ErrorTypes.GENERAL) {
  if (!error) return fallbackType;
  if (error.type && Object.values(ErrorTypes).includes(error.type)) return error.type;

  if (typeof error.code === 'string' && Object.values(ErrorTypes).includes(error.code)) return error.code;
  if (Object.prototype.hasOwnProperty.call(CODE_TO_TYPE, error.code)) return CODE_TO_TYPE[error.code];

  if (error.code === 'CONFIGURATION_ERROR') return ErrorTypes.CONFIGURATION;
  if (error.code === 'ENOENT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return ErrorTypes.SERVICE_UNAVAILABLE;
  }
  if (error.name === 'ValidationError') return ErrorTypes.VALIDATION;
  if (error.name === 'ConfigurationError') return ErrorTypes.CONFIGURATION;
  if (error.name === 'DependencyError') return ErrorTypes.DEPENDENCY;
  if (error.name === 'AdapterError') return ErrorTypes.ADAPTER;
  return fallbackType;
}

function normalize(error, fallbackType = ErrorTypes.GENERAL) {
  const type = classify(error, fallbackType);
  return {
    type,
    code: TYPE_TO_CODE[type] ?? ExitCodes.GENERAL_ERROR,
    message: error?.message || String(error || 'Unknown error')
  };
}

module.exports = { ErrorTypes, TYPE_TO_CODE, classify, normalize };
