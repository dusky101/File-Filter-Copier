/**
 * Base Vite configuration for Electron Forge
 * 
 * This file provides shared utilities for the main and renderer processes.
 */

export function pluginExposeRenderer(name) {
  return {
    name: `plugin-expose-renderer-${name}`,
    configureServer(server) {
      const { port } = server.config.server;
      const protocol = server.config.server.https ? 'https' : 'http';
      const name_upper = name.toUpperCase().replaceAll('-', '_');
      
      // Expose the dev server URL as an environment variable
      process.env[`${name_upper}_VITE_DEV_SERVER_URL`] = `${protocol}://localhost:${port}`;
    },
  };
}