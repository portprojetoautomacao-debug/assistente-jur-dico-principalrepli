# Java configuration for SonarLint (project)

This file captures the local VS Code SonarLint configuration we use for this project.

## Key config in `.vscode/settings.json`

```json
{
  "sonarlint.pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node",
  "sonarlint.ls.javaHome": "/usr/lib/jvm/java-11-openjdk-amd64",
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "connectionId": "thiagobodevan-a11y",
      "organizationKey": "thiagobodevan-a11y"
    }
  ],
  "sonarlint.connectedMode.project": {
    "connectionId": "thiagobodevan-a11y",
    "projectKey": "thiagobodevan-a11y_assistente-juridico-p"
  }
}
```

## Troubleshooting tips

-- Ensure Java (JRE) is installed and `sonarlint.ls.javaHome` is set.
  - If you are using the Dev Container, the container includes OpenJDK 11 via the devcontainer feature and the `sonarlint.ls.javaHome` above should work.
  - If you are on a host machine, run `scripts/install-openjdk-11.sh` to install OpenJDK 11 and set `JAVA_HOME` in your shell.
  - Alternatively, SonarLint can prompt to download a JRE automatically from AdoptOpenJDK during startup; accept the prompt to download.
- For Node, point `sonarlint.pathToNodeExecutable` to the Node 22 path (nvm or system).

## How to verify

```bash
java -version
which java
node --version
which node
```

## Reload VS Code & SonarLint

- `Developer: Reload Window` in the Command Palette
- Check the SonarLint output channel for logs
