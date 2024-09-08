import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const adminUsername = 'root';
const adminPassword = 'root';
const regularUsername = 'regular_user';
const regularPassword = 'regular_password';
let adminToken: string;
let regularToken: string;

async function createUserAndLogin(username: string, password: string): Promise<string> {
  console.log(`Creating user or logging in for ${username}...`);
  try {
    await axios.post(`${BASE_URL}/storage/user`, { username, password });
    console.log(`User ${username} created successfully.`);
  } catch (error) {
    console.log(`User ${username} already exists, proceeding to login.`);
  }

  const loginResponse = await axios.post(`${BASE_URL}/storage/login`, { username, password });
  return loginResponse.data.access_token;
}

async function testListUsers() {
  console.log('Testing list users operation...');

  // Test with admin user
  try {
    const listUsersResponse = await axios.get(`${BASE_URL}/storage/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('List users response status:', listUsersResponse.status);
    console.log('List users response data:', listUsersResponse.data);

    if (listUsersResponse.data.includes(adminUsername) && listUsersResponse.data.includes(regularUsername)) {
      console.log('List users test passed for admin: Both users are present in the list.');
    } else {
      console.error('List users test failed for admin: Not all expected users are present in the list.');
    }
  } catch (error) {
    console.error('List users test failed for admin:', error.response?.status, error.response?.data);
  }

  // Test with regular user (should fail)
  try {
    await axios.get(`${BASE_URL}/storage/users`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    console.error('List users test failed: Regular user should not have access to list all users.');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('List users test passed for regular user: Unauthorized access prevented as expected.');
    } else {
      console.error('List users test failed for regular user with unexpected error:', error.response?.status, error.response?.data);
    }
  }
}

async function runTests() {
  try {
    adminToken = await createUserAndLogin(adminUsername, adminPassword);
    regularToken = await createUserAndLogin(regularUsername, regularPassword);

    // Ensure admin user has admin privileges (this might need to be done manually or through a separate API call)
    console.log('Note: Ensure that the admin user has been granted admin privileges in the system.');

    await testListUsers();
    console.log('All list users tests completed.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();