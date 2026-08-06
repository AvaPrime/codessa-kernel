/**
 * Codessa Kernel — Schema Validator Loader
 *
 * Responsibility: convert raw bytes into an in-memory representation.
 * Platform-neutral. No validation logic.
 */

import type { Digest } from "../common/replay";
import type { ArtifactRef, SchemaRef } from "../common/types";

/**
 * Loaded content with its content-addressable digest.
 * Digest is computed over the exact bytes that will be validated.
 */
export interface LoadedContent {
  readonly ref: ArtifactRef | SchemaRef;
  readonly bytes: Uint8Array;
  readonly digest: Digest;
  readonly text: string; // UTF-8 decoded view (for JSON/YAML parsing)
}

/**
 * Minimal loader interface.
 * Concrete loaders (filesystem, Git blob, memory, HTTP) implement this.
 * The Schema Validator never talks to storage directly.
 */
export interface ContentLoader {
  load(ref: string): Promise<LoadedContent> | LoadedContent;
}

/**
 * In-memory loader for tests and pure execution.
 * Accepts a map of ref → bytes.
 */
export class MemoryLoader implements ContentLoader {
  constructor(private readonly store: ReadonlyMap<string, Uint8Array>) {}

  load(ref: string): LoadedContent {
    const bytes = this.store.get(ref);
    if (!bytes) {
      throw new Error(`Content not found for ref: ${ref}`);
    }

    // Simple SHA-256 would be ideal; for platform neutrality we expose
    // a pure digest helper that the host can replace.
    const digest = computeDigest(bytes);

    return {
      ref,
      bytes,
      digest,
      text: new TextDecoder("utf-8").decode(bytes),
    };
  }
}

/**
 * Platform-neutral digest helper.
 * Hosts should replace this with a cryptographically secure implementation
 * (Web Crypto, Node crypto, etc.). For the contract we require only that
 * identical bytes produce identical digests.
 */
export function computeDigest(bytes: Uint8Array): Digest {
  // Minimal deterministic placeholder suitable for tests.
  // Production hosts must inject a real SHA-256 (or stronger) implementation.
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = (hash * 31 + bytes[i]) >>> 0;
  }
  return {
    algorithm: "placeholder-32bit",
    value: hash.toString(16).padStart(8, "0"),
  };
}
