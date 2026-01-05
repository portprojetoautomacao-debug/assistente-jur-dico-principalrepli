/**
 * PII redaction utilities
 * - Redacts CPFs, CNPJs, emails, phone numbers and CNJ process numbers
 * - Designed as permissive/defensive redactor, not a full PII scanner
 */

export function redactPii(text: string): string {
  if (!text || typeof text !== "string") return text;

  // CPF (Brazilian) - 000.000.000-00 or 00000000000
  text = text.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[REDACTED_CPF]");
  text = text.replace(/\b\d{11}\b/g, "[REDACTED_CPF]");

  // CNPJ - 00.000.000/0000-00 or 00000000000000
  text = text.replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, "[REDACTED_CNPJ]");
  text = text.replace(/\b\d{14}\b/g, "[REDACTED_CNPJ]");

  // Emails - SEGURANÇA: redaction linear (sem regex) para evitar ReDoS.
  // Evita matches parciais como "texto123abc@example.com.br456".
  text = redactEmails(text);

  // Phone numbers - SEGURANÇA: Padrões específicos para evitar ReDoS
  text = text.replace(/\b\+?\d{2}\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g, "[REDACTED_PHONE]");
  text = text.replace(/\b\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g, "[REDACTED_PHONE]");

  // CNJ process number patterns like 0000000-00.0000.0.00.0000 or 0000000-00.0000.0.00.0000
  text = text.replace(/\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g, "[REDACTED_PROCESS]");
  text = text.replace(/\b\d{20}\b/g, "[REDACTED_PROCESS]");

  return text;
}

export default redactPii;

function isAsciiAlpha(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAsciiDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

function isEmailLocalChar(code: number): boolean {
  return (
    isAsciiAlpha(code) ||
    isAsciiDigit(code) ||
    code === 46 /* . */ ||
    code === 95 /* _ */ ||
    code === 37 /* % */ ||
    code === 43 /* + */ ||
    code === 45 /* - */
  );
}

function isDomainLabelChar(code: number): boolean {
  return isAsciiAlpha(code) || isAsciiDigit(code) || code === 45 /* - */;
}

function redactEmails(text: string): string {
  const EMAIL_REDACTION = "[REDACTED_EMAIL]";

  const parts: string[] = [];
  let last = 0;
  let at = text.indexOf("@");

  while (at !== -1) {
    // local-part: expand to the left
    let localStart = at - 1;
    let localLen = 0;
    while (localStart >= 0) {
      const code = text.charCodeAt(localStart);
      if (!isEmailLocalChar(code)) break;
      localLen++;
      if (localLen > 64) break;
      localStart--;
    }
    localStart += 1;
    if (localLen < 1 || localLen > 64) {
      at = text.indexOf("@", at + 1);
      continue;
    }

    // Ensure we are not inside a token that can continue the local-part
    if (localStart > 0 && isEmailLocalChar(text.charCodeAt(localStart - 1))) {
      at = text.indexOf("@", at + 1);
      continue;
    }

    // domain: parse labels to avoid consuming trailing '.' punctuation
    let domainEnd = at + 1;
    let labels = 0;
    let lastLabelStart = domainEnd;
    let lastLabelEnd = domainEnd;

    const domainStart = domainEnd;

    while (domainEnd < text.length) {
      // label
      const labelStart = domainEnd;
      let labelLen = 0;
      while (domainEnd < text.length) {
        const code = text.charCodeAt(domainEnd);
        if (!isDomainLabelChar(code)) break;
        labelLen++;
        if (labelLen > 63) break;
        domainEnd++;
      }

      if (labelLen < 1 || labelLen > 63) {
        // invalid label; abort
        domainEnd = labelStart;
        break;
      }

      // label cannot start/end with '-'
      if (
        text.charCodeAt(labelStart) === 45 /* - */ ||
        text.charCodeAt(domainEnd - 1) === 45 /* - */
      ) {
        domainEnd = labelStart;
        break;
      }

      labels++;
      lastLabelStart = labelStart;
      lastLabelEnd = domainEnd;

      // overall length guard (local + '@' + domain)
      if (domainEnd - domainStart > 255) {
        domainEnd = labelStart;
        break;
      }

      // dot separator
      if (domainEnd < text.length && text.charCodeAt(domainEnd) === 46 /* . */) {
        // only consume '.' if there is a valid label char after it
        if (domainEnd + 1 < text.length && isDomainLabelChar(text.charCodeAt(domainEnd + 1))) {
          domainEnd++;
          continue;
        }
      }

      break;
    }

    // Need at least one dot => at least 2 labels
    if (labels < 2) {
      at = text.indexOf("@", at + 1);
      continue;
    }

    // Validate TLD (last label): 2..10 letters only
    const tldLen = lastLabelEnd - lastLabelStart;
    if (tldLen < 2 || tldLen > 10) {
      at = text.indexOf("@", at + 1);
      continue;
    }
    let tldOk = true;
    for (let i = lastLabelStart; i < lastLabelEnd; i++) {
      if (!isAsciiAlpha(text.charCodeAt(i))) {
        tldOk = false;
        break;
      }
    }
    if (!tldOk) {
      at = text.indexOf("@", at + 1);
      continue;
    }

    // Ensure we don't match partial domains (e.g. "example.com.brX" where ".br" continues)
    if (
      domainEnd + 1 < text.length &&
      text.charCodeAt(domainEnd) === 46 /* . */ &&
      isAsciiAlpha(text.charCodeAt(domainEnd + 1))
    ) {
      at = text.indexOf("@", at + 1);
      continue;
    }

    // Ensure we are not in the middle of a domain-like token (letters/digits) after the email
    if (domainEnd < text.length) {
      const nextCode = text.charCodeAt(domainEnd);
      if (
        isAsciiAlpha(nextCode) ||
        isAsciiDigit(nextCode) ||
        nextCode === 45 /* - */ ||
        nextCode === 95 /* _ */
      ) {
        at = text.indexOf("@", at + 1);
        continue;
      }
    }

    const emailStart = localStart;
    const emailEnd = domainEnd;

    parts.push(text.slice(last, emailStart));
    parts.push(EMAIL_REDACTION);
    last = emailEnd;

    at = text.indexOf("@", emailEnd + 1);
  }

  if (parts.length === 0) return text;
  parts.push(text.slice(last));
  return parts.join("");
}
