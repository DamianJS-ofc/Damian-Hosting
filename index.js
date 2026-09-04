import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({origin:'*'}));
app.use(express.json({limit:'10mb'}));

let logs = "=== DAMIAN-HOSTING v5 TERMUX REAL ===\nType help for commands\n\n";
const ROOT = __dirname;
const BOT_DIR = path.join(ROOT, 'bot');
let currentDir = ROOT;
let isBusy = false;

// Asegurar carpetas
if(!fs.existsSync(BOT_DIR)) fs.mkdirSync(BOT_DIR,{recursive:true});

function getPrompt(){
  let rel = path.relative(ROOT, currentDir) || '~';
  return `damian@host:${rel}$ `;
}

app.get('/', (req,res)=>res.send('DAMIAN-HOSTING v5 TERMUX ONLINE'));

app.get('/exec', (req,res)=>{
  let cmd = (req.query.cmd||'').trim();
  if(!cmd) return res.send('Escribi un comando');
  if(isBusy) return res.send('Espera, hay otro comando corriendo...');

  logs += getPrompt() + cmd + "\n";
  
  // Comandos internos
  if(cmd === 'clear' || cmd === 'cls'){
    logs = "=== DAMIAN-HOSTING v5 TERMUX REAL ===\n\n";
    return res.send('CLEARED');
  }
  if(cmd === 'help'){
    logs += `Comandos: ls, cd, pwd, cat, mkdir, rm, git clone, npm install, npm start, node ., node index.js, clear, help\n$ `;
    return res.send('help ok');
  }
  if(cmd.startsWith('cd ')){
    let target = cmd.slice(3).trim() || ROOT;
    let newPath = target.startsWith('/') ? target : path.join(currentDir, target);
    newPath = path.resolve(newPath);
    if(!fs.existsSync(newPath)){ logs += `bash: cd: ${target}: No such file\n${getPrompt()}`; return res.send('cd error'); }
    currentDir = newPath;
    logs += `${getPrompt()}`;
    return res.send('cd ok');
  }
  if(cmd === 'cd'){ currentDir = ROOT; logs+=getPrompt(); return res.send('cd ok'); }
  if(cmd === 'pwd'){ logs+=currentDir+"\n"+getPrompt(); return res.send('pwd ok'); }
  if(cmd.startsWith('ls')){
    try{
      let target = cmd.split(' ')[1] || '';
      let dir = target ? path.join(currentDir, target) : currentDir;
      let files = fs.readdirSync(dir);
      logs+=files.join('  ')+"\n"+getPrompt();
    }catch(e){ logs+=e.message+"\n"+getPrompt(); }
    return res.send('ls ok');
  }

  // Comando especial clone rapido de Anubis
  if(cmd.startsWith('clone ')){
    let repo = cmd.split(' ')[1];
    if(!repo){ logs+="Uso: clone https://github.com/user/repo.git\n"+getPrompt(); return res.send('error'); }
    cmd = `git clone ${repo} ${BOT_DIR}`;
    currentDir = ROOT;
  }

  isBusy = true;
  exec(cmd, {cwd: currentDir, timeout: 300000, maxBuffer: 1024*1024*10}, (err, stdout, stderr)=>{
    if(stdout) logs+=stdout;
    if(stderr) logs+=stderr;
    if(err && !stdout && !stderr) logs+=err.message+"\n";
    logs+=getPrompt();
    isBusy = false;
    
    // Auto-detectar si clonó y instalar
    if(cmd.includes('git clone') && fs.existsSync(BOT_DIR)){
      logs+="\nClonado OK! Ahora hace: cd bot && npm install\n"+getPrompt();
    }
  });
  res.send('ejecutando...');
});

app.get('/logs',(req,res)=>{
  res.set('Access-Control-Allow-Origin','*');
  res.type('text/plain').send(logs.slice(-30000));
});

// File manager igual
function safe(p){
  let full = path.join(BOT_DIR, p||'');
  if(!full.startsWith(BOT_DIR)) return BOT_DIR;
  return full;
}
app.get('/files',(req,res)=>{
  const dir=safe(req.query.path||'');
  try{
    if(!fs.existsSync(dir)) return res.json([]);
    let list=fs.readdirSync(dir).map(f=>{
      let fp=path.join(dir,f);
      try{
        let stat=fs.statSync(fp);
        return {name:f, isDir:stat.isDirectory(), size:stat.size, path:path.relative(BOT_DIR, fp)};
      }catch{ return {name:f, isDir:false, size:0, path:f} }
    });
    res.json(list);
  }catch(e){res.json({error:e.message})}
});
app.get('/file',(req,res)=>{ try{ res.type('text/plain').send(fs.readFileSync(safe(req.query.path),'utf8')); } catch(e){res.status(500).send(e.message)} });
app.post('/save',(req,res)=>{ try{ let fp=safe(req.body.path); fs.mkdirSync(path.dirname(fp),{recursive:true}); fs.writeFileSync(fp, req.body.content||''); res.send('Guardado'); } catch(e){res.status(500).send(e.message)} });
app.get('/delete',(req,res)=>{ try{ let fp=safe(req.query.path); if(fs.existsSync(fp)){ if(fs.statSync(fp).isDirectory()) fs.rmSync(fp,{recursive:true,force:true}); else fs.unlinkSync(fp); } res.send('Borrado'); } catch(e){res.status(500).send(e.message)} });
app.get('/rename',(req,res)=>{ try{ fs.renameSync(safe(req.query.old),safe(req.query.new)); res.send('Renombrado'); } catch(e){res.status(500).send(e.message)} });
app.get('/mkdir',(req,res)=>{ try{ fs.mkdirSync(safe(req.query.path),{recursive:true}); res.send('Creada'); } catch(e){res.status(500).send(e.message)} });

app.listen(10000,()=>console.log('DAMIAN-HOSTING v5 TERMUX REAL ON 10000'));
