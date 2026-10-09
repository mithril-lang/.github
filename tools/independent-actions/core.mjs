import {createHash, createHmac, timingSafeEqual} from 'node:crypto';

export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const revision = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
export function adapter(repository, controllerRevision, entry) {
  if (!revision(controllerRevision) && !(repository === 'mithril-lang/.github' && controllerRevision === 'self')) throw Error('Immutable controller revision required');
  return {schemaVersion:1, provider:'mithril-independent-actions', repository,
    controller:{repository:'mithril-lang/.github', revision:controllerRevision, entrypoint:'tools/independent-actions/cli.mjs'},
    profile:entry.profile, scope:entry.scope, state:entry.state, release:entry.release};
}
export function validateAdapter(value, repository, controllerRevision, entry) {
  const expected = adapter(repository, repository === 'mithril-lang/.github' ? 'self' : controllerRevision, entry);
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw Error('Adapter differs from pinned organization policy; regenerate with adapter command');
  return expected;
}
export function originRepository(origin) {
  const match = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)(mithril-lang\/[\w.-]+?)(?:\.git)?$/.exec(origin);
  if (!match) throw Error('Expected Mithril organization origin');
  return match[1];
}
export const quote = value => `'${String(value).replaceAll("'", "'\\''")}'`;
export function transport(host, args) {
  if (!host) return ['docker', args];
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,100}$/.test(host)) throw Error('Invalid SSH host alias');
  return ['ssh', ['-o','BatchMode=yes',host, ['docker',...args].map(quote).join(' ')]];
}
export function seal(receipt, key) {
  return {receipt, signature:createHmac('sha256',key).update(JSON.stringify(receipt)).digest('hex')};
}
export function verify(envelope, key, identity, now = Date.now()) {
  const expected = seal(envelope.receipt,key).signature;
  const actual = envelope.signature;
  if (typeof actual !== 'string' || !/^[a-f0-9]{64}$/.test(actual) || !timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'))) throw Error('Receipt signature invalid');
  for (const [name,value] of Object.entries(identity)) if (JSON.stringify(envelope.receipt[name]) !== JSON.stringify(value)) throw Error(`Receipt identity mismatch: ${name}`);
  const at = Date.parse(envelope.receipt.finishedAt);
  if (!Number.isFinite(at) || now < at || now-at > 86400000 || envelope.receipt.status !== 'success') throw Error('Receipt stale or unsuccessful');
  return envelope.receipt;
}
export function executable(entry) {
  if (entry.state !== 'prepared' || entry.setup.some(step => step !== 'npm ci --ignore-scripts --no-audit --no-fund') || !entry.steps.length || !/^(node|python)@sha256:[a-f0-9]{64}$/.test(entry.image)) throw Error(`Profile held: ${entry.state}; ${entry.requiredRuntime.join('; ')}`);
}
