import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checked,readZone,titleUpdate,ready,watchAuth,checkAuth,callerURL,callerConfirmed} from './core.mjs';
const record = {recordName:'test',recordType:'CD_TaskRecord',recordChangeTag:'v1',fields:{CD_title:{value:'before'},CD_tags:{value:'binary'}}};
assert.deepEqual(titleUpdate(record,' after ').fields,{CD_title:{value:'after'}});
assert.equal(titleUpdate(record,'after').recordChangeTag,'v1');
assert.equal(record.fields.CD_title.value,'before');
assert.throws(() => titleUpdate(record,' '));
assert.throws(() => titleUpdate({...record,recordChangeTag:null},'after'));
assert.throws(() => titleUpdate({...record,fields:{CD_title_ckAsset:{value:{}}}},'after'));
assert.throws(() => checked({hasErrors:true,errors:[{reason:'conflict'}]}),/conflict/);
let calls = 0;
const db = {async fetchRecordZoneChanges(options) {calls++; if(calls===1) return {zones:[{records:[record],moreComing:true,syncToken:'next'}]}; assert.equal(options.syncToken,'next'); return {zones:[{records:[{recordName:'test',deleted:true},{...record,recordName:'second'}],moreComing:false}]};}};
assert.deepEqual((await readZone(db,{zoneName:'test'})).map(r => r.recordName),['second']);
await assert.rejects(readZone({fetchRecordZoneChanges:async () => ({zones:[{errors:[{reason:'permission denied'}]}]})},{}),/permission denied/);
await assert.rejects(readZone({fetchRecordZoneChanges:async () => ({zones:[{moreComing:true}]})},{}),/分页/);
const graph={tasks:[{id:'a',status:'todo'},{id:'b',status:'todo'}],dependencies:[{prerequisiteTaskID:'a',dependentTaskID:'b'}]};
assert.equal(ready(graph.tasks[1],graph),false); graph.tasks[0].status='completed'; assert.equal(ready(graph.tasks[1],graph),true);
const events=[], failures=[];
let resolveIn,rejectIn,resolveOut;
const authContainer={
  whenUserSignsIn() {return new Promise((resolve,reject) => {resolveIn=resolve;rejectIn=reject;});},
  whenUserSignsOut() {return new Promise(resolve => {resolveOut=resolve;});}
};
watchAuth(authContainer,user => events.push(user),e => failures.push(e));
rejectIn(new Error('popup failed'));
await new Promise(resolve => setImmediate(resolve));
resolveIn({userRecordName:'test-user'});
await new Promise(resolve => setImmediate(resolve));
resolveOut();
await new Promise(resolve => setImmediate(resolve));
assert.equal(failures.length,1);
assert.deepEqual(events,[{userRecordName:'test-user'},null]);
resolveIn({userRecordName:'second-user'});
await new Promise(resolve => setImmediate(resolve));
assert.equal(events[2].userRecordName,'second-user');
assert.equal(await checkAuth({setUpAuth:async () => null}),null);
await assert.rejects(checkAuth({setUpAuth:() => new Promise(() => {})},5),e => e.ckErrorCode === 'AUTH_CHECK_TIMEOUT');
// Prevent diagnostic probes from reintroducing concurrent requests or taking SDK credentials.
const appSource = await readFile(new URL('./app.mjs',import.meta.url),'utf8');
assert.doesNotMatch(appSource,/fetchCurrentUserIdentity|getConfig\(|ckWebAuthToken|verifyCloudSession|fetch\(/);
for (const environment of ['development','production']) {
  const url=callerURL('api+token/',environment,'session+/=%25');
  assert.equal(url.pathname,`/database/1/iCloud.DAGTodo/${environment}/public/users/caller`);
  assert.equal(url.searchParams.get('ckWebAuthToken'),'session+/=%25');
  assert.equal(url.searchParams.get('ckAPIToken'),'api+token/');
}
assert.throws(() => callerURL('test','other','test'));
assert.equal(callerConfirmed({users:[{userRecordName:'test-user'}]}),true);
assert.equal(callerConfirmed({users:[]}),false);
assert.equal(callerConfirmed({userRecordName:'legacy'}),false);
console.log('CloudKit pagination, update guards, dependency readiness and login retry/sign-out passed.');
