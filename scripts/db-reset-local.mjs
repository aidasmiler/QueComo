// Resets ONLY the local Supabase database (Docker). Refuses to run against a linked/remote project.
import { spawnSync } from 'node:child_process';

const forbidden = ['--linked', '--db-url', '--project-ref'];
if (process.argv.slice(2).some((arg) => forbidden.some((f) => arg.startsWith(f)))) {
  console.error('✗ db:reset only works on the local database. Remote resets are not allowed.');
  process.exit(1);
}
const status = spawnSync('npx', ['supabase', 'status'], {
  stdio: 'pipe',
  shell: process.platform === 'win32',
});
if (status.status !== 0) {
  console.error(
    '✗ Local Supabase is not running. Start it with `npm run db:start` (requires Docker).',
  );
  process.exit(1);
}
const reset = spawnSync('npx', ['supabase', 'db', 'reset', '--local'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(reset.status ?? 1);
