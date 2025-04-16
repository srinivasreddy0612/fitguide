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
  
  export const getCookie = (name: string): string | undefined => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : undefined;
  };
  

  export const hasCookie = (name: string): boolean => {
    return document.cookie.split(';').some(c => c.trim().startsWith(`${name}=`));
  };
  

  export const deleteCookie = (name: string) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  };