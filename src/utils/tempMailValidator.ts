/**
 * Strict Disposable & Temporary Email Validator for VeritasAI
 * Blocks spam, disposable, and 10-minute temporary email inboxes.
 */

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'mailinator.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'sharklasers.com',
  'getnada.com',
  'nada.ltd',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'mohmal.com',
  'crazymailing.com',
  'inboxkitten.com',
  'mytemp.email',
  'generator.email',
  'emailondeck.com',
  'burnermail.io',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'tempail.com',
  'tempinbox.com',
  'tempr.email',
  'disposablemail.com',
  'throwawaymail.com',
  'throwawaymail.net',
  'dropmail.me',
  'mytempemail.com',
  'harakirimail.com',
  'incognitomail.org',
  'jetable.org',
  'mailcatch.com',
  'mailnesia.com',
  'tmail.ws',
  'temporarymail.com',
  'anonymousemail.me'
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  domain?: string;
}

export function validateEmailAddress(email: string): EmailValidationResult {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return { isValid: false, error: 'Email address is required.' };
  }

  // Basic regex check for valid email format
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  // Special exception: Admin@kmh system username
  if (cleanEmail === 'admin@kmh') {
    return { isValid: true, domain: 'kmh' };
  }

  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Invalid email address structure.' };
  }

  const domain = parts[1];

  // Check against known disposable and temp mail domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Temporary or disposable email addresses are strictly prohibited.',
      domain
    };
  }

  // Check for common disposable keywords in subdomains
  const suspiciousKeywords = ['tempmail', 'disposable', '10minute', 'guerrilla', 'trashmail', 'fakeinbox', 'throwaway'];
  if (suspiciousKeywords.some(keyword => domain.includes(keyword))) {
    return {
      isValid: false,
      error: 'Temporary or disposable email addresses are strictly prohibited.',
      domain
    };
  }

  return { isValid: true, domain };
}
