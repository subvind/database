import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const username = 'testuser_delete_db';
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

async function testDeleteDatabase() {
  console.log('Testing delete database operation...');

  // Assign user to database 3
  await assignUserToDatabase(3);

  // Set a key in the database
  const setResponse = await axios.post(`${BASE_URL}/storage/set/3/testkey`, { value: 'testvalue' }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Set response status:', setResponse.status);
  console.log('Set response text:', setResponse.data);

  // Get the key to verify it's set
  const getResponse = await axios.get(`${BASE_URL}/storage/get/3/testkey`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Get response status:', getResponse.status);
  console.log('Get response text:', getResponse.data);

  // Delete the database
  const deleteResponse = await axios.delete(`${BASE_URL}/storage/database/3`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Delete database response status:', deleteResponse.status);
  console.log('Delete database response text:', deleteResponse.data);

  // Try to get the key again, should fail or return null
  try {
    const getAfterDeleteResponse = await axios.get(`${BASE_URL}/storage/get/3/testkey`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Get after delete response status:', getAfterDeleteResponse.status);
    console.log('Get after delete response text:', getAfterDeleteResponse.data);
  } catch (error) {
    console.log('Get after delete failed as expected:', error.response.status);
  }

  // List databases to verify the deleted database is not present
  const listDatabasesResponse = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('List databases response status:', listDatabasesResponse.status);
  console.log('List databases response text:', listDatabasesResponse.data);
}

async function runTests() {
  try {
    await createUserAndLogin();
    await testDeleteDatabase();
    console.log('All delete database tests completed successfully.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();