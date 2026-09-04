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
app.use(express.json({limit:'5mb'}));

let logs = "=== DAMIAN-HOSTING v4 FILE MANAGER ONLINE ===\n";
const BOT_DIR = path.join(__dirname, 'bot');

function safe(p){
  let full = path.join(BOT_DIR, p||'');
  if(!full.startsWith(BOT_DIR)) return BOT_DIR;
  return full;
}

app.get('/', (req,res)=>res.send('DAMIAN-HOSTING ONLINE v4'));

app.get('/clonar',(req,res)=>{
  const repo=req.query.repo;
  if(!repo) return res.send('Falta ?repo=');
  logs+=`\n$ git clone ${repo}\n`;
  res.send('Clonando... mira /logs');
  
  try{ 
    if(fs.existsSync(BOT_DIR)) {
      fs.rmSync(BOT_DIR,{recursive:true,force:true});
      logs+="Borrado anterior OK\n";
    }
  } catch(e){ logs+=`Force rm error: ${e.message}\n`; }

  exec(`git clone ${repo} ${BOT_DIR} && cd ${BOT_DIR} && npm install`,{timeout:300000},(e,out,err)=>{
    logs+=out+"\n"+err;
    if(e){
      logs+=`\nERROR: ${e.message}\n$ `;
    } else {
      logs+=`\n=== CLON OK - Instalado - Iniciando bot ===\n$ `;
      const p = exec(`cd ${BOT_DIR} && npm start`,{timeout:0});
      p.stdout?.on('data',d=>{ logs+=d; console.log(d); });
      p.stderr?.on('data',d=>{ logs+=d; });
      p.on('error',err=>logs+=`\nStart error: ${err.message}\n`);
    }
  });
});

app.get('/logs',(req,res)=>{
  res.set('Access-Control-Allow-Origin','*');
  res.type('text/plain').send(logs.slice(-20000)+"\n\ndamian@host:~$");
});

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

app.get('/file',(req,res)=>{
  try{ res.type('text/plain').send(fs.readFileSync(safe(req.query.path),'utf8')); }
  catch(e){res.status(500).send(e.message)}
});

app.post('/save',(req,res)=>{
  try{
    let fp=safe(req.body.path);
    fs.mkdirSync(path.dirname(fp),{recursive:true});
    fs.writeFileSync(fp, req.body.content||'');
    logs+=`\n$ edited ${req.body.path}\n$ `;
    res.send('Guardado');
  }catch(e){res.status(500).send(e.message)}
});

app.get('/delete',(req,res)=>{
  try{
    let fp=safe(req.query.path);
    if(fs.existsSync(fp)){
      if(fs.statSync(fp).isDirectory()) fs.rmSync(fp,{recursive:true,force:true});
      else fs.unlinkSync(fp);
    }
    logs+=`\n$ rm ${req.query.path}\n$ `;
    res.send('Borrado');
  }catch(e){res.status(500).send(e.message)}
});

app.get('/rename',(req,res)=>{
  try{ fs.renameSync(safe(req.query.old),safe(req.query.new)); res.send('Renombrado'); }
  catch(e){res.status(500).send(e.message)}
});

app.get('/mkdir',(req,res)=>{
  try{ fs.mkdirSync(safe(req.query.path),{recursive:true}); res.send('Carpeta creada'); }
  catch(e){res.status(500).send(e.message)}
});

app.listen(10000,()=>console.log('DAMIAN-HOSTING v4.1 FIXED ON 10000'));
