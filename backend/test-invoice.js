const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000, 
  path: '/api/org-financial/public/invoice/70b23719-5bbc-4f62-939b-c2c32f60741e',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});
req.on('error', console.error);
req.end();
