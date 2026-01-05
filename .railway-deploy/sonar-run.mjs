import { createRequire } from "module";
const require = createRequire(import.meta.url);
let scanner;
try {
  scanner = require("sonarqube-scanner");
} catch (err) {
  console.warn(
    "'sonarqube-scanner' package is not installed. Skipping local sonar scan. To run SonarCloud use the GitHub Action on CI."
  );
  process.exit(0);
}
const scannerFn =
  typeof scanner === "function"
    ? scanner
    : scanner.default || scanner.scan || scanner;

// Run SonarQube scanner using CommonJS module import
function runSonarScan() {
  scannerFn(
    {
      serverUrl: "https://sonarcloud.io",
      token: process.env.SONAR_TOKEN,
      options: {
        "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
        "sonar.organization": "thiagobodevan-a11y",
        // Include 'api' as a source so TypeScript files under /api are analyzed
        "sonar.sources": "src,api",
        "sonar.tests": "src,api",
        "sonar.test.inclusions":
          "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
        "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
        "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
        // Explicitly disable external issue import path to avoid invalid SARIF
        "sonar.externalIssuesReportPaths": "",
        "sonar.exclusions":
          "coverage/**,dist/**,node_modules/**,**/*.spec.ts,**/*.spec.tsx",
        // SonarCloud needs to resolve lcov paths; ensure the report path is correct
        // and include the api folder in analyzer sources above
      },
    },
    (err) => {
      if (err) {
        console.error("Sonar scan failed:", err);
        process.exit(1);
      }
      console.log("Sonar scan finished successfully");
      process.exit(0);
    }
  );
}

// Execute
runSonarScan();
