import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import simpleGit from 'simple-git';
import fs from 'fs';

const app = express();
app.use(cors());
let logs = "Damian-Hosting iniciado...\n";

app.get('/', (req,res) => res.send('DAMIAN-HOSTING ONLINE - usa /clonar?repo=LINK'));

app.get('/clonar', async (req,res) => {
  const repo = req.query.repo;
  if(!repo) return res.send('Falta ?repo=LINK');
  logs += `\n[CLONANDO] ${repo}\n`;
  try{
    if(fs.existsSync('./bot')) fs.rmSync('./bot',{recursive:true,force:true});
    await simpleGit().clone(repo, './bot');
    logs += "Clonado OK\nInstalando...\n";
    exec('cd bot && npm install', (err,stdout,stderr)=>{
      logs += stdout + stderr;
      logs += "\nIniciando bot...\n";
      exec('cd bot && npm start', (e,o,er)=>{ logs+=o+er; });
      res.send(`CLONADO Y INICIADO: ${repo}\nAnda a /logs`);
    });
  }catch(e){ logs+= e.message; res.send('Error: '+e.message); }
});

app.get('/logs', (req,res) => res.type('text').send(logs));
app.get('/clear', (req,res)=>{ logs=''; res.send('Logs limpiados'); });

app.listen(10000, ()=>console.log('Damian-Hosting en puerto 10000'));
