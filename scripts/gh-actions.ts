import jwt from 'jsonwebtoken';

type JWTPayload = { iat: number; exp: number; iss: string };

function signJWT(appId: string, privateKeyPem: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = { iat: now - 60, exp: now + 9 * 60, iss: appId };
  return jwt.sign(payload as any, privateKeyPem, { algorithm: 'RS256' });
}

async function ghFetch(url: string, init: any) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init.headers
    }
  } as any);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const [repo] = process.argv.slice(2);
  const appId = process.env.GITHUB_APP_ID || process.env.GHA_APP_ID || '';
  const pk = process.env.GITHUB_APP_PRIVATE_KEY || process.env.GHA_APP_PRIVATE_KEY || '';
  if (!repo || !appId || !pk) throw new Error('Missing args or env: repo, GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY');

  const jwtToken = signJWT(appId, pk);
  const [owner, name] = repo.split('/');
  const installation: any = await ghFetch(`https://api.github.com/repos/${owner}/${name}/installation`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${jwtToken}` }
  });
  const tokenRes: any = await ghFetch(`https://api.github.com/app/installations/${installation.id}/access_tokens`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwtToken}` }
  });
  const token = tokenRes.token;

  const runs: any = await ghFetch(`https://api.github.com/repos/${owner}/${name}/actions/runs?per_page=5`, {
    method: 'GET',
    headers: { Authorization: `token ${token}` }
  });
  const latest = runs.workflow_runs?.[0];
  if (!latest) throw new Error('No runs');
  const jobs: any = await ghFetch(`https://api.github.com/repos/${owner}/${name}/actions/runs/${latest.id}/jobs`, {
    method: 'GET',
    headers: { Authorization: `token ${token}` }
  });
  const job = jobs.jobs?.[0];
  let logsSnippet = '';
  if (job) {
    const logRes = await fetch(`https://api.github.com/repos/${owner}/${name}/actions/jobs/${job.id}/logs`, {
      method: 'GET',
      headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github+json' }
    } as any);
    if (logRes.ok) {
      const txt = await logRes.text();
      logsSnippet = txt.split('\n').slice(-50).join('\n');
    }
  }
  console.log(JSON.stringify({ run: { id: latest.id, status: latest.status, conclusion: latest.conclusion, head_branch: latest.head_branch }, jobs, logsSnippet }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
