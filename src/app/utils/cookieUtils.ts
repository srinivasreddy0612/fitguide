// utils/cookieUtils.ts
/**
 * Set a cookie with proper attributes for better browser compatibility
 */
export const setCookie = (name: string, value: string, days: number = 30) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const cookie = `${name}=${value}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax${
      window.location.protocol === 'https:' ? '; Secure' : ''
    }`;
    
    document.cookie = cookie;
    console.log(`Set cookie: ${name}=${value}`);
    return cookie;
  };
  
  /**
   * Get a cookie value by name
   */
  export const getCookie = (name: string): string | undefined => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : undefined;
  };
  
  /**
   * Check if a cookie exists
   */
  export const hasCookie = (name: string): boolean => {
    return document.cookie.split(';').some(c => c.trim().startsWith(`${name}=`));
  };
  
  /**
   * Delete a cookie by setting its expiry to the past
   */
  export const deleteCookie = (name: string) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  };