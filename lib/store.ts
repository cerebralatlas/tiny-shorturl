import { kv } from '@vercel/kv';
import fs from 'fs/promises';
import path from 'path';

// Interface for URL data structure
export interface UrlData {
  url: string;
  createdAt: string;
  expiresAt?: string;
}

// Storage interface for abstraction
export interface StorageAdapter {
  save(code: string, data: UrlData): Promise<void>;
  get(code: string): Promise<UrlData | null>;
  exists(code: string): Promise<boolean>;
}

// Vercel KV storage adapter
class VercelKVAdapter implements StorageAdapter {
  private getKey(code: string): string {
    return `shorturl:${code}`;
  }

  async save(code: string, data: UrlData): Promise<void> {
    const key = this.getKey(code);
    await kv.set(key, data);
  }

  async get(code: string): Promise<UrlData | null> {
    const key = this.getKey(code);
    const data = await kv.get<UrlData>(key);
    return data;
  }

  async exists(code: string): Promise<boolean> {
    const key = this.getKey(code);
    const exists = await kv.exists(key);
    return exists === 1;
  }
}

// Local JSON file storage adapter for development
class LocalJSONAdapter implements StorageAdapter {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'urls.json');
  }

  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(this.dataPath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private async readData(): Promise<Record<string, UrlData>> {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      // File doesn't exist or is invalid, return empty object
      return {};
    }
  }

  private async writeData(data: Record<string, UrlData>): Promise<void> {
    await this.ensureDataDirectory();
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async save(code: string, data: UrlData): Promise<void> {
    const allData = await this.readData();
    allData[code] = data;
    await this.writeData(allData);
  }

  async get(code: string): Promise<UrlData | null> {
    const allData = await this.readData();
    return allData[code] || null;
  }

  async exists(code: string): Promise<boolean> {
    const allData = await this.readData();
    return code in allData;
  }
}

// Factory function to create the appropriate storage adapter
function createStorageAdapter(): StorageAdapter {
  // Use Vercel KV in production, local JSON in development
  if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
    return new VercelKVAdapter();
  }
  return new LocalJSONAdapter();
}

// Export singleton instance
export const storage = createStorageAdapter();

// Utility functions for common operations
export async function saveUrl(code: string, url: string): Promise<void> {
  const data: UrlData = {
    url,
    createdAt: new Date().toISOString(),
  };
  await storage.save(code, data);
}

export async function getUrl(code: string): Promise<string | null> {
  const data = await storage.get(code);
  return data?.url || null;
}

export async function urlExists(code: string): Promise<boolean> {
  return await storage.exists(code);
} 