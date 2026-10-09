#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,lstatSync,existsSync,openSync,closeSync,unlinkSync,realpathSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {adapter,validateAdapter,originRepository,revision,digest,transport,seal,executable} from './core.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const catalogue = JSON.parse(readFileSync(join(root,'tools/independent-actions/repositories.json'),'utf8'));
function run(cmd,args,options={}) {
  const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:128*1024*1024,timeout:30*60*1000,...options});
  if(r.error || r.status!==0) throw Error(`${cmd} failed: ${r.error?.message || r.stderr || r.stdout}`);
  return r.stdout;
}
const git=(cwd,...args)=>run('git',['-C',cwd,...args]).trim();
const opts={}; const [command,...argv]=process.argv.slice(2);
try {
  for(let i=0;i<argv.length;i+=2) { if(!argv[i].startsWith('--') || !argv[i+1] || argv[i+1].startsWith('--')) throw Error('Expected --name value'); opts[argv[i].slice(2)]=argv[i+1]; }
  for(const name of Object.keys(opts)) if(!['repository','controller-revision','checkout','reviewed-sha','host','state'].includes(name)) throw Error(`Unknown option: ${name}`);
  if(command==='list') { console.log(JSON.stringify(catalogue,null,2)); }
  else if(command==='adapter') {
    const entry=catalogue.repositories[opts.repository]; if(!entry) throw Error('Repository not enrolled');
    console.log(JSON.stringify(adapter(opts.repository,opts['controller-revision'],entry),null,2));
  } else if(['plan','check-adapter','verify'].includes(command)) {
    const checkout=realpathSync(resolve(opts.checkout || '.'));
    const repository=originRepository(git(checkout,'remote','get-url','origin'));
    const entry=catalogue.repositories[repository]; if(!entry) throw Error('Repository not enrolled');
    const controllerRevision=git(root,'rev-parse','HEAD');
    const value=JSON.parse(readFileSync(join(checkout,'.github/independent-actions.json'),'utf8'));
    validateAdapter(value,repository,controllerRevision,entry);
    const sha=git(checkout,'rev-parse','HEAD');
    if(command!=='verify') console.log(JSON.stringify({repository,sha,controllerRevision,...entry},null,2));
    else {
      executable(entry);
      if(git(root,'status','--porcelain') || git(checkout,'status','--porcelain')) throw Error('Clean controller and target checkouts required');
      if(originRepository(git(root,'remote','get-url','origin'))!=='mithril-lang/.github') throw Error('Controller origin mismatch');
      if(opts['reviewed-sha']) { if(!revision(opts['reviewed-sha']) || opts['reviewed-sha']!==sha) throw Error('Reviewed SHA mismatch'); }
      else {
        const remote=run('git',['ls-remote',git(checkout,'remote','get-url','origin'),'refs/heads/main']).split(/\s/)[0];
        if(remote!==sha) throw Error('Target is not current remote main; use explicit reviewed SHA for reviewed changes');
      }
      if(!opts.state) throw Error('External private --state directory required');
      const state=resolve(opts.state);
      if(state===checkout || state.startsWith(checkout+'/') || state===root || state.startsWith(root+'/')) throw Error('State must be outside source checkout');
      mkdirSync(state,{recursive:true,mode:0o700});
      const s=lstatSync(state); if(!s.isDirectory() || s.uid!==process.getuid() || (s.mode&0o077)) throw Error('State must be owner-only directory');
      const lock=join(state,'run.lock'); const lockFd=openSync(lock,'wx',0o600);
      let volume;
      try {
        const keyPath=join(state,'authority.key');
        if(!existsSync(keyPath)) writeFileSync(keyPath,randomBytes(32),{mode:0o600,flag:'wx'});
        const k=lstatSync(keyPath); if(!k.isFile() || k.uid!==process.getuid() || (k.mode&0o077)) throw Error('Authority key must be owner-only regular file');
        const key=readFileSync(keyPath); if(key.length!==32) throw Error('Authority key length invalid');
        const docker=(...args)=>{const [cmd,a]=transport(opts.host,args);return run(cmd,a);};
        const archive=run('git',['-C',checkout,'archive','--format=tar.gz',sha],{encoding:null});
        volume='mithril-ci-'+randomBytes(10).toString('hex');
        docker('pull',entry.image); docker('volume','create',volume);
        const common=['--rm','--cpus=2','--memory=4g','--pids-limit=256','--cap-drop=ALL','--security-opt=no-new-privileges','--mount',`type=volume,src=${volume},dst=/work`,'-w','/work'];
        const loadArgs=['run','-i',...common,'--network=none',entry.image,'sh','-ec','test "$(df -Pk /work | awk \'NR==2 {print $4}\')" -ge 8388608; tar -xz -C /work'];
        const [loadCmd,loadTransport]=transport(opts.host,loadArgs); run(loadCmd,loadTransport,{input:archive});
        const output=docker('run',...common,'--network=none',entry.image,'sh','-ec',entry.steps.join('\n'));
        const identity={repository,sha,profile:entry.profile,controllerRevision,image:entry.image,recipeDigest:digest(entry),scope:entry.scope};
        const log=join(state,`${digest(identity)}.log`); writeFileSync(log,output,{mode:0o600});
        const receipt=seal({...identity,status:'success',finishedAt:new Date().toISOString(),releaseEligible:false},key);
        const path=join(state,`${digest(identity)}.json`); writeFileSync(path,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
        console.log(JSON.stringify({receipt:path,log,...identity,releaseEligible:false},null,2));
      } finally {
        if(volume) {const [cmd,a]=transport(opts.host,['volume','rm',volume]); spawnSync(cmd,a,{encoding:'utf8',timeout:30000});}
        closeSync(lockFd); unlinkSync(lock);
      }
    }
  } else throw Error('Usage: cli.mjs list | adapter --repository NAME --controller-revision SHA | plan/check-adapter/verify --checkout PATH [--reviewed-sha SHA --host SSH_ALIAS --state PRIVATE_PATH]');
} catch(error) { console.error(error.message); process.exitCode=1; }
