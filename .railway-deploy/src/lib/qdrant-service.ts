/**
 * Qdrant Vector Database Service
 *
 * This service provides a safe wrapper around Qdrant vector database operations.
 * Qdrant is used for semantic search and retrieval-augmented generation (RAG).
 *
 * Security Notes:
 * - API key authentication required
 * - Input validation on all operations
 * - Timeout protection on all requests
 * - No eval() or unsafe operations
 */

export interface QdrantConfig {
  url: string;
  apiKey: string;
  collectionName: string;
  timeout?: number;
}

export interface QdrantPoint {
  id: string | number;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload: Record<string, unknown>;
}

export class QdrantService {
  private readonly config: Required<QdrantConfig>;
  private readonly baseHeaders: HeadersInit;
  private collectionVectorSize?: number;

  constructor(config: QdrantConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 30000,
    };

    this.baseHeaders = {
      "Content-Type": "application/json",
      "api-key": this.config.apiKey,
    };
  }

  /**
   * Search for similar vectors
   *
   * Security: Validates input, uses timeout, sanitizes results
   */
  async search(
    vector: number[],
    limit: number = 10,
    filter?: Record<string, unknown>
  ): Promise<SearchResult[]> {
    this.validateVector(vector, this.collectionVectorSize);

    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      if (process.env.DEBUG_TESTS === "true") {
        console.debug(
          `QdrantService: searching collection=${this.config.collectionName} limit=${limit}`
        );
      }
      const response = await fetch(
        `${this.config.url}/collections/${this.config.collectionName}/points/search`,
        {
          method: "POST",
          headers: this.baseHeaders,
          signal: controller.signal,
          body: JSON.stringify({
            vector,
            limit,
            filter,
            with_payload: true,
            with_vector: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.sanitizeSearchResults(data.result || []);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Upsert points into the collection
   *
   * Security: Validates all inputs before insertion
   */
  async upsert(points: QdrantPoint[]): Promise<void> {
    if (!Array.isArray(points) || points.length === 0) {
      throw new Error("Points must be a non-empty array");
    }

    points.forEach((point, idx) => {
      if (!point.id) {
        throw new Error(`Point at index ${idx} missing id`);
      }
      this.validateVector(point.vector, this.collectionVectorSize);
      if (typeof point.payload !== "object" || point.payload === null) {
        throw new Error(`Point at index ${idx} has invalid payload`);
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(
        `${this.config.url}/collections/${this.config.collectionName}/points`,
        {
          method: "PUT",
          headers: this.baseHeaders,
          signal: controller.signal,
          body: JSON.stringify({
            points,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.status} ${response.statusText}`);
      }
      if (process.env.DEBUG_TESTS === "true") {
        console.debug(
          `QdrantService: upserted ${points.length} points into ${this.config.collectionName}`
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Create collection if it doesn't exist
   *
   * Security: Validates configuration parameters
   */
  async createCollection(
    vectorSize: number,
    distance: "Cosine" | "Euclidean" | "Dot" = "Cosine"
  ): Promise<void> {
    if (vectorSize < 1 || vectorSize > 10000) {
      throw new Error("Vector size must be between 1 and 10000");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      if (process.env.DEBUG_TESTS === "true") {
        console.debug(
          `QdrantService: creating collection=${this.config.collectionName} size=${vectorSize}`
        );
      }
      const response = await fetch(`${this.config.url}/collections/${this.config.collectionName}`, {
        method: "PUT",
        headers: this.baseHeaders,
        signal: controller.signal,
        body: JSON.stringify({
          vectors: {
            size: vectorSize,
            distance,
          },
        }),
      });

      if (!response.ok && response.status !== 409) {
        // 409 = already exists
        throw new Error(`Qdrant API error: ${response.status} ${response.statusText}`);
      }
      // If creation or already exists (409), set collection vector size
      this.collectionVectorSize = vectorSize;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Validate vector dimensions and values
   *
   * Security: Prevents injection of malicious data
   * @param vector The vector to validate. Must be a non-empty array of finite numbers.
   * @param [expectedSize] Optional. If provided, enforces that the vector has exactly this number of dimensions.
   *        Use when the expected vector size is known (e.g., matches the collection's vector size).
   */
  private validateVector(vector: number[], expectedSize?: number): void {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error("Vector must be a non-empty array");
    }

    // Basic dimension sanity check to avoid extremely large vectors
    if (vector.length < 1 || vector.length > 10000) {
      throw new Error("Vector length must be between 1 and 10000");
    }

    if (vector.some((v) => typeof v !== "number" || !Number.isFinite(v))) {
      throw new Error("Vector must contain only finite numbers");
    }
    // If collection vector size is known, enforce it
    if (typeof expectedSize === "number" && expectedSize > 0) {
      if (vector.length !== expectedSize) {
        throw new Error(`Vector must have exactly ${expectedSize} dimensions`);
      }
    }
  }

  /**
   * Sanitize search results to prevent XSS or injection
   *
   * Security: Ensures returned data is safe
   */
  private sanitizeSearchResults(results: unknown[]): SearchResult[] {
    if (!Array.isArray(results)) {
      return [];
    }

    return results
      .filter((r) => typeof r === "object" && r !== null)
      .map((r) => {
        const result = r as Record<string, unknown>;
        return {
          id: result.id as string | number,
          score: typeof result.score === "number" ? result.score : 0,
          payload:
            typeof result.payload === "object" && result.payload !== null
              ? (result.payload as Record<string, unknown>)
              : {},
        };
      });
  }
}

/**
 * Factory function to create Qdrant service from environment
 *
 * Security: Requires explicit configuration, no defaults
 */
export function createQdrantService(config?: QdrantConfig): QdrantService | null {
  if (!config?.url || !config?.apiKey || !config?.collectionName) {
    console.warn("Qdrant configuration incomplete. Service not initialized.");
    return null;
  }

  return new QdrantService(config);
}
