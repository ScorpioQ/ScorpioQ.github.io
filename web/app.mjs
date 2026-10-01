import {checked, readZone, titleUpdate, ready, watchAuth, checkAuth} from './core.mjs?v=20261001-9';
const $ = id => document.getElementById(id);
const message = text => $('message').textContent = text;
const key = 'dagtodo.web.local.v1';
let graph = {version:3,tasks:[],dependencies:[]};
let writable = true;
try {const saved = localStorage.getItem(key); if (saved) {const data = JSON.parse(saved); if (data.version !== 3 || !Array.isArray(data.tasks) || !Array.isArray(data.dependencies)) throw new Error(); graph = data;}}
catch {writable = false; message('无法读取本地存储，已停止写入以保留原有数据。请检查浏览器存储设置。');}
function commit(next) {
  if (!writable) throw new Error('本地存储不可用');
  localStorage.setItem(key, JSON.stringify(next)); graph = next; render();
}
function button(text, action) {const b = document.createElement('button'); b.textContent = text; b.onclick = () => run(b, action); return b;}
async function run(control, action) {control.disabled = true; try {await action();} catch (e) {message(e.message || e.reason || '操作失败');} finally {control.disabled = control.id === 'read' && !signedIn;}}
function render() {
  $('tasks').replaceChildren(); $('prerequisite').replaceChildren(new Option('无前置任务',''));
  for (const task of graph.tasks) {
    $('prerequisite').add(new Option(task.title,task.id));
    const li = document.createElement('li'), title = document.createElement('span'), status = document.createElement('small');
    title.textContent = task.title; status.textContent = task.status === 'completed' ? '已完成' : ready(task,graph) ? '可开始' : '等待前置任务';
    li.append(title,status,button(task.status === 'completed' ? '重新打开' : '完成', () => {
      const next = structuredClone(graph), changed = next.tasks.find(t => t.id === task.id);
      changed.status = task.status === 'completed' ? 'todo' : 'completed';
      if (changed.status === 'completed') changed.completedAt = new Date().toISOString(); else delete changed.completedAt;
      commit(next);
    })); $('tasks').append(li);
  }
  if (!graph.tasks.length) {const li = document.createElement('li'); li.textContent = '添加第一个任务，或为新任务选择一个前置任务。'; $('tasks').append(li);}
}
$('add').onsubmit = e => {e.preventDefault(); try {const title = $('title').value.trim(); if (!title) throw new Error('请输入任务标题'); const next = structuredClone(graph), id = crypto.randomUUID().toUpperCase(); next.tasks.push({id,title,status:'todo',priority:3,tags:[],createdAt:new Date().toISOString()}); if ($('prerequisite').value) next.dependencies.push({prerequisiteTaskID:$('prerequisite').value,dependentTaskID:id}); commit(next); $('title').value = ''; message('已保存到此浏览器');} catch(e) {message(e.message);}};
$('export').onclick = () => {const url = URL.createObjectURL(new Blob([JSON.stringify({...graph,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'DAGTodo.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);};
render();

let container, signedIn = false, session = 0, loginTimer, receivedSession = false;
const authTrace = [];
function trace(text) {
  authTrace.push(`${new Date().toLocaleTimeString()} ${text}`);
  $('auth-diagnostics').textContent = authTrace.slice(-20).join('\n');
}
trace(`页面版本 20261001-9；来源 ${location.origin}；Development`);
window.addEventListener('message', event => {
  let host;
  try {host = new URL(event.origin).hostname;} catch {return;}
  if (!['apple.com','icloud.com','apple-cloudkit.com'].some(domain => host === domain || host.endsWith('.'+domain))) return;
  const data = event.data;
  trace(`收到 Apple 窗口消息；会话字段 ${Boolean(data && typeof data === 'object' && data.ckSession)}；错误字段 ${Boolean(data && typeof data === 'object' && data.errorMessage)}`);
  if (data && typeof data === 'object' && data.ckSession) {
    receivedSession = true;
    clearTimeout(loginTimer);
    $('cloud-status').textContent = 'Apple 已返回会话，正在确认 CloudKit 是否接受……';
    // Observe only: the SDK owns callback processing and session rotation.
    loginTimer = setTimeout(() => {
      if (!signedIn) {trace('收到回调后 30 秒仍无 SDK 登录成功事件'); $('cloud-status').textContent = 'Apple 已返回会话，但 SDK 未确认登录。请使用独立 REST 认证页验证新会话。';}
    },30000);
  }
});
function auth(user) {trace(user ? 'SDK 确认已登录' : 'SDK 返回未登录'); clearTimeout(loginTimer); session++; signedIn = Boolean(user); $('read').disabled = !signedIn; $('cloud-tasks').replaceChildren(); $('diagnostics').textContent = '尚未读取'; $('cloud-status').textContent = signedIn ? '已登录 · 开发环境 · 可以读取 App 的记录' : '未登录 · 本地任务仍可使用';}
function authError(e) {
  clearTimeout(loginTimer);
  const code = String(e.ckErrorCode || 'UNKNOWN');
  trace(`SDK 错误 ${code.replace(/[^A-Z0-9_]/gi,'').slice(0,60)}`);
  $('cloud-status').textContent = `Apple 登录未完成（${code}）。请检查下方登录诊断和 Token 的 Post Message 回调配置。`;
}
$('apple-sign-in-button').addEventListener('click', () => {
  clearTimeout(loginTimer);
  receivedSession = false;
  trace('点击 Apple 登录按钮，开始等待回调');
  $('cloud-status').textContent = '等待 Apple 登录结果返回……';
  loginTimer = setTimeout(() => {
    if (!signedIn) {trace('45 秒后仍未收到登录确认'); $('cloud-status').textContent = '尚未收到登录确认，请展开登录诊断，检查有无 Apple 窗口消息。';}
  },45000);
},true);
function loadSDK() {if (window.CloudKit) return Promise.resolve(); return new Promise((resolve,reject) => {const script = document.createElement('script'); script.src = 'https://cdn.apple-cloudkit.com/ck/2/cloudkit.js'; script.onload = resolve; script.onerror = () => {script.remove(); reject(new Error('无法加载 Apple 登录服务，请检查网络'));}; document.head.append(script);});}
$('connect').onsubmit = e => {e.preventDefault(); run($('connect').querySelector('button'), async () => {
  await loadSDK();
  CloudKit.configure({containers:[{containerIdentifier:'iCloud.DAGTodo',environment:'development',apiTokenAuth:{apiToken:$('token').value.trim(),persist:false}}]});
  container = CloudKit.getDefaultContainer();
  $('token').value = '';
  trace('容器配置完成，检查当前会话');
  watchAuth(container,auth,authError);
  $('connect').querySelector('button').hidden = true;
  const initialSession = session;
  try {
    const user = await checkAuth(container);
    if (session === initialSession) auth(user);
  } catch(e) {if (session === initialSession) authError(e);}
});};
$('read').onclick = () => run($('read'), async () => {
  if (!signedIn) throw new Error('请先登录 iCloud');
  const currentSession = session;
  const db = container.privateCloudDatabase, response = checked(await db.fetchAllRecordZones());
  const zones = response.zones.filter(z => z.zoneID.zoneName.startsWith('com.apple.coredata.cloudkit'));
  if (!zones.length) throw new Error('尚未找到 App 的同步区域。请先在 App 创建任务并等待上传。');
  const results = [];
  for (const zone of zones) for (const record of await readZone(db,zone.zoneID)) results.push({record,zoneID:zone.zoneID});
  if (currentSession !== session || !signedIn) return;
  $('cloud-tasks').replaceChildren();
  $('diagnostics').textContent = JSON.stringify(results.map(({record,zoneID}) => ({zone:zoneID.zoneName,type:record.recordType,fields:Object.fromEntries(Object.entries(record.fields || {}).map(([name,field]) => [name,{type:field.type,valueKind:Array.isArray(field.value)?'array':typeof field.value}]))})),null,2);
  for (const {record,zoneID} of results.filter(r => r.record.recordType === 'CD_TaskRecord')) {
    const li = document.createElement('li'), title = document.createElement('span'); title.textContent = record.fields?.CD_title?.value || '标题位于 Asset 或缺失';
    li.append(title,button('验证修改标题', async () => {
      if (session !== currentSession || !signedIn) throw new Error('登录状态已变化，请重新读取');
      const value = prompt('输入测试标题，然后到 App 检查是否收到更新', record.fields?.CD_title?.value || ''); if (value === null) return;
      const update = titleUpdate(record,value);
      const saved = checked(await db.saveRecords(update,{zoneID})).records?.[0];
      if (!saved) throw new Error('未返回保存结果，请重新读取确认');
      if (session !== currentSession) return;
      Object.assign(record,saved); title.textContent = saved.fields?.CD_title?.value || value.trim(); message('云端已保存，请到 App 检查标题更新。若提示冲突，请重新读取后再修改。');
    })); $('cloud-tasks').append(li);
  }
  $('cloud-status').textContent = `读取到 ${results.filter(r => r.record.recordType === 'CD_TaskRecord').length} 个任务、${results.filter(r => r.record.recordType === 'CD_DependencyRecord').length} 个依赖记录`;
});
