import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'Login',
  exposes: {
    './Routes': 'apps/login/src/app/remote-entry/entry.routes.ts',
  },
  // @angular/cdk y @angular/material son provistos como singletons por el host (app-shell).
  // Declararlos aquí también causaría que Webpack registre dos instancias (NG0912).
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
