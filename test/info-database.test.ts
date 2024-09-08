import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const username = 'testuser_db_info';
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

async function testDatabaseInfo() {
  console.log('Testing database info operation...');

  // Assign user to database 5
  await assignUserToDatabase(5);

  // Set some data in the database
  await axios.post(`${BASE_URL}/storage/set/5/testkey1`, { value: 'testvalue1' }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  await axios.post(`${BASE_URL}/storage/set/5/testkey2`, { value: 'testvalue2' }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Get database info
  const dbInfoResponse = await axios.get(`${BASE_URL}/storage/database/5/info`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Database info response status:', dbInfoResponse.status);
  console.log('Database info response data:', dbInfoResponse.data);

  // Verify database info
  if (dbInfoResponse.data.keyCount === 2) {
    console.log('Database info test passed: Key count matches.');
  } else {
    console.error('Database info test failed: Key count does not match.');
  }

  if (typeof dbInfoResponse.data.sizeInBytes === 'number' && dbInfoResponse.data.sizeInBytes > 0) {
    console.log('Database info test passed: Size in bytes is a positive number.');
  } else {
    console.error('Database info test failed: Size in bytes is not a positive number.');
  }
}

async function runTests() {
  try {
    await createUserAndLogin();
    await testDatabaseInfo();
    console.log('All database info tests completed successfully.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();