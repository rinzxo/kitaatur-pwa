const { getMonitorData } = require('./src/controllers/school.controller');
// Need to mock req and res
const req = {
  params: { orgId: 'ee4d28ad-6e9c-4dcc-855c-8079263abb05' },
  body: { pin: '123' }
};
const res = {
  status: (code) => {
    console.log('STATUS:', code);
    return {
      json: (data) => console.log('JSON:', data)
    };
  },
  json: (data) => console.log('JSON:', data)
};
async function test() {
  try {
    await getMonitorData(req, res);
  } catch(e) {
    console.error(e);
  }
}
test();
