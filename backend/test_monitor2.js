async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/school/schools/ee4d28ad-6e9c-4dcc-855c-8079263abb05/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '123' })
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch (err) {
    console.error(err);
  }
}
test();
