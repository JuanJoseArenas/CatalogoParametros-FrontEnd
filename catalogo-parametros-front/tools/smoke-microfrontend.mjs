import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

// Comprueba el ESM AOT en un navegador real contra el backend local sin sesion.
// No crea datos ni utiliza credenciales de integracion.
const bundle = process.env.PARAMETROS_UI_BUNDLE_URL
  ? Buffer.from(await (await fetch(process.env.PARAMETROS_UI_BUNDLE_URL)).arrayBuffer())
  : await readFile(new URL('../dist/parametros-ui/parametros-administration.js', import.meta.url));
const server = createServer(async (req, res) => {
  if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle); return; }
  if (req.url.startsWith('/api/')) {
    try {
      const upstream = await fetch(`http://localhost:8080/catalogo-parametros/api/v1/${req.url.slice(5)}`);
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' }); res.end(await upstream.text());
    } catch { res.writeHead(502); res.end('{}'); }
    return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.end(`<div id="host"></div><pre id="result">pending</pre><script type="module">
    import {mount} from '/bundle.js';
    const host=document.querySelector('#host'); let auth=0;
    try {
      const opts={applicationId:'11111111-1111-4111-8111-111111111111',apiBaseUrl:location.origin+'/api',refreshIntervalMs:0,onAuthenticationRequired:()=>auth++};
      const ui=mount(host,opts);
      let failure;
      await ui.ready.then(()=>{throw Error('Se esperaba 401 sin sesion')},e=>failure=e);
      await new Promise(resolve=>setTimeout(resolve,100));
      if(auth!==1 || !ui.element.shadowRoot.querySelector('[role="alert"]')) throw Error('No monto AOT o no notifico autenticacion: '+auth+' '+failure?.stack);
      ui.unmount(); ui.unmount(); if(host.children.length) throw Error('No limpio el host');
      const old=mount(host,opts); const next=mount(host,opts);
      if(host.children.length!==1) throw Error('Duplico instancias');
      old.unmount(); next.unmount(); await Promise.allSettled([old.ready,next.ready]);
      if(host.children.length) throw Error('No limpio las instancias pendientes');
      document.querySelector('#result').textContent='PASS: AOT, sesion requerida, Shadow DOM, reemplazo y limpieza';
    } catch(e){document.querySelector('#result').textContent='FAIL: '+e.stack;}
  </script>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = await mkdtemp(join(tmpdir(), 'catalogo-mfe-smoke-'));
try {
  const chrome = process.env.CHROME_BIN ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const proc = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', `--user-data-dir=${profile}`, '--dump-dom', '--timeout=15000', '--virtual-time-budget=10000', `http://127.0.0.1:${server.address().port}`], { windowsHide: true });
  let output = ''; proc.stdout.on('data', data => output += data); proc.stderr.resume();
  await new Promise((resolve, reject) => { proc.once('error', reject); proc.once('exit', resolve); });
  const result = output.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1] ?? output;
  console.log(result); if (!result.startsWith('PASS:')) process.exitCode = 1;
} finally { server.closeAllConnections(); server.close(); await rm(profile, { recursive: true, force: true, maxRetries: 3 }); }
