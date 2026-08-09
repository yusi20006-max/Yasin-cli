class OutputFormatter {
  static json(value) {
    return JSON.stringify(value, null, 2);
  }

  static text(value) {
    if (typeof value === 'string') return value;
    if (value === undefined) return '';
    if (value === null) return 'null';
    return JSON.stringify(value, null, 2);
  }

  static format(value, options = {}) {
    return options.json ? OutputFormatter.json(value) : OutputFormatter.text(value);
  }
}

module.exports = OutputFormatter;
