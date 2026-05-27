import { rename, unlink } from 'node:fs/promises';

export async function atomicWriteJson(path: string, value: unknown): Promise<void> {
  const tmp = `${path}.tmp`;
  await Bun.write(tmp, JSON.stringify(value, null, 2));
  try {
    await rename(tmp, path);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}
