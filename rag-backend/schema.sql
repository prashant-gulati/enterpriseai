-- Run this in your Supabase SQL Editor before starting the backend
-- Dashboard → SQL Editor → New query → paste this → Run

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create chunks table
--    gemini-embedding-001 produces 3072-dimensional embeddings
CREATE TABLE IF NOT EXISTS rag_chunks (
  id          BIGSERIAL PRIMARY KEY,
  doc_id      TEXT        NOT NULL,
  filename    TEXT        NOT NULL,
  chunk_index INTEGER     NOT NULL,
  content     TEXT        NOT NULL,
  embedding   VECTOR(3072),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx
  ON rag_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Index on doc_id for filtered searches
CREATE INDEX IF NOT EXISTS rag_chunks_doc_id_idx ON rag_chunks (doc_id);

-- 5. Similarity search RPC function
CREATE OR REPLACE FUNCTION match_rag_chunks(
  query_embedding  VECTOR(3072),
  match_count      INT     DEFAULT 5,
  filter_doc_ids   TEXT[]  DEFAULT NULL
)
RETURNS TABLE (
  id          BIGINT,
  doc_id      TEXT,
  filename    TEXT,
  chunk_index INT,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.doc_id,
    rc.filename,
    rc.chunk_index,
    rc.content,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM rag_chunks rc
  WHERE (filter_doc_ids IS NULL OR rc.doc_id = ANY(filter_doc_ids))
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
