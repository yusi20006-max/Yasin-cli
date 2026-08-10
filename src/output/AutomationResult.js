const ErrorTaxonomy = require('./ErrorTaxonomy');

class AutomationResult {
  static success(data = null, meta = {}) {
    return {
      ok: true,
      code: 0,
      data,
      ...meta
    };
  }

  static failure(code, message, data = null, meta = {}) {
    const normalized = ErrorTaxonomy.normalize({ code, message });
    return {
      ok: false,
      code: normalized.code,
      error: {
        type: normalized.type,
        message: normalized.message,
        ...(data === null ? {} : { data })
      },
      ...meta
    };
  }
}

module.exports = AutomationResult;
