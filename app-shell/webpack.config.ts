import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

/**
 * DTS Plugin is disabled in Nx Workspaces as Nx already provides Typing support for Module Federation
 * The DTS Plugin can be enabled by setting dts: true
 * Learn more about the DTS Plugin here: https://module-federation.io/configure/dts.html
 */
export default async function (wConfig: any) {
  const mfFn = await withModuleFederation(config, { dts: false });
  const finalConfig = mfFn(wConfig);

  // Asegura que styles.js se cargue como módulo ESM (type="module") para evitar
  // el error "Cannot use 'import.meta' outside a module" en Webpack con outputModule
  if (finalConfig.plugins) {
    for (const plugin of finalConfig.plugins) {
      if (plugin?.constructor?.name === 'IndexHtmlWebpackPlugin' && plugin.options?.entrypoints) {
        plugin.options.entrypoints = plugin.options.entrypoints.map(
          ([entry, isModule]: [string, boolean]) => [entry, entry === 'styles' ? true : isModule]
        );
      }
    }

    finalConfig.plugins.push({
      apply(compiler: any) {
        compiler.hooks.thisCompilation.tap('FixStylesScriptTypeModulePlugin', (compilation: any) => {
          compilation.hooks.processAssets.tap(
            {
              name: 'FixStylesScriptTypeModulePlugin',
              stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE + 2,
            },
            (assets: any) => {
              for (const assetName of Object.keys(assets)) {
                if (assetName.endsWith('.html')) {
                  const asset = assets[assetName];
                  const content = asset.source().toString();
                  if (content.includes('styles.js')) {
                    const updated = content.replace(
                      /<script src="([^"]*styles\.js)" defer><\/script>/g,
                      '<script src="$1" type="module"></script>'
                    );
                    assets[assetName] = new compiler.webpack.sources.RawSource(updated);
                  }
                }
              }
            }
          );
        });
      },
    });
  }

  return finalConfig;
}
