export function serviceOrigin(value, name) {
 let url;
 try { url = new URL(value?.trim()); }
 catch { throw new Error(name + ' cần là địa chỉ HTTPS đầy đủ của dịch vụ.'); }
 const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
 if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
     url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  throw new Error(name + ' chỉ nhận URL gốc, ví dụ https://mila-api.onrender.com.');
 }
 return url.origin;
}
