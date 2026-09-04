const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
app.use(cors({origin:'*'}));
app.use(express.json({limit:'50mb'}));
let LOGS='=== DAMIAN-HOSTING v5 READY ===\n';
let CUR_DIR=path.join(__dirname,'bot');
if(!fs.existsSync(CUR_DIR)) fs.mkdirSync(CUR_DIR,{recursive:true});
function addLog(t){LOGS+=t+'\n';if(LOGS.length>50000)LOGS=LOGS.slice(-40000);console.log(t);}
app.get('/',(req,res)=>res.send('v5 ON'));
app.get('/logs',(req,res)=>{res.set('Access-Control-Allow-Origin','*');res.type('text/plain').send(LOGS);});
app.get('/exec',(req,res)=>{
  res.set('Access-Control-Allow-Origin','*');
  let cmd=req.query.cmd;if(!cmd)return res.send('no cmd');
  addLog(`$ ${cmd}`);
  if(cmd.startsWith('cd ')){let p=cmd.slice(3).trim();let np=path.resolve(CUR_DIR,p);if(fs.existsSync(np)){CUR_DIR=np;addLog('cd -> '+CUR_DIR);}else addLog('no existe: '+np);return res.json({ok:true});}
  exec(cmd,{cwd:CUR_DIR,maxBuffer:1024*1024*10,timeout:120000},(err,stdout,stderr)=>{if(stdout)addLog(stdout);if(stderr)addLog('ERR: '+stderr);if(err&&!stdout)addLog('Error: '+err.message);});
  res.json({ok:true});
});
app.get('/files',(req,res)=>{res.set('Access-Control-Allow-Origin','*');let p=req.query.path||'';let full=path.join(CUR_DIR,p);if(!fs.existsSync(full))return res.json([]);let items=fs.readdirSync(full).map(n=>{let fp=path.join(full,n);let s=fs.statSync(fp);return{name:n,path:path.join(p,n),isDir:s.isDirectory()};});res.json(items);});
app.get('/file',(req,res)=>{res.set('Access-Control-Allow-Origin','*');let full=path.join(CUR_DIR,req.query.path||'');res.send(fs.readFileSync(full,'utf8'));});
app.post('/save',(req,res)=>{res.set('Access-Control-Allow-Origin','*');let full=path.join(CUR_DIR,req.body.path);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,req.body.content||'');res.json({ok:true});});
app.get('/delete',(req,res)=>{res.set('Access-Control-Allow-Origin','*');let full=path.join(CUR_DIR,req.query.path||'');if(fs.existsSync(full))fs.rmSync(full,{recursive:true,force:true});res.json({ok:true});});
app.listen(process.env.PORT||10000,()=>console.log('v5'));
