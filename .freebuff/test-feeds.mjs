import { fetchAllSources, fetchSource } from '../src/lib/feeds/index.ts';
import { SOURCES } from '../src/lib/sources.ts';

async function main() {
  const start = Date.now();
  const map = await fetchAllSources([]);
  const results = SOURCES.map((s) => ({
    id: s.id,
    count: (map.get(s.id) || []).length,
    ok: (map.get(s.id) || []).length > 0,
  }));
  const failed = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok);
  console.log('Total sources:', SOURCES.length);
  console.log('OK:', ok.length, 'Failed:', failed.length);
  if (failed.length) {
    console.log('Failed IDs:', failed.map((f) => f.id).join(', '));
    for (const f of failed) {
      try {
        await fetchSource(f.id);
      } catch (e) {
        console.log('  ', f.id, ':', e.message);
      }
    }
  }
  console.log('Total items:', ok.reduce((a, r) => a + r.count, 0));
  console.log('Time ms:', Date.now() - start);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
