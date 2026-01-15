import xss from 'xss';

/**
 * Sanitizes a string to prevent XSS attacks
 * Removes potentially dangerous HTML/JavaScript
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;
  return xss(str, {
    whiteList: {}, // Empty whitelist means no HTML tags allowed
    stripIgnoreTag: true,
  });
};

/**
 * Sanitizes an object recursively to prevent XSS attacks
 * Useful for sanitizing request bodies
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};
