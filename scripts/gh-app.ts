/*
  GitHub App helper: create installation token and manage PRs.
  Usage:
    GITHUB_APP_ID=2242493 \
    GITHUB_APP_PRIVATE_KEY="$(cat ./app.pem)" \
    node --loader ts-node/esm scripts/gh-app.ts create-pr hilbertp/aptum-web feat/scaffold-mvp main "APTUM MVP scaffold" "Initial scaffold, GIS onboarding, weekly overview"

  Or compile with ts-node/register or transpile to JS and run with node.
*/

import jwt from 'jsonwebtoken';

type JWTHeader = { alg: 'RS256'; typ: 'JWT' };
type JWTPayload = { iat: number; exp: number; iss: string };

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJWT(appId: string, privateKeyPem: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = { iat: now - 60, exp: now + 9 * 60, iss: appId };
  return jwt.sign(payload as any, privateKeyPem, { algorithm: 'RS256' });
}

async function ghAppFetch(url: string, opts: any) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...opts.headers
    }
  } as any);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${t}`);
  }
  return res.json();
}

async function getInstallationId(jwt: string, repo: string) {
  const [owner, name] = repo.split('/');
  const data = await ghAppFetch(`https://api.github.com/repos/${owner}/${name}/installation`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${jwt}` }
  });
  return (data as any).id as number;
}

async function createInstallationToken(jwt: string, installationId: number) {
  const data = await ghAppFetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` }
  });
  return (data as any).token as string;
}

async function createPR(token: string, repo: string, head: string, base: string, title: string, body: string) {
  const [owner, name] = repo.split('/');
  const data = await ghAppFetch(`https://api.github.com/repos/${owner}/${name}/pulls`, {
    method: 'POST',
    headers: { Authorization: `token ${token}` },
    body: JSON.stringify({ title, head, base, body })
  });
  return (data as any).number as number;
}

async function mergePR(token: string, repo: string, prNumber: number, method: 'squash' | 'merge' | 'rebase' = 'squash') {
  const [owner, name] = repo.split('/');
  const data = await ghAppFetch(`https://api.github.com/repos/${owner}/${name}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}` },
    body: JSON.stringify({ merge_method: method })
  });
  return data;
}

async function main() {
  const [cmd, repo, head, base, title, body] = process.argv.slice(2);
  const appId = process.env.GITHUB_APP_ID || process.env.APP_ID || '';
  const pk = process.env.GITHUB_APP_PRIVATE_KEY || '';

  if (!appId || !pk) {
    console.error('Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY');
    process.exit(1);
  }

  const jwt = signJWT(appId, pk);
  const installationId = await getInstallationId(jwt, repo);
  const token = await createInstallationToken(jwt, installationId);

  if (cmd === 'create-pr') {
    const number = await createPR(token, repo, head!, base!, title!, body || '');
    console.log(`PR #${number} created`);
    return;
  }
  if (cmd === 'merge-pr') {
    const prNumber = Number(head); // we pass PR number in head position for this command
    const method = (base as any) || 'squash';
    const res = await mergePR(token, repo, prNumber, method);
    console.log(`Merged: ${JSON.stringify(res)}`);
    return;
  }
  console.error('Unknown command');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
