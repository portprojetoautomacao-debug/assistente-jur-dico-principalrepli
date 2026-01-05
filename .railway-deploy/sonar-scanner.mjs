// ESM wrapper for sonarqube-scanner
import scanner from "sonarqube-scanner";

(async () => {
  try {
    await new Promise((resolve, reject) => {
      scanner(
        {
          serverUrl: "https://sonarcloud.io",
          token: process.env.SONAR_TOKEN,
          options: {
            "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
            "sonar.organization": "thiagobodevan-a11y",
            "sonar.sources": "src",
            "sonar.tests": "src",
            "sonar.test.inclusions":
              "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
            "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
            "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
            "sonar.exclusions": "coverage/**,dist/**,node_modules/**",
          },
        },
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
    console.log("Sonar scan finished successfully");
    process.exit(0);
  } catch (e) {
    console.error("Sonar scan failed:", e);
    process.exit(1);
  }
})();
