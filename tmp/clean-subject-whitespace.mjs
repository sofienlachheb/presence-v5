import fs from 'node:fs';
const p='src/presence/PeriodicEvaluationView.tsx';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/[ \t]+\r?$/gm,''));
