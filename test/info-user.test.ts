import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const username = 'testuser_info';
const password = 'testpassword';
let token: string;

async function createUserAndLogin() {
  console.log('Creating user or logging in...');
  try {
    await axios.post(`${BASE_URL}/storage/user`, { username, password });
    console.log('User created successfully.');
  } catch (error) {
    console.log('User already exists, proceeding to login.');
  }

  const loginResponse = await axios.post(`${BASE_URL}/storage/login`, { username, password });
  token = loginResponse.data.access_token;
}

async function assignUserToDatabase(dbIndex: number) {
  console.log(`Assigning user to database ${dbIndex}...`);
  await axios.post(`${BASE_URL}/storage/assign-db`, { dbIndex }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function testUserInfo() {
  console.log('Testing user info operation...');

  // Get user info
  const userInfoResponse = await axios.get(`${BASE_URL}/storage/user/info`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('User info response status:', userInfoResponse.status);
  console.log('User info response data:', userInfoResponse.data);

  // Verify user info
  if (userInfoResponse.data.username === username) {
    console.log('User info test passed: Username matches.');
  } else {
    console.error('User info test failed: Username does not match.');
  }

  if (Array.isArray(userInfoResponse.data.databases)) {
    console.log('User info test passed: Databases field is an array.');
  } else {
    console.error('User info test failed: Databases field is not an array.');
  }

  if (typeof userInfoResponse.data.isAdmin === 'boolean') {
    console.log('User info test passed: isAdmin field is a boolean.');
  } else {
    console.error('User info test failed: isAdmin field is not a boolean.');
  }
}

async function runTests() {
  try {
    await createUserAndLogin();
    await assignUserToDatabase(1); // Assign to database 1 for testing
    await testUserInfo();
    console.log('All user info tests completed successfully.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();