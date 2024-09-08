import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const username = 'testuser_list_db';
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

async function testListDatabases() {
  console.log('Testing list databases operation...');

  // Assign user to multiple databases
  await assignUserToDatabase(1);
  await assignUserToDatabase(2);
  await assignUserToDatabase(3);

  // List databases
  const listDatabasesResponse = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('List databases response status:', listDatabasesResponse.status);
  console.log('List databases response data:', listDatabasesResponse.data);

  // Verify the response
  const databases = listDatabasesResponse.data;
  if (databases.includes(1) && databases.includes(2) && databases.includes(3)) {
    console.log('List databases test passed: All assigned databases are present.');
  } else {
    console.error('List databases test failed: Not all assigned databases are present.');
  }

  // Test database info
  console.log('Testing get database info...');
  const dbInfoResponse = await axios.get(`${BASE_URL}/storage/database/1/info`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Database info response status:', dbInfoResponse.status);
  console.log('Database info response data:', dbInfoResponse.data);

  // Test user info
  console.log('Testing get user info...');
  const userInfoResponse = await axios.get(`${BASE_URL}/storage/user/info`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('User info response status:', userInfoResponse.status);
  console.log('User info response data:', userInfoResponse.data);
}

async function runTests() {
  try {
    await createUserAndLogin();
    await testListDatabases();
    console.log('All list database tests completed successfully.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();