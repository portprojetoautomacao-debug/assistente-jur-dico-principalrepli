/**
 * Chroma Cloud Service - Semantic search on repo collection
 * Consulta a collection indexada do repositório no Chroma Cloud
 */

import { CloudClient, type Collection, type Where, type WhereDocument } from "chromadb";

function formatUnknownError(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function logInfo(message: string): void {
  process.stdout.write(`${message}\n`);
}

function logWarn(message: string, err?: unknown): void {
  const suffix = typeof err === "undefined" ? "" : `\n${formatUnknownError(err)}`;
  process.stderr.write(`${message}${suffix}\n`);
}

function logError(message: string, err?: unknown): void {
  const suffix = typeof err === "undefined" ? "" : `\n${formatUnknownError(err)}`;
  process.stderr.write(`${message}${suffix}\n`);
}

interface ChromaConfig {
  apiKey: string;
  tenant: string;
  database: string;
  collectionName: string;
}

interface SearchResult {
  id: string;
  document: string;
  metadata: Record<string, unknown>;
  distance: number;
}

interface SemanticSearchOptions {
  query: string;
  nResults?: number;
  whereMetadata?: Where;
  whereDocument?: WhereDocument;
}

class ChromaCloudService {
  private client: CloudClient | null = null;
  private collection: Collection | null = null;
  private config: ChromaConfig | null = null;
  private clientPromise: Promise<CloudClient> | null = null;
  private collectionPromise: Promise<Collection> | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const apiKey = process.env.CHROMA_API_KEY || process.env.CHROMA_CLOUD_API_KEY;
    const tenant = process.env.CHROMA_TENANT;
    const database = process.env.CHROMA_DATABASE;
    const collectionName = process.env.CHROMA_COLLECTION_NAME;

    if (!apiKey || !tenant || !database || !collectionName) {
      logWarn(
        "[Chroma Cloud] Missing configuration (CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE, CHROMA_COLLECTION_NAME). RAG disabled."
      );
      return;
    }

    this.config = {
      apiKey,
      tenant,
      database,
      collectionName,
    };

    logInfo(`[Chroma Cloud] Config loaded - DB: ${database}, Collection: ${collectionName}`);
  }

  private async ensureClient(): Promise<CloudClient> {
    if (!this.config) {
      throw new Error("Chroma Cloud not configured");
    }

    if (this.client) {
      return this.client;
    }

    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        try {
          const client = new CloudClient({
            apiKey: this.config!.apiKey,
            tenant: this.config!.tenant,
            database: this.config!.database,
          });
          this.client = client;
          logInfo("[Chroma Cloud] Client initialized");
          return client;
        } catch (err) {
          logError("[Chroma Cloud] Failed to initialize client:", err);
          throw err;
        } finally {
          // Permite retry após falha; evita travar em Promise rejeitada.
          this.clientPromise = null;
        }
      })();
    }

    return this.clientPromise;
  }

  private async ensureCollection(): Promise<Collection> {
    if (!this.config) {
      throw new Error("Chroma Cloud not configured");
    }

    if (this.collection) {
      return this.collection;
    }

    if (!this.collectionPromise) {
      this.collectionPromise = (async () => {
        const client = await this.ensureClient();
        try {
          const collection = await client.getCollection({
            name: this.config!.collectionName,
          });
          this.collection = collection;
          logInfo(`[Chroma Cloud] Collection "${this.config!.collectionName}" loaded`);
          return collection;
        } catch (err) {
          logError("[Chroma Cloud] Failed to get collection:", err);
          const error = new Error(`Collection "${this.config!.collectionName}" not found`);
          (error as unknown as { cause?: unknown }).cause = err;
          throw error;
        } finally {
          // Permite retry após falha; evita travar em Promise rejeitada.
          this.collectionPromise = null;
        }
      })();
    }

    return this.collectionPromise;
  }

  /**
   * Semantic search on repo collection
   */
  async search(options: SemanticSearchOptions): Promise<SearchResult[]> {
    const { query, nResults = 5, whereMetadata, whereDocument } = options;

    if (!this.config) {
      throw new Error(
        "Chroma Cloud not configured. Check CHROMA_API_KEY/CHROMA_TENANT/CHROMA_DATABASE."
      );
    }

    try {
      const collection = await this.ensureCollection();

      const result = await collection.query({
        queryTexts: [query],
        nResults,
        ...(whereMetadata ? { where: whereMetadata } : {}),
        ...(whereDocument ? { whereDocument } : {}),
      });

      if (!result.ids || !result.ids[0] || result.ids[0].length === 0) {
        return [];
      }

      const results: SearchResult[] = [];
      for (let i = 0; i < result.ids[0].length; i++) {
        results.push({
          id: result.ids[0][i],
          document: result.documents[0]?.[i] || "",
          metadata: (result.metadatas[0]?.[i] as Record<string, unknown>) || {},
          distance: result.distances?.[0]?.[i] ?? 1.0,
        });
      }

      logInfo(`[Chroma Cloud] Search returned ${results.length} results for: "${query}"`);
      return results;
    } catch (err) {
      logError("[Chroma Cloud] Search error:", err);
      throw err;
    }
  }

  /**
   * List all collections (for debugging)
   */
  async listCollections(): Promise<string[]> {
    try {
      const client = await this.ensureClient();
      const collections = await client.listCollections();
      return collections.map((c: Collection) => c.name);
    } catch (err) {
      logError("[Chroma Cloud] Failed to list collections:", err);
      return [];
    }
  }

  /**
   * Get collection count (if available)
   */
  async getCollectionCount(): Promise<number> {
    try {
      const collection = await this.ensureCollection();
      const count = await collection.count();
      return count;
    } catch (err) {
      logWarn("[Chroma Cloud] Failed to get collection count:", err);
      return 0;
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }
}

// Singleton
export const chromaCloud = new ChromaCloudService();
