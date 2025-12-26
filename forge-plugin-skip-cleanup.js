class SkipCleanupPlugin {
  constructor() {
    this.name = 'skip-cleanup';
  }

  async postPackage() {
    console.log('🧹 Skipping cleanup of temp folder');
  }
}

module.exports = new SkipCleanupPlugin();
