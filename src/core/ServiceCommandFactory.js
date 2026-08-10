const ServiceOperation = require('./ServiceOperation');

class ServiceCommandFactory {
  constructor(resolver) {
    this.operation = new ServiceOperation(resolver);
  }

  execute(operation, args = [], options = {}) {
    const service = args[0] || 'all';
    return this.operation.execute(operation, service, args.slice(1), options);
  }
}

module.exports = ServiceCommandFactory;
