import { atomicWriteJson } from './atomicWrite.ts';
import { withFileLock } from './mutex.ts';

export async function readJson<T>(path: string): Promise<T | null> {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  try {
    const text = await file.text();
    if (text.trim().length === 0) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Failed to parse JSON at ${path}: ${(err as Error).message}`);
  }
}

export function writeJson(path: string, value: unknown): Promise<void> {
  return withFileLock(path, () => atomicWriteJson(path, value));
}

export function deleteFile(path: string): Promise<void> {
  return withFileLock(path, async () => {
    const file = Bun.file(path);
    if (await file.exists()) {
      await Bun.write(path, '');
      await Bun.$`rm -f ${path}`.quiet();
    }
  });
}
