module.exports = async ({ github, context }) => {
  const fs = require('fs');
  const auditReport = fs.readFileSync('audit-report.md', 'utf8');

  // Verificar se já existe issue aberta
  const issues = await github.rest.issues.listForRepo({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    labels: 'security,dependencies'
  });

  const existingIssue = issues.data.find(issue =>
    issue.title.includes('Security Vulnerabilities Detected')
  );

  const issueBody = `${auditReport}

## 🔧 Recommended Actions

- Review the vulnerabilities above
- Run \`npm audit fix\` to attempt automatic fixes
- For vulnerabilities that can't be auto-fixed:
  - Check if updates are available
  - Consider alternative packages
  - Assess risk and document exceptions
- Update \`package-lock.json\` after fixes
- Test thoroughly after updates

## 📝 Fix Commands

\`\`\`bash
# Attempt automatic fixes
npm audit fix

# Fix including breaking changes (review carefully)
npm audit fix --force

# Get detailed report
npm audit --json > audit-full.json
\`\`\`

---

*Automated security scan - ${new Date().toISOString()}*`;

  if (existingIssue) {
    // Atualizar issue existente
    await github.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: existingIssue.number,
      body: issueBody
    });

    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: existingIssue.number,
      body: '🔄 Security scan updated with latest findings.'
    });
  } else {
    // Criar nova issue
    await github.rest.issues.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: '🚨 Security Vulnerabilities Detected in Dependencies',
      body: issueBody,
      labels: ['security', 'dependencies', 'high-priority']
    });
  }
};