#!/usr/bin/env node

/**
 * COMPREHENSIVE SECURITY VERIFICATION TEST SUITE
 * For smart home IoT platform. Verifies:
 * - TEST A: Brute-force login lockout
 * - TEST B: Role-Based Access Control (RBAC) enforcement
 * - TEST C: IP-based authentication Rate limiting
 * - TEST D: JSON Web Token (JWT) expiry validation
 * 
 * Automatically outputs logs to console and writes them to:
 * c:\Prethesis\iot-smarthome-security\test_results.txt
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000';
const RESULTS_FILE = path.resolve(__dirname, '../../test_results.txt');

// Check if running in compact summary-only mode to fit in a single screenshot
const isSummaryOnly = process.argv.includes('--summary') || process.argv.includes('-s');

// ANSI Color Escape Sequences for beautiful terminal outputs (ASCII fallback safe for Windows CMD/PowerShell)
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

const PASS = colors.green('[v] PASS');
const FAIL = colors.red('[x] FAIL');
const ERROR = colors.red('[!] ERROR');
const CHECK = colors.green('[v]');

// Keep all console output in a log buffer to write to file
let logBuffer = '';

function stripAnsi(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function log(message) {
  if (!isSummaryOnly) {
    console.log(message);
  }
  logBuffer += stripAnsi(message) + '\n';
}

function logSummary(message) {
  console.log(message);
  logBuffer += stripAnsi(message) + '\n';
}

// Helper to generate a random IP address to isolate rate limit test scopes
function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254) + 1}`;
}

// HTTP request helper using native Node.js http module with custom IP headers
function makeRequest(method, path, body = null, token = null, clientIp = null) {
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

    if (clientIp) {
      options.headers['X-Forwarded-For'] = clientIp;
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
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
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

// MongoDB schema definition to directly query the MongoDB collections
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  isLocked: Boolean,
  failedLoginAttempts: Number,
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function runSuite() {
  let testAPassed = false;
  let testBReadPassed = false;
  let testBWritePassed = false;
  let testBAdminPassed = false;
  let testCPassed = false;
  let testDPassed = false;

  log('================================================================================');
  log('              COMPREHENSIVE SECURITY VERIFICATION TEST SUITE                    ');
  log('================================================================================');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`Target Endpoint: ${API_BASE}`);
  log('--------------------------------------------------------------------------------\n');

  // Connect to MongoDB Atlas
  log('[INFO] Connecting to MongoDB to verify database-level assertions...');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    log('[ERROR] MONGODB_URI not found in environment. Exiting.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(mongoUri);
    log(`${PASS} Successfully connected to MongoDB Atlas database!\n`);
  } catch (err) {
    log(`${ERROR} Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  // ============================================================================
  // TEST A: BRUTE-FORCE LOCKOUT VERIFICATION
  // ============================================================================
  log('================================================================================');
  log('TEST A — BRUTE-FORCE LOCKOUT');
  log('================================================================================');
  log('Objective: Verify that accounts lock out after N=5 wrong password attempts,');
  log('and subsequent logins (even with correct password) are rejected with 403.');
  log('Finally, verify database integrity by asserting isLocked=true on the User document.');
  log('--------------------------------------------------------------------------------');

  const testUser = {
    username: 'testuser-bruteforce',
    email: 'testuser-bruteforce@test.com',
    password: 'TestPassword123!',
    wrongPassword: 'WrongPassword999!',
  };

  // Generate a distinct IP address for Test A to isolate rate limiting
  const testAIp = generateRandomIP();
  log(`[TEST A] Isolated IP allocated for this scope: ${testAIp}\n`);

  let lockoutCorrect = false;
  let postLockoutCorrect = false;
  let dbLockoutCorrect = false;

  try {
    // 1. Database Cleanup
    log(`[TEST A] Cleaning up existing user "${testUser.username}" from database...`);
    await User.deleteOne({ username: testUser.username });

    // 2. Register fresh user
    log('[TEST A] Registering fresh test user account...');
    const regRes = await makeRequest('POST', '/api/auth/register', {
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
      role: 'customer', // Maps to HomeOwner role
    }, null, testAIp);

    if (regRes.status !== 201) {
      log(`${FAIL} [TEST A] Failed to register user. Status: ${regRes.status}`);
      log(JSON.stringify(regRes.body));
      throw new Error('Registration failed');
    }
    log(`${PASS} [TEST A] Registration successful (201 Created).\n`);

    // 3. Send N=5 wrong password attempts
    const N = 5;
    log(`[TEST A] Sending ${N} sequential wrong password attempts to POST /api/auth/login...`);
    
    for (let i = 1; i <= N; i++) {
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        usernameOrEmail: testUser.username,
        password: testUser.wrongPassword,
      }, null, testAIp);
      log(`Attempt #${i}: Status Received = ${loginRes.status} | Response Message = "${loginRes.body?.message || ''}"`);
      
      if (i === N) {
        if (loginRes.status === 403) {
          log(`${PASS} [TEST A] Assertion Passed: On attempt N (lockout threshold), received expected HTTP 403 Forbidden!`);
          lockoutCorrect = true;
        } else {
          log(`${FAIL} [TEST A] Assertion Failed: On attempt N, expected HTTP 403, received HTTP ${loginRes.status}`);
        }
      } else {
        if (loginRes.status === 401) {
          log(`${CHECK} Attempt #${i} correctly returned HTTP 401 Unauthorized.`);
        } else {
          log(`${FAIL} [TEST A] Attempt #${i} returned unexpected status HTTP ${loginRes.status}`);
        }
      }
      // Small pause to prevent rate limiting interfering
      await new Promise(r => setTimeout(r, 150));
    }

    // 4. Send attempt N+1 (attempt 6) with correct password while locked out
    log('\n[TEST A] Sending correct password after account lockout has triggered...');
    const correctPwRes = await makeRequest('POST', '/api/auth/login', {
      usernameOrEmail: testUser.username,
      password: testUser.password,
    }, null, testAIp);

    log(`Attempt with CORRECT password: Status Received = ${correctPwRes.status} | Response Message = "${correctPwRes.body?.message || ''}"`);
    if (correctPwRes.status === 403) {
      log(`${PASS} [TEST A] Assertion Passed: Correct password attempt post-lockout returns HTTP 403 Forbidden!`);
      postLockoutCorrect = true;
    } else {
      log(`${FAIL} [TEST A] Assertion Failed: Post-lockout correct password attempt expected HTTP 403, received HTTP ${correctPwRes.status}`);
    }

    // 5. Verify MongoDB isLocked=true
    log('\n[TEST A] Verifying MongoDB database-level document directly...');
    const dbUser = await User.findOne({ username: testUser.username }).lean();
    
    if (dbUser) {
      log(`Database Document -> username: "${dbUser.username}" | failedLoginAttempts: ${dbUser.failedLoginAttempts} | isLocked: ${dbUser.isLocked}`);
      if (dbUser.isLocked === true) {
        log(`${PASS} [TEST A] Assertion Passed: User document shows isLocked = true in MongoDB!`);
        dbLockoutCorrect = true;
      } else {
        log(`${FAIL} [TEST A] Assertion Failed: User document isLocked = false in MongoDB!`);
      }
    } else {
      log(`${FAIL} [TEST A] User document not found in MongoDB!`);
    }

    testAPassed = lockoutCorrect && postLockoutCorrect && dbLockoutCorrect;

  } catch (error) {
    log(`${ERROR} [TEST A] Critical Error: ${error.message}`);
  }
  log('--------------------------------------------------------------------------------\n');


  // ============================================================================
  // TEST B: RBAC ENFORCEMENT VERIFICATION
  // ============================================================================
  log('================================================================================');
  log('TEST B — RBAC ENFORCEMENT');
  log('================================================================================');
  log('Objective: Validate access control constraints across Guest, HomeOwner, and');
  log('SuperAdmin roles when calling read-only, write, and administrative endpoints.');
  log('--------------------------------------------------------------------------------');

  const credentials = {
    Guest: { username: 'testuser-guest', email: 'testuser-guest@test.com', password: 'TestPassword123!', role: 'guest' },
    HomeOwner: { username: 'testuser-homeowner', email: 'testuser-homeowner@test.com', password: 'TestPassword123!', role: 'customer' },
    SuperAdmin: { username: 'admin', password: 'admin@123456' } // Uses seed credentials
  };

  const endpoints = [
    { method: 'GET', path: '/api/sensors', name: 'GET /api/sensors (read-only)' },
    { method: 'POST', path: '/api/device/control', name: 'POST /api/device/control (write)', body: { device: 'light1', action: 'toggle' } },
    { method: 'GET', path: '/api/admin/locked-users', name: 'GET /api/admin/locked-users (admin only)' }
  ];

  try {
    const tokens = { Guest: null, HomeOwner: null, SuperAdmin: null };

    // 1. Guarantee Guest and HomeOwner exist by deleting and re-registering
    log('[TEST B] Preparing Guest and HomeOwner accounts...');
    for (const key of ['Guest', 'HomeOwner']) {
      await User.deleteOne({ username: credentials[key].username });
      const reg = await makeRequest('POST', '/api/auth/register', {
        username: credentials[key].username,
        email: credentials[key].email,
        password: credentials[key].password,
        confirmPassword: credentials[key].password,
        role: credentials[key].role,
      }, null, generateRandomIP());
      if (reg.status !== 201) {
        log(`[WARNING] Registration for ${key} returned ${reg.status}. Attempting login directly.`);
      }
    }

    // 2. Perform authentications to acquire JWTs (using isolated IPs for each to bypass rate limiters)
    log('[TEST B] Logging in to retrieve JWT access tokens...');
    for (const role of ['Guest', 'HomeOwner', 'SuperAdmin']) {
      const cred = credentials[role];
      const loginIp = generateRandomIP();
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        usernameOrEmail: cred.username,
        password: cred.password,
      }, null, loginIp);

      if (loginRes.status === 200 && loginRes.body?.token) {
        tokens[role] = loginRes.body.token;
        log(`${CHECK} Token acquired for role: ${role}`);
      } else {
        log(`${FAIL} Failed to acquire token for role ${role}. Status: ${loginRes.status}`);
        throw new Error(`Login failed for ${role}`);
      }
    }

    // 3. Request each endpoint with each token
    log('\n[TEST B] Executing cross-role endpoint authorizations...');
    const rbacResults = {};

    for (const ep of endpoints) {
      rbacResults[ep.name] = {};
      for (const role of ['Guest', 'HomeOwner', 'SuperAdmin']) {
        const token = tokens[role];
        const res = await makeRequest(ep.method, ep.path, ep.body, token, generateRandomIP());
        rbacResults[ep.name][role] = res.status;
      }
    }

    // 4. Output beautiful markdown status table
    log('\n[TEST B] Generating RBAC Enforcement Status Matrix:');
    log('');
    log('| Endpoint | Guest | HomeOwner | SuperAdmin |');
    log('| :--- | :---: | :---: | :---: |');
    
    for (const ep of endpoints) {
      const gStatus = rbacResults[ep.name]['Guest'];
      const hoStatus = rbacResults[ep.name]['HomeOwner'];
      const saStatus = rbacResults[ep.name]['SuperAdmin'];
      log(`| ${ep.name.padEnd(42)} | ${gStatus} | ${hoStatus} | ${saStatus} |`);
    }

    log('\n[TEST B] Validation Analysis:');
    
    // Validate GET /api/sensors (read-only) -> should be 200 for all
    const sensorsOk = rbacResults['GET /api/sensors (read-only)']['Guest'] === 200 &&
                      rbacResults['GET /api/sensors (read-only)']['HomeOwner'] === 200 &&
                      rbacResults['GET /api/sensors (read-only)']['SuperAdmin'] === 200;
    log(`${CHECK} Read-only constraint: GET /api/sensors accessible to Guest/HomeOwner/Admin: ${sensorsOk ? colors.green('PASS (200 OK)') : colors.red('FAIL')}`);

    // Validate POST /api/device/control (write) -> should be 403 for Guest, 200 for HomeOwner & SuperAdmin
    const controlGuestRejected = rbacResults['POST /api/device/control (write)']['Guest'] === 403;
    const controlHomeOwnerAllowed = rbacResults['POST /api/device/control (write)']['HomeOwner'] === 200;
    const controlAdminAllowed = rbacResults['POST /api/device/control (write)']['SuperAdmin'] === 200;
    const controlOk = controlGuestRejected && controlHomeOwnerAllowed && controlAdminAllowed;
    log(`${CHECK} Write constraint: POST /api/device/control rejected for Guest (403), allowed for HomeOwner/Admin (200): ${controlOk ? colors.green('PASS') : colors.red('FAIL')}`);

    // Validate GET /api/admin/locked-users (admin only) -> should be 403 for Guest & HomeOwner, 200 for SuperAdmin
    const adminGuestRejected = rbacResults['GET /api/admin/locked-users (admin only)']['Guest'] === 403;
    const adminHomeOwnerRejected = rbacResults['GET /api/admin/locked-users (admin only)']['HomeOwner'] === 403;
    const adminAdminAllowed = rbacResults['GET /api/admin/locked-users (admin only)']['SuperAdmin'] === 200;
    const adminOk = adminGuestRejected && adminHomeOwnerRejected && adminAdminAllowed;
    log(`${CHECK} Admin constraint: GET /api/admin/locked-users rejected for Guest/HomeOwner (403), allowed only for Admin (200): ${adminOk ? colors.green('PASS') : colors.red('FAIL')}`);

    testBReadPassed = sensorsOk;
    testBWritePassed = controlOk;
    testBAdminPassed = adminOk;

  } catch (error) {
    log(`${ERROR} [TEST B] Critical Error: ${error.message}`);
  }
  log('--------------------------------------------------------------------------------\n');


  // ============================================================================
  // TEST C: RATE LIMITER VERIFICATION
  // ============================================================================
  log('================================================================================');
  log('TEST C — RATE LIMITER');
  log('================================================================================');
  log('Objective: Send 15 rapid authentication requests to POST /api/auth/login.');
  log('Verify that the rate limiter blocks subsequent requests with 429 Too Many Requests,');
  log('identify the exact request threshold, and extract the "Retry-After" header.');
  log('--------------------------------------------------------------------------------');

  try {
    const totalRequests = 15;
    // Generate a dedicated IP address specifically for Test C rapid storming
    const testCIp = generateRandomIP();
    log(`[TEST C] Bombarding login endpoint using IP: ${testCIp}...`);
    
    let rateLimitTriggeredAt = null;
    let retryAfterHeader = null;

    for (let i = 1; i <= totalRequests; i++) {
      const res = await makeRequest('POST', '/api/auth/login', {
        usernameOrEmail: 'nonexistent-rate-limit-user',
        password: 'SomeDummyPassword123!',
      }, null, testCIp);

      const retryAfter = res.headers['retry-after'];
      log(`Request #${String(i).padStart(2, ' ')}: HTTP Status = ${res.status} | Retry-After = ${retryAfter || 'N/A'}`);

      if (res.status === 429 && !rateLimitTriggeredAt) {
        rateLimitTriggeredAt = i;
        retryAfterHeader = retryAfter;
      }
      
      // Delay extremely small (10ms) to bypass normal connection exhaustion but rapid enough to trigger express-rate-limit
      await new Promise(r => setTimeout(r, 10));
    }

    log('\n[TEST C] Rate Limiter Analysis:');
    if (rateLimitTriggeredAt) {
      log(`${PASS} [TEST C] Rate limit triggered at request #${rateLimitTriggeredAt} (Expected: #11 since AUTH_RATE_LIMIT_MAX = 10)`);
      log(`${PASS} [TEST C] Received Retry-After header: ${retryAfterHeader} seconds`);
      log(`${PASS} [TEST C] Assertion Passed: API rate limiter successfully mitigated rapid brute force attempts.`);
      testCPassed = true;
    } else {
      log(`${FAIL} [TEST C] Assertion Failed: Rate limiter was not triggered! HTTP 429 was never received.`);
    }

  } catch (error) {
    log(`${ERROR} [TEST C] Critical Error: ${error.message}`);
  }
  log('--------------------------------------------------------------------------------\n');


  // ============================================================================
  // TEST D: JWT EXPIRY VERIFICATION
  // ============================================================================
  log('================================================================================');
  log('TEST D — JWT EXPIRY');
  log('================================================================================');
  log('Objective: Manually generate an expired JWT (using a past expiration timestamp),');
  log('submit it to the protected GET /api/sensors endpoint, and verify that');
  log('the backend correctly returns HTTP 401 Unauthorized with "Authentication token has expired."');
  log('--------------------------------------------------------------------------------');

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is missing from environmental variables.');
    }

    // 1. Manually craft an expired payload
    log('[TEST D] Crafting expired JWT token with exp claim set to 1 hour in the past...');
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    
    // Replicate exactly the backend payload and signing standards
    const expiredToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        role: 'Guest',
        username: 'test-expired-user',
        email: 'test-expired-user@test.com',
        iat: pastTimestamp - 3600,
        exp: pastTimestamp,
      },
      jwtSecret,
      {
        issuer: process.env.JWT_ISSUER || 'iot-smart-home-api',
        audience: process.env.JWT_AUDIENCE || 'iot-smart-home-clients',
      }
    );

    log(`[TEST D] Expired JWT Token generated successfully: \n"${expiredToken.substring(0, 45)}... [truncated]"\n`);

    // 2. Transmit expired token to a protected endpoint
    log('[TEST D] Transmitting request with Expired Token to GET /api/sensors...');
    const res = await makeRequest('GET', '/api/sensors', null, expiredToken, generateRandomIP());

    log(`Response: Status Received = ${res.status} | Response Payload = ${JSON.stringify(res.body)}`);

    if (res.status === 401) {
      if (res.body?.message === 'Authentication token has expired.') {
        log(`${PASS} [TEST D] Assertion Passed: Server correctly returned HTTP 401 and custom "Authentication token has expired." message!`);
        testDPassed = true;
      } else {
        log(`${FAIL} [TEST D] Status was 401, but message was unexpected: "${res.body?.message || 'N/A'}"`);
      }
    } else {
      log(`${FAIL} [TEST D] Assertion Failed: Expected HTTP 401 Unauthorized, received HTTP ${res.status}`);
    }

  } catch (error) {
    log(`${ERROR} [TEST D] Critical Error: ${error.message}`);
  }
  log('--------------------------------------------------------------------------------\n');

  // ============================================================================
  // FINALIZE & EXPORT RESULTS
  // ============================================================================
  logSummary('\n================================================================================');
  logSummary('               SECURITY VERIFICATION SUITE — EXECUTIVE SUMMARY');
  logSummary('================================================================================');
  logSummary(` TEST A: Brute-Force Lockout Mitigation  .......................... ${testAPassed ? colors.green('[ PASS ]') : colors.red('[ FAIL ]')}`);
  logSummary(` TEST B: Role-Based Access Control (RBAC)  ........................ ${ (testBReadPassed && testBWritePassed && testBAdminPassed) ? colors.green('[ PASS ]') : colors.red('[ FAIL ]')}`);
  logSummary(`     ├─ Read-only (Guest/HomeOwner/SuperAdmin)  ................... ${testBReadPassed ? colors.green('[ PASS ]') : colors.red('[ FAIL ]')}`);
  logSummary(`     ├─ Write control (HomeOwner/Admin allowed, Guest blocked) .... ${testBWritePassed ? colors.green('[ PASS ]') : colors.red('[ FAIL ]')}`);
  logSummary(`     └─ Administrative access (SuperAdmin only)  .................. ${testBAdminPassed ? colors.green('[ PASS ]') : colors.red('[ FAIL ]')}`);
  logSummary(` TEST C: IP-based Authentication Rate Limiter  .................... ${testCPassed ? colors.green('[ PASS ]') : colors.red('[ FAIL ]')}`);
  logSummary(` TEST D: JSON Web Token (JWT) Expiry Validation  .................. ${testDPassed ? colors.green('[ PASS ]') : colors.red('[ FAIL ]')}`);
  logSummary('================================================================================\n');

  log('================================================================================');
  log('                         END OF SECURITY TEST SUITE                             ');
  log('================================================================================');

  try {
    fs.writeFileSync(RESULTS_FILE, logBuffer, 'utf8');
    logSummary(`[SUCCESS] All verification results successfully logged and saved to:\n--> ${RESULTS_FILE}\n`);
  } catch (err) {
    console.error(`[ERROR] Failed to write results file: ${err.message}`);
  }

  // Gracefully disconnect DB and exit
  await mongoose.disconnect();
  process.exit(0);
}

runSuite();
