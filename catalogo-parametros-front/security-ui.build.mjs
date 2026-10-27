import { build } from 'vite';

// La revisión externa también debe producir ESM ejecutable sin globals de Node.
await build({ define: { 'process.env.NODE_ENV': JSON.stringify('production') } });
