class ProfileManager {
  constructor(configManager) {
    this.configManager = configManager;
  }

  list() {
    return this.configManager.get('profiles') || {};
  }

  get(name) {
    const profile = this.list()[name];
    if (!profile) throw new Error(`Profile "${name}" not found.`);
    return profile;
  }

  save(name, profile) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('Invalid profile name.');
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Profile must be an object.');
    const profiles = this.list();
    profiles[name] = { ...profile };
    this.configManager.set('profiles', profiles);
    return profiles[name];
  }

  remove(name) {
    const profiles = this.list();
    if (!profiles[name]) return false;
    delete profiles[name];
    this.configManager.set('profiles', profiles);
    return true;
  }

  apply(name) {
    const profile = this.get(name);
    if (profile.services && typeof profile.services === 'object') {
      this.configManager.set('activeProfile', name);
      this.configManager.set('profileServices', profile.services);
    }
    if (Array.isArray(profile.dependencies)) this.configManager.set('profileDependencies', profile.dependencies);
    return profile;
  }
}

module.exports = ProfileManager;
