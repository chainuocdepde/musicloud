#!/usr/bin/env node
/**
 * 🔧 DEBUG TOOL - Test Backend Endpoints
 * Chạy: node test-endpoints.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

async function testEndpoint(name, method, url, data = null) {
  try {
    log.info(`Testing ${name}...`);
    const config = { method, url: `${API_URL}${url}` };
    if (data) config.data = data;

    const response = await axios(config);
    log.success(`${name} - Status: ${response.status}`);
    console.log('   Response:', JSON.stringify(response.data, null, 2).substring(0, 200));
    return { success: true, data: response.data };
  } catch (error) {
    log.error(`${name} - ${error.message}`);
    if (error.response) {
      console.log('   Error:', JSON.stringify(error.response.data, null, 2).substring(0, 200));
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n🔍 BACKEND ENDPOINT TESTS\n');
  console.log('='.repeat(50));

  // Test 1: Server Health
  log.info('Test 1: Server Health Check');
  await testEndpoint('GET /', 'GET', '/../');
  console.log('');

  // Test 2: Register (with test data)
  log.info('Test 2: Register Endpoint');
  const testUser = {
    username: `test_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test1234'
  };
  const registerResult = await testEndpoint('POST /auth/register', 'POST', '/auth/register', testUser);
  console.log('');

  // Test 3: Login
  log.info('Test 3: Login Endpoint');
  await testEndpoint('POST /auth/login', 'POST', '/auth/login', {
    email_or_username: testUser.email,
    password: testUser.password
  });
  console.log('');

  // Test 4: Forgot Password (OTP)
  log.info('Test 4: Forgot Password (OTP)');
  await testEndpoint('POST /auth/forgot-password', 'POST', '/auth/forgot-password', {
    email: testUser.email
  });
  console.log('');

  // Test 5: Verify OTP (will fail without real OTP)
  log.info('Test 5: Verify OTP');
  await testEndpoint('POST /auth/verify-otp', 'POST', '/auth/verify-otp', {
    email: testUser.email,
    otp: '123456'
  });
  console.log('');

  // Test 6: Reset Password (will fail without valid OTP)
  log.info('Test 6: Reset Password');
  await testEndpoint('POST /auth/reset-password', 'POST', '/auth/reset-password', {
    email: testUser.email,
    otp: '123456',
    newPassword: 'NewPass1234'
  });
  console.log('');

  // Test 7: Google Auth (will fail without real token)
  log.info('Test 7: Google Auth');
  await testEndpoint('POST /auth/google', 'POST', '/auth/google', {
    access_token: 'fake_token_for_testing'
  });
  console.log('');

  // Test 8: Discord Auth (will fail without real token)
  log.info('Test 8: Discord Auth');
  await testEndpoint('POST /auth/discord', 'POST', '/auth/discord', {
    access_token: 'fake_token_for_testing'
  });
  console.log('');

  // Test 9: Facebook Auth (will fail without real token)
  log.info('Test 9: Facebook Auth');
  await testEndpoint('POST /auth/facebook', 'POST', '/auth/facebook', {
    access_token: 'fake_token_for_testing'
  });
  console.log('');

  console.log('='.repeat(50));
  console.log('\n✨ Tests completed!\n');
  console.log('📝 Notes:');
  console.log('   - OAuth tests will fail without real tokens (expected)');
  console.log('   - OTP tests will fail without real OTP from email (expected)');
  console.log('   - Check if endpoints are responding correctly\n');
}

// Run tests
runTests().catch(console.error);
