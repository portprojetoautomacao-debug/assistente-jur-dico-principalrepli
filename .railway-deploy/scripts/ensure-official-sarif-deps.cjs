#!/usr/bin/env node
/*
 * Script to ensure official SARIF converter packages are installed and
 * optionally remove in-repo fallbacks when official packages are present.
 * Usage:
 *   node ./scripts/ensure-official-sarif-deps.cjs          # dry-run report
 *   node ./scripts/ensure-official-sarif-deps.cjs --apply  # apply changes and run npm install
 *
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OFFICIAL_PKGS = [
  { name: "@microsoft/tsc-sarif", bin: "tsc-sarif" },
  { name: "vitest-sarif-reporter", bin: "vitest-sarif-reporter" },
];

function npmViewVersion(pkg) {
  try {
    const r = spawnSync("npm", ["view", pkg, "version"], { encoding: "utf8" });
    if (r.status !== 0) return null;
    const ver = (r.stdout || "").trim();
    return ver || null;
  } catch (e) {
    return null;
  }
}

function addDevDeps(mods) {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const pkgData = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  pkgData.devDependencies = pkgData.devDependencies || {};
  let changed = false;
  for (const { name, version } of mods) {
    if (!pkgData.devDependencies[name]) {
      pkgData.devDependencies[name] = `^${version}`;
      changed = true;
      console.log(`Will add devDependency ${name}@^${version}`);
    } else {
      console.log(`devDependency ${name} already present as ${pkgData.devDependencies[name]}`);
    }
  }
  if (changed) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkgData, null, 2) + "\n");
    return true;
  }
  return false;
}

function removeLocalConverters() {
  const files = [
    path.resolve(process.cwd(), "scripts/tsc-to-sarif.cjs"),
    path.resolve(process.cwd(), "scripts/vitest-to-sarif.cjs"),
  ];
  for (const f of files) {
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
        console.log(`Removed local converter: ${f}`);
      } catch (e) {
        console.error("Failed to remove", f, e.message);
      }
    }
  }
}

function updatePackageScriptsUseOfficial() {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const pkgData = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  let changed = false;
  if (pkgData.scripts["tsc:sarif"]) {
    const newVal = "@microsoft/tsc-sarif --out tsc-results.sarif";
    if (!pkgData.scripts["tsc:sarif"].includes("@microsoft/tsc-sarif")) {
      pkgData.scripts["tsc:sarif"] = `npx ${newVal}`;
      changed = true;
      console.log("Update tsc:sarif script to use official @microsoft/tsc-sarif");
    }
  }
  if (pkgData.scripts["test:sarif"]) {
    const newVal = "vitest-sarif-reporter --out vitest-results.sarif";
    if (!pkgData.scripts["test:sarif"].includes("vitest-sarif-reporter")) {
      pkgData.scripts["test:sarif"] =
        `bash -lc \"npx ${newVal} || (vitest run --reporter json > vitest-results.json && node ./scripts/vitest-to-sarif.cjs)\"`;
      changed = true;
      console.log("Updated test:sarif to prefer vitest-sarif-reporter");
    }
  }
  if (changed) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkgData, null, 2) + "\n");
  }
  return changed;
}

function runNpmInstall() {
  console.log("Running npm install to update package-lock...");
  const r = spawnSync("npm", ["install"], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("npm install failed");
}

function commitChanges() {
  const r1 = spawnSync("git", ["add", "package.json", "package-lock.json"], { stdio: "inherit" });
  if (r1.status !== 0) throw new Error("git add failed");
  const msg = "chore: add official sarif converters and update scripts";
  const r2 = spawnSync("git", ["commit", "-m", msg], { stdio: "inherit" });
  if (r2.status !== 0) {
    console.log("Nothing to commit or git commit failed");
  } else {
    console.log("Committed package.json and package-lock.json changes");
  }
}

function main() {
  const apply = process.argv.includes("--apply");
  console.log("Ensuring official SARIF devDependencies. apply:", apply);
  const found = [];
  for (const p of OFFICIAL_PKGS) {
    const ver = npmViewVersion(p.name);
    if (ver) {
      console.log(`Found official package ${p.name}@${ver}`);
      found.push({ name: p.name, version: ver });
    } else {
      console.log(`Official package ${p.name} not found`);
    }
  }
  if (found.length === 0) {
    console.log("No official SARIF packages found in registry. Nothing to do.");
    process.exit(0);
  }
  if (!apply) {
    console.log("Dry-run: the script will add the following to devDependencies if applied:");
    found.forEach((f) => console.log(` - ${f.name}@^${f.version}`));
    console.log("To apply changes run: node scripts/ensure-official-sarif-deps.cjs --apply");
    process.exit(0);
  }
  try {
    const installed = addDevDeps(found);
    if (installed) {
      runNpmInstall();
      updatePackageScriptsUseOfficial();
      // Remove local converter files
      removeLocalConverters();
      // Commit changes
      commitChanges();
      console.log("Changes applied and committed.");
    } else {
      console.log("No changes needed to devDependencies");
    }
  } catch (e) {
    console.error("Failed to apply changes:", e.message);
    process.exit(1);
  }
}

main();
