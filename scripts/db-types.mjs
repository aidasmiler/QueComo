// Regenerates src/lib/supabase/database.types.ts.
//   Local (Docker running):       npm run db:types
//   Remote test project (no Docker): SUPABASE_PROJECT_REF=<ref> SUPABASE_ACCESS_TOKEN=<token> npm run db:types
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ref = process.env.SUPABASE_PROJECT_REF;
const args = [
  'supabase',
  'gen',
  'types',
  'typescript',
  ...(ref ? ['--project-id', ref] : ['--local']),
  '--schema',
  'public',
];
const result = spawnSync('npx', args, { encoding: 'utf8', shell: process.platform === 'win32' });
if (result.status !== 0) {
  console.error(result.stderr || 'Type generation failed.');
  process.exit(result.status ?? 1);
}
writeFileSync('src/lib/supabase/database.types.ts', result.stdout);
console.log('✓ src/lib/supabase/database.types.ts updated');
