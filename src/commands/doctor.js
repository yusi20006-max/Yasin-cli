const Command = require('../core/Command');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const AutomationResult = require('../output/AutomationResult');
const ExitCodes = require('../output/ExitCodes');

class DoctorCommand extends Command {
  constructor(configManager) {
    super({
      name: 'doctor',
      description: 'Run diagnostic health checks on the environment',
      supportsJson: true,
      options: [
        { name: '--fix', alias: '-f', type: 'boolean', description: 'Automatically fix repairable issues' }
      ]
    });
    this.configManager = configManager;
  }

  collectResults() {
    const results = [];
    const nodeVer = process.version;
    const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
    results.push(major >= 18
      ? { name: 'Node.js Version', status: 'pass', msg: `${nodeVer} (Compatible)` }
      : { name: 'Node.js Version', status: 'fail', msg: `${nodeVer} (Legacy, recommended >= v18.x)` });

    const platform = process.platform;
    const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
    const osName = isTermux ? 'termux' : platform;
    results.push({ name: 'OS Platform', status: 'pass', msg: `${osName} (${os.release()} ${os.arch()})` });

    const configDir = this.configManager.configDir;
    try {
      this.configManager.ensureDirectoryExists();
      fs.accessSync(configDir, fs.constants.R_OK | fs.constants.W_OK);
      results.push({ name: 'Config Directory', status: 'pass', msg: `${configDir} (Writable)` });
    } catch (e) {
      results.push({ name: 'Config Directory', status: 'fail', msg: `${configDir} (Read/Write access denied)` });
    }

    const pluginDir = path.join(configDir, 'plugins');
    if (!fs.existsSync(pluginDir)) {
      results.push({ name: 'Plugin Directory', status: 'fail', msg: `${pluginDir} (Directory does not exist)`, fixable: true, fixType: 'create_plugin_dir' });
    } else {
      try {
        fs.accessSync(pluginDir, fs.constants.R_OK | fs.constants.W_OK);
        results.push({ name: 'Plugin Directory', status: 'pass', msg: `${pluginDir} (Writable)` });
      } catch (e) {
        results.push({ name: 'Plugin Directory', status: 'fail', msg: `${pluginDir} (Read/Write access denied)` });
      }
    }

    try {
      const gitVer = child_process.execSync('git --version', { stdio: 'pipe' }).toString().trim();
      results.push({ name: 'Git Dependency', status: 'pass', msg: gitVer });
    } catch (e) {
      results.push({ name: 'Git Dependency', status: 'fail', msg: 'git is not installed or not in PATH' });
    }

    return results;
  }

  renderHuman(result, options = {}) {
    if (options.json) return;
    const data = result.data || {};
    console.log('Running Yasin CLI Diagnostics...');
    (data.results || []).forEach(item => {
      console.log(`${item.name}: ${item.msg}`);
    });
    if (Array.isArray(data.repairActions) && data.repairActions.length > 0) {
      console.log('Attempting auto-healing...');
      data.repairActions.forEach(action => {
        if (action.status === 'fixed' && action.action === 'create_plugin_dir') {
          console.log(`Created plugin directory: ${action.path}`);
        }
      });
    }
    if (result.ok) {
      if (Array.isArray(data.repairActions) && data.repairActions.length > 0) {
        console.log('Status: All repairable issues fixed!');
      } else {
        console.log('Status: All checks passed.');
      }
    } else {
      console.log(`Status: ${data.issues || 0} issue(s) found.`);
    }
  }

  execute(args, options = {}) {
    let results = this.collectResults();
    let issuesCount = results.filter(res => res.status === 'fail').length;
    const repairActions = [];

    if (options.fix) {
      results.forEach(res => {
        if (res.status !== 'fail' || !res.fixable || res.fixType !== 'create_plugin_dir') return;
        const pluginDir = path.join(this.configManager.configDir, 'plugins');
        try {
          fs.mkdirSync(pluginDir, { recursive: true });
          repairActions.push({ action: res.fixType, status: 'fixed', path: pluginDir });
        } catch (err) {
          repairActions.push({ action: res.fixType, status: 'failed', error: err.message });
        }
      });
      results = this.collectResults();
      issuesCount = results.filter(res => res.status === 'fail').length;
    }

    const data = {
      healthy: issuesCount === 0,
      issues: issuesCount,
      results,
      ...(options.fix ? { repairActions } : {})
    };

    const result = issuesCount === 0
      ? AutomationResult.success(data)
      : AutomationResult.failure(ExitCodes.GENERAL_ERROR, `${issuesCount} issue(s) found`, data);

    this.renderHuman(result, options);
    return result;
  }
}

module.exports = DoctorCommand;
