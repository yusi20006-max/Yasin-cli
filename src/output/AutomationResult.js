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
    return {
      ok: false,
      code,
      error: {
        message,
        ...(data === null ? {} : { data })
      },
      ...meta
    };
  }
}

module.exports = AutomationResult;
