import { execSync } from "node:child_process";

const SYNC_BASE_URL = "https://sync.trychroma.com";

function getEnv(name, { required = false } = {}) {
  const value = process.env[name];
  if (required && (!value || value.trim().length === 0)) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value?.trim();
}

function getFirstEnv(names, { required = false } = {}) {
  for (const name of names) {
    const value = getEnv(name);
    if (value) return value;
  }
  if (required) {
    throw new Error(`Missing required env var: one of ${names.join(", ")}`);
  }
  return null;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseCsvGlobs(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function inferGithubRepoFromGitRemote() {
  try {
    const originUrl = execSync("git config --get remote.origin.url", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 5000,
    }).trim();

    // Supports:
    // - https://github.com/owner/repo(.git)
    // - git@github.com:owner/repo(.git)
    const httpsMatch = originUrl.match(/^https?:\/\/github\.com\/(.+?)(?:\.git)?$/i);
    if (httpsMatch?.[1]) return httpsMatch[1];

    const sshMatch = originUrl.match(/^git@github\.com:(.+?)(?:\.git)?$/i);
    if (sshMatch?.[1]) return sshMatch[1];

    return null;
  } catch {
    return null;
  }
}

async function chromaFetch(path, { method = "GET", token, body } = {}) {
  const url = new URL(path, SYNC_BASE_URL);
  const headers = {
    "content-type": "application/json",
    "x-chroma-token": token,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const json = safeJsonParse(text);

  if (!res.ok) {
    const message = json?.error ?? json?.message ?? text ?? `HTTP ${res.status}`;
    const hint =
      res.status === 401
        ? " (401 Unauthorized: token inválido. Gere um novo token no Chroma Cloud e atualize CHROMA_SYNC_TOKEN.)"
        : "";
    const err = new Error(`Chroma Sync API error (${res.status}): ${message}${hint}`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json ?? {};
}

async function findExistingGithubSourceId({ token, repository, databaseName } = {}) {
  const params = new URLSearchParams();
  params.set("source_type", "github");
  params.set("github.repository", repository);
  if (databaseName) params.set("database_name", databaseName);

  const data = await chromaFetch(`/api/v1/sources?${params.toString()}`, { token });
  const sources = Array.isArray(data?.sources) ? data.sources : [];
  const match = sources.find((s) => s?.github?.repository === repository);
  return match?.id ?? null;
}

async function ensureGithubSource({
  token,
  databaseName,
  embeddingModel,
  repository,
  includeGlobs,
  appId,
} = {}) {
  try {
    const body = {
      database_name: databaseName,
      embedding: {
        dense: {
          model: embeddingModel,
        },
      },
      github: {
        repository,
        ...(appId ? { app_id: appId } : {}),
        ...(includeGlobs.length > 0 ? { include_globs: includeGlobs } : {}),
      },
    };

    const created = await chromaFetch("/api/v1/sources", {
      method: "POST",
      token,
      body,
    });

    if (!created?.id) {
      throw new Error("Chroma Sync: source created but no id returned.");
    }

    return created.id;
  } catch (err) {
    // If it already exists, the API typically returns a conflict.
    if (err?.status === 409) {
      const existingId = await findExistingGithubSourceId({ token, repository, databaseName });
      if (existingId) return existingId;
    }
    throw err;
  }
}

async function createInvocation({ token, sourceId, targetCollectionName, refBranch, refSha } = {}) {
  const ref_identifier = refSha
    ? { sha: refSha }
    : {
        branch: refBranch,
      };

  return chromaFetch(`/api/v1/sources/${encodeURIComponent(sourceId)}/invocations`, {
    method: "POST",
    token,
    body: {
      target_collection_name: targetCollectionName,
      ref_identifier,
    },
  });
}

async function getInvocation({ token, sourceId, invocationId } = {}) {
  return chromaFetch(
    `/api/v1/sources/${encodeURIComponent(sourceId)}/invocations/${encodeURIComponent(invocationId)}`,
    { token }
  );
}

function parseArgs(argv) {
  const args = new Set(argv);
  const get = (name) => {
    const idx = argv.indexOf(name);
    if (idx === -1) return null;
    return argv[idx + 1] ?? null;
  };

  return {
    wait: args.has("--wait"),
    repo: get("--repo"),
    branch: get("--branch"),
    sha: get("--sha"),
    database: get("--database"),
    collection: get("--collection"),
    include: get("--include"),
    appId: get("--app-id"),
    embeddingModel: get("--embedding-model"),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  // Aceita aliases para reduzir confusão em ambientes diferentes.
  // CHROMA_API_KEY é para consultas ao banco (Chroma Cloud API) e NÃO é o token do Sync.
  const token = getFirstEnv(["CHROMA_SYNC_TOKEN", "CHROMA_SYNC_API_KEY", "CHROMA_SYNC_KEY"], {
    required: true,
  });
  const databaseName = args.database ?? getEnv("CHROMA_SYNC_DATABASE_NAME", { required: true });
  const embeddingModel =
    args.embeddingModel ?? getEnv("CHROMA_SYNC_EMBEDDING_MODEL") ?? "Qwen/Qwen3-Embedding-0.6B";

  const repoFromEnv = args.repo ?? getEnv("CHROMA_SYNC_GITHUB_REPOSITORY");
  const repository = repoFromEnv ?? inferGithubRepoFromGitRemote();
  if (!repository) {
    throw new Error(
      "Missing GitHub repository. Provide CHROMA_SYNC_GITHUB_REPOSITORY or pass --repo owner/repo."
    );
  }

  const targetCollectionName =
    args.collection ?? getEnv("CHROMA_SYNC_TARGET_COLLECTION") ?? "repo-main";
  const refBranch = args.branch ?? getEnv("CHROMA_SYNC_REF_BRANCH") ?? "main";
  const refSha = args.sha ?? null;

  const includeGlobs = parseCsvGlobs(args.include ?? getEnv("CHROMA_SYNC_INCLUDE_GLOBS"));
  const appId = args.appId ?? getEnv("CHROMA_SYNC_GITHUB_APP_ID");

  console.log("Chroma Sync: ensuring source...");
  console.log(`- database: ${databaseName}`);
  console.log(`- repository: ${repository}`);
  console.log(`- embedding model: ${embeddingModel}`);
  if (includeGlobs.length > 0) console.log(`- include_globs: ${includeGlobs.length} pattern(s)`);
  if (appId) console.log("- github app_id: [set]");

  const sourceId = await ensureGithubSource({
    token,
    databaseName,
    embeddingModel,
    repository,
    includeGlobs,
    appId,
  });

  console.log(`Chroma Sync: source id = ${sourceId}`);

  console.log("Chroma Sync: creating invocation...");
  const invocation = await createInvocation({
    token,
    sourceId,
    targetCollectionName,
    refBranch,
    refSha,
  });

  const invocationId = invocation?.id;
  if (!invocationId) {
    throw new Error("Chroma Sync: invocation created but no id returned.");
  }

  console.log(`Chroma Sync: invocation id = ${invocationId}`);

  if (!args.wait) {
    console.log("Chroma Sync: started (use --wait to poll until completion). ");
    return;
  }

  console.log("Chroma Sync: waiting...");
  for (;;) {
    const current = await getInvocation({ token, sourceId, invocationId });
    const status = current?.status ?? "unknown";
    console.log(`- status: ${status}`);

    if (status === "completed" || status === "failed") {
      if (status === "failed") {
        const reason = current?.error ?? current?.message;
        throw new Error(`Chroma Sync: invocation failed${reason ? `: ${reason}` : "."}`);
      }
      break;
    }

    // 5s polling
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log("Chroma Sync: completed.");
}

main().catch((err) => {
  console.error(err?.message ?? String(err));
  process.exitCode = 1;
});
