async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/squads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      },
      body: JSON.stringify({ name: 'Testing Fetch', description: 'Testing' })
    });
    const text = await res.text();
    console.log('Status:', res.status, 'Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();

