#!/usr/bin/env node

/**
 * TEST B - RBAC ENFORCEMENT VERIFICATION
 * Tests: Role-based access control for different user roles
 * Expected: Correct HTTP status codes for each role/endpoint combination
 * 
 * Roles: Guest, HomeOwner, SuperAdmin
 * Endpoints:
 *   - GET /api/sensors (should allow all roles)
 *   - GET /api/secure/guest (should allow Guest+, reject unauth)
 *   - GET /api/secure/homeowner (should allow HomeOwner+, reject Guest)
 *   - GET /api/secure/superadmin (should allow SuperAdmin only)
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';

// Seed credentials
const USERS = {
  SuperAdmin: {
    username: 'admin',
    password: 'admin@123456',
    role: 'SuperAdmin',
    token: null,
  },
  HomeOwner: {
    username: 'testuser-homeowner',
    password: 'TestPassword123!',
    role: 'HomeOwner',
    token: null,
    needsRegister: true,
  },
  Guest: {
    username: 'testuser-guest',
    password: 'TestPassword123!',
    role: 'Guest',
    token: null,
    needsRegister: true,
  },
};

const ENDPOINTS = [
  { path: '/api/sensors', method: 'GET', name: 'GET /api/sensors (read-only)' },
  { path: '/api/secure/guest', method: 'GET', name: 'GET /api/secure/guest' },
  { path: '/api/secure/homeowner', method: 'GET', name: 'GET /api/secure/homeowner' },
  { path: '/api/secure/superadmin', method: 'GET', name: 'GET /api/secure/superadmin' },
];

// HTTP request helper
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function loginUser(roleKey) {
  const user = USERS[roleKey];

  // Register if needed
  if (user.needsRegister) {
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      username: user.username,
      email: `${user.username}@test.com`,
      password: user.password,
      role: user.role === 'HomeOwner' ? 'customer' : 'guest',
    });

    if (registerRes.status !== 201 && registerRes.status !== 409) {
      console.log(`⚠️  Warning: Failed to register ${roleKey}: ${registerRes.status}`);
    }
    user.needsRegister = false;
  }

  // Login
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    usernameOrEmail: user.username,
    password: user.password,
  });

  if (loginRes.status !== 200) {
    console.log(`❌ Failed to login as ${roleKey}: ${loginRes.status}`);
    throw new Error(`Login failed for ${roleKey}`);
  }

  user.token = loginRes.body.token;
  return user.token;
}

async function runTest() {
  console.log('\n' + '='.repeat(100));
  console.log('TEST B: RBAC ENFORCEMENT VERIFICATION');
  console.log('='.repeat(100) + '\n');

  try {
    // Step 1: Login as all users
    console.log('Step 1: Logging in as SuperAdmin, HomeOwner, and Guest...\n');

    for (const roleKey of ['SuperAdmin', 'HomeOwner', 'Guest']) {
      try {
        await loginUser(roleKey);
        console.log(`✅ Logged in as ${roleKey}: ${USERS[roleKey].username}`);
      } catch (error) {
        console.log(`❌ ${error.message}`);
        process.exit(1);
      }
    }

    // Step 2: Test each endpoint with each role
    console.log('\n\nStep 2: Testing RBAC for each endpoint/role combination...\n');

    const results = {};
    for (const endpoint of ENDPOINTS) {
      results[endpoint.name] = {};

      for (const roleKey of ['SuperAdmin', 'HomeOwner', 'Guest']) {
        const token = USERS[roleKey].token;
        const res = await makeRequest(endpoint.method, endpoint.path, null, token);
        results[endpoint.name][roleKey] = res.status;
      }
    }

    // Step 3: Display results table
    console.log('\nSTATUS CODES TABLE:');
    console.log('(200 = success, 401 = not authenticated, 403 = forbidden, 423 = locked)\n');

    // Create table header
    console.log(
      `| Endpoint                           | SuperAdmin | HomeOwner | Guest |`,
    );
    console.log(`|${''.padEnd(50, '-')}+${'-'.repeat(12)}+${'-'.repeat(11)}+${'-'.repeat(7)}|`);

    // Create table rows
    for (const [endpoint, statuses] of Object.entries(results)) {
      const superadminStatus = statuses['SuperAdmin'];
      const homeownerStatus = statuses['HomeOwner'];
      const guestStatus = statuses['Guest'];

      console.log(
        `| ${endpoint.padEnd(33)} | ${String(superadminStatus).padEnd(10)} | ${String(homeownerStatus).padEnd(9)} | ${String(guestStatus).padEnd(5)} |`,
      );
    }

    // Step 4: Validation
    console.log('\n' + '='.repeat(100));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(100) + '\n');

    let allPassed = true;

    // Expected behavior:
    // GET /api/sensors: 200 for all (public endpoint)
    // GET /api/secure/guest: 200 for all
    // GET /api/secure/homeowner: 200 for SuperAdmin + HomeOwner, 403 for Guest
    // GET /api/secure/superadmin: 200 for SuperAdmin, 403 for HomeOwner + Guest

    const expectations = [
      {
        endpoint: 'GET /api/sensors (read-only)',
        role: 'SuperAdmin',
        expected: 200,
      },
      {
        endpoint: 'GET /api/sensors (read-only)',
        role: 'HomeOwner',
        expected: 200,
      },
      {
        endpoint: 'GET /api/sensors (read-only)',
        role: 'Guest',
        expected: 200,
      },
      {
        endpoint: 'GET /api/secure/guest',
        role: 'SuperAdmin',
        expected: 200,
      },
      {
        endpoint: 'GET /api/secure/guest',
        role: 'HomeOwner',
        expected: 200,
      },
      {
        endpoint: 'GET /api/secure/guest',
        role: 'Guest',
        expected: 200,
      },
      {
        endpoint: 'GET /api/secure/homeowner',
        role: 'SuperAdmin',
        expected: 200,
      },
      {
        endpoint: 'GET /api/secure/homeowner',
        role: 'HomeOwner',
        expected: 200,
      },
      {
        endpoint: 'GET /api/secure/homeowner',
        role: 'Guest',
        expected: 403,
      },
      {
        endpoint: 'GET /api/secure/superadmin',
        role: 'SuperAdmin',
        expected: 200,
      },
      {
        endpoint: 'GET /api/secure/superadmin',
        role: 'HomeOwner',
        expected: 403,
      },
      {
        endpoint: 'GET /api/secure/superadmin',
        role: 'Guest',
        expected: 403,
      },
    ];

    for (const exp of expectations) {
      const actual = results[exp.endpoint][exp.role];
      const passed = actual === exp.expected;
      const symbol = passed ? '✅' : '❌';

      console.log(`${symbol} ${exp.endpoint} + ${exp.role.padEnd(12)} => Expected ${exp.expected}, Got ${actual}`);

      if (!passed) allPassed = false;
    }

    console.log(`\n${allPassed ? '✅ TEST B PASSED' : '❌ TEST B FAILED'}\n`);

    return allPassed;
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

runTest().then((passed) => {
  process.exit(passed ? 0 : 1);
});
