/**
 * RAG (Retrieval-Augmented Generation) Router
 * Semantic search on repo collection (Chroma Cloud)
 */

import type { Where, WhereDocument } from "chromadb";
import express from "express";
import { chromaCloud } from "../services/chroma-cloud.js";

const router = express.Router();

/**
 * GET /api/rag/search
 * Query: ?q=<query>&k=<nResults>&where=<metadata_filter>&where_doc=<doc_filter>
 *
 * Examples:
 * - /api/rag/search?q=health check endpoint&k=3
 * - /api/rag/search?q=djen scheduler&k=5
 */
router.get("/search", async (req, res) => {
  try {
    if (!chromaCloud.isConfigured()) {
      return res.status(503).json({
        error: "RAG service not configured",
        message:
          "Chroma Cloud credentials missing. Check CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE.",
      });
    }

    const query = req.query.q as string;
    const k = parseInt((req.query.k as string) || "5", 10);

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Missing or empty query parameter 'q'" });
    }

    if (isNaN(k) || k < 1 || k > 100) {
      return res.status(400).json({
        error: "Invalid 'k' parameter",
        message: "'k' must be a number between 1 and 100",
      });
    }

    // Optional metadata filter (JSON string)
    let whereMetadata: Where | undefined;
    if (req.query.where && typeof req.query.where === "string") {
      try {
        whereMetadata = JSON.parse(req.query.where) as Where;
      } catch {
        return res.status(400).json({ error: "Invalid JSON in 'where' parameter" });
      }
    }

    // Optional document filter (JSON string)
    let whereDocument: WhereDocument | undefined;
    if (req.query.where_doc && typeof req.query.where_doc === "string") {
      try {
        whereDocument = JSON.parse(req.query.where_doc) as WhereDocument;
      } catch {
        return res.status(400).json({ error: "Invalid JSON in 'where_doc' parameter" });
      }
    }

    const results = await chromaCloud.search({
      query: query.trim(),
      nResults: k,
      whereMetadata,
      whereDocument,
    });

    return res.json({
      query: query.trim(),
      results,
      count: results.length,
    });
  } catch (err) {
    console.error("[RAG] Search error:", err);
    const error = err as Error;
    return res.status(500).json({
      error: "Search failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/rag/status
 * Check if RAG service is configured and working
 */
router.get("/status", async (_req, res) => {
  try {
    if (!chromaCloud.isConfigured()) {
      return res.json({
        configured: false,
        message: "Chroma Cloud not configured",
      });
    }

    const collections = await chromaCloud.listCollections();
    const count = await chromaCloud.getCollectionCount();

    return res.json({
      configured: true,
      collections,
      activeCollection: process.env.CHROMA_COLLECTION_NAME || collections[0] || null,
      documentCount: count,
    });
  } catch (err) {
    console.error("[RAG] Status error:", err);
    const error = err as Error;
    return res.status(500).json({
      error: "Failed to get status",
      message: error.message,
    });
  }
});

export default router;
