const https = require('https');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'User-Agent': 'NodeTestClient'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function run() {
  const url = 'https://iot-smarthome-security.onrender.com/api/auth/login';

  console.log('--- TESTING HOMEOWNER LOGIN ---');
  try {
    const resHome = await postJson(url, {
      usernameOrEmail: 'homeowner',
      password: 'homeowner@123'
    });
    console.log('Status:', resHome.statusCode);
    console.log('Body:', resHome.body);
  } catch (err) {
    console.error('Homeowner login request failed:', err);
  }

  console.log('\n--- TESTING ADMIN LOGIN WITH PASSWORD admin@123456 ---');
  try {
    const resAdmin = await postJson(url, {
      usernameOrEmail: 'admin',
      password: 'admin@123456'
    });
    console.log('Status:', resAdmin.statusCode);
    console.log('Body:', resAdmin.body);
  } catch (err) {
    console.error('Admin login request failed:', err);
  }

  console.log('\n--- TESTING ADMIN LOGIN WITH PASSWORD admin123@ ---');
  try {
    const resAdmin2 = await postJson(url, {
      usernameOrEmail: 'admin',
      password: 'admin123@'
    });
    console.log('Status:', resAdmin2.statusCode);
    console.log('Body:', resAdmin2.body);
  } catch (err) {
    console.error('Admin login request failed:', err);
  }
}

run();
