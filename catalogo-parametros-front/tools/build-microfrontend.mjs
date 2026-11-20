import { build } from 'esbuild';
import { transformAsync } from '@babel/core';
import linkerPlugin from '@angular/compiler-cli/linker/babel';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ngc = resolve(dirname(require.resolve('@angular/compiler-cli/package.json')), 'bundles/src/bin/ngc.js');
const compiled = spawnSync(process.execPath, [ngc, '-p', 'tsconfig.microfrontend.json'], { cwd: root, stdio: 'inherit' });
if (compiled.status !== 0) process.exit(compiled.status ?? 1);
const aot = resolve(root, '.angular/microfrontend-aot/microfrontend');
const output = resolve(root, 'dist/parametros-ui');
await mkdir(output, { recursive: true });
const logoDataUri = `data:image/png;base64,${(await readFile(resolve(root, 'src/assets/logo-uco.png'))).toString('base64')}`;
const microfrontendStyles = (await readFile(resolve(root, 'src/microfrontend/styles.css'), 'utf8'))
  .replace('__UCO_LOGO_DATA_URI__', logoDataUri);
await writeFile(resolve(aot, 'styles.css'), microfrontendStyles);
await build({
  absWorkingDir: root, entryPoints: [resolve(aot, 'public-api.js')],
  outfile: resolve(output, 'parametros-administration.js'),
  bundle: true, format: 'esm', platform: 'browser', target: ['es2022'],
  minify: true, legalComments: 'linked', loader: { '.css': 'text' },
  define: { ngDevMode: 'false', ngJitMode: 'false', ngI18nClosureMode: 'false', 'process.env.NODE_ENV': '"production"' },
  plugins: [{
    name: 'angular-aot-linker',
    setup(builder) {
      builder.onLoad({ filter: /\.[cm]?js$/ }, async args => {
        const code = await readFile(args.path, 'utf8');
        if (!code.includes('ɵɵngDeclare')) return undefined;
        const result = await transformAsync(code, {
          filename: args.path, babelrc: false, configFile: false,
          plugins: [[linkerPlugin, { linkerJitMode: false }]], sourceMaps: false
        });
        return { contents: result.code, loader: 'js' };
      });
    }
  }]
});
await copyFile(resolve(aot, 'types.d.ts'), resolve(output, 'types.d.ts'));
await copyFile(resolve(aot, 'public-api.d.ts'), resolve(output, 'parametros-administration.d.ts'));
await mkdir(resolve(output, 'assets'), { recursive: true });
await copyFile(resolve(root, 'src/assets/logo-uco.png'), resolve(output, 'assets/logo-uco.png'));
await writeFile(resolve(output, 'manifest.json'), JSON.stringify({
  name: 'uco-parametros-administration', version: '1.0.0', entry: 'parametros-administration.js', types: 'parametros-administration.d.ts'
}, null, 2) + '\n');
console.log('Microfrontend AOT listo en dist/parametros-ui');
