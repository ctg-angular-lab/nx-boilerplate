import { ModuleFederationConfig, sharePackages } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'app-shell',
  // Los remotes se registran dinámicamente en runtime vía main.ts → registerRemotes()
  // usando el manifest en public/module-federation.manifest.json.
  // NO declarar remotes estáticos aquí: causaría que Nx detecte los mismos remotes
  // dos veces (estáticos + dinámicos del manifest) generando conflictos de puertos (NG0912, EADDRINUSE).
  additionalShared: Object.entries(
    sharePackages(['@angular/animations', '@angular/cdk', '@angular/material'])
  ),
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
