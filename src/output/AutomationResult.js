const ErrorTaxonomy = require('./ErrorTaxonomy');

class AutomationResult {
  static success(data = null, meta = {}) {
    return {
      ...meta,
      ok: true,
      code: 0,
      data
    };
  }

  static failure(code, message, data = null, meta = {}) {
    const normalized = ErrorTaxonomy.normalize({ code, message });
    const { error: errorMeta = {}, ...resultMeta } = meta;
    return {
      ...resultMeta,
      ok: false,
      code: normalized.code,
      data,
      error: {
        ...errorMeta,
        type: normalized.type,
        message: normalized.message
      }
    };
  }
}

module.exports = AutomationResult;
