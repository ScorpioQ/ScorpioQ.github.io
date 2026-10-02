export function checked(response) {
  if (response.hasErrors || response.errors?.length) throw new Error(response.errors?.map(e => e.reason || e.message || e.ckErrorCode).join('; ') || 'CloudKit 请求失败');
  return response;
}

export async function readZone(database, zoneID) {
  const records = new Map();
  let syncToken;
  do {
    const response = checked(await database.fetchRecordZoneChanges({zoneID, ...(syncToken ? {syncToken} : {})}));
    const zone = response.zones?.[0];
    if (!zone) throw new Error('CloudKit 没有返回记录区域');
    checked(zone);
    for (const record of zone.records || []) {
      if (record.deleted) records.delete(record.recordName);
      else records.set(record.recordName, record);
    }
    if (!zone.moreComing) break;
    if (!zone.syncToken || zone.syncToken === syncToken) throw new Error('CloudKit 分页令牌无效');
    syncToken = zone.syncToken;
  } while (true);
  return [...records.values()];
}

export function titleUpdate(record, title) {
  title = title.trim();
  if (!title || title.length > 500) throw new Error('标题须为 1–500 个字符');
  if (record.recordType !== 'CD_TaskRecord' || !record.recordChangeTag) throw new Error('记录类型或版本无效，请重新读取');
  if (record.fields?.CD_title_ckAsset?.value) throw new Error('此标题使用 Asset 存储，当前验证页不支持修改');
  // Only changed fields are sent; serialized tags and other Core Data fields remain untouched.
  return {recordName: record.recordName, recordType: record.recordType, recordChangeTag: record.recordChangeTag, fields:{CD_title:{value:title}}};
}

export function ready(task, graph) {
  return task.status === 'todo' && graph.dependencies.filter(e => e.dependentTaskID === task.id).every(e => graph.tasks.find(t => t.id === e.prerequisiteTaskID)?.status === 'completed');
}

export function watchAuth(container, onChange, onError) {
  // SDK replaces each deferred promise after an event; subscribe again after failure too.
  function watch(method, signedIn) {
    container[method]().then(user => {
      onChange(signedIn ? user : null);
      watch(method, signedIn);
    }, error => {
      onError(error);
      queueMicrotask(() => watch(method, signedIn));
    });
  }
  watch('whenUserSignsIn', true);
  watch('whenUserSignsOut', false);
}

export async function checkAuth(container, timeout = 15000) {
  let timer;
  try {
    return await Promise.race([
      container.setUpAuth(),
      new Promise((_, reject) => {timer = setTimeout(() => reject({ckErrorCode:'AUTH_CHECK_TIMEOUT'}),timeout);})
    ]);
  } finally {clearTimeout(timer);}
}

export function callerURL(apiToken, environment, session) {
  if (!['development','production'].includes(environment)) throw new Error('Invalid CloudKit environment');
  const url = new URL(`https://api.apple-cloudkit.com/database/1/iCloud.DAGTodo/${environment}/public/users/caller`);
  url.searchParams.set('ckAPIToken',apiToken);
  if (session) url.searchParams.set('ckWebAuthToken',session);
  return url;
}

export function callerConfirmed(result) {
  return Array.isArray(result.users) && result.users.length === 1 && typeof result.users[0]?.userRecordName === 'string' && result.users[0].userRecordName.length > 0;
}
