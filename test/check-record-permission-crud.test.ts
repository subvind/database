import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const user1 = { username: 'testuser1_record_perm', password: 'testpassword1' };
const user2 = { username: 'testuser2_record_perm', password: 'testpassword2' };
let token1: string;
let token2: string;

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

async function assignUserToDatabase(token: string, dbIndex: number): Promise<boolean> {
  try {
    await axios.post(`${BASE_URL}/storage/assign-db`, { dbIndex }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`User assigned to database ${dbIndex} successfully.`);
    return true;
  } catch (error) {
    console.log(`Failed to assign user to database ${dbIndex}: ${error.response?.data}`);
    return false;
  }
}

async function testRecordPermissions() {
  console.log('Testing record CRUD permissions...');

  // Assign User1 to database 30
  await assignUserToDatabase(token1, 30);

  // Assign User2 to database 31
  await assignUserToDatabase(token2, 31);

  // Test User1 creating a record in their database
  try {
    await axios.post(`${BASE_URL}/storage/set/30/testkey`, { value: 'testvalue' }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('Test passed: User1 successfully created a record in their database.');
  } catch (error) {
    console.error('Test failed: User1 could not create a record in their database.');
  }

  // Test User2 trying to read User1's record (should fail)
  try {
    await axios.get(`${BASE_URL}/storage/get/30/testkey`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.error('Test failed: User2 incorrectly allowed to read User1\'s record.');
  } catch (error) {
    console.log('Test passed: User2 correctly denied reading User1\'s record.');
  }

  // Test User2 trying to update User1's record (should fail)
  try {
    await axios.post(`${BASE_URL}/storage/set/30/testkey`, { value: 'newvalue' }, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.error('Test failed: User2 incorrectly allowed to update User1\'s record.');
  } catch (error) {
    console.log('Test passed: User2 correctly denied updating User1\'s record.');
  }

  // Test User2 trying to delete User1's record (should fail)
  try {
    await axios.post(`${BASE_URL}/storage/del/30`, { keys: ['testkey'] }, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.error('Test failed: User2 incorrectly allowed to delete User1\'s record.');
  } catch (error) {
    console.log('Test passed: User2 correctly denied deleting User1\'s record.');
  }

  // Test User1 reading their own record
  try {
    const response = await axios.get(`${BASE_URL}/storage/get/30/testkey`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    if (response.data === 'testvalue') {
      console.log('Test passed: User1 successfully read their own record.');
    } else {
      console.error('Test failed: User1 read incorrect value from their record.');
    }
  } catch (error) {
    console.error('Test failed: User1 could not read their own record.');
  }

  // Test User1 updating their own record
  try {
    await axios.post(`${BASE_URL}/storage/set/30/testkey`, { value: 'updatedvalue' }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('Test passed: User1 successfully updated their own record.');
  } catch (error) {
    console.error('Test failed: User1 could not update their own record.');
  }

  // Test User1 deleting their own record
  try {
    await axios.post(`${BASE_URL}/storage/del/30`, { keys: ['testkey'] }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('Test passed: User1 successfully deleted their own record.');
  } catch (error) {
    console.error('Test failed: User1 could not delete their own record.');
  }
}

async function runTests() {
  try {
    token1 = await createUserAndLogin(user1.username, user1.password);
    token2 = await createUserAndLogin(user2.username, user2.password);

    await testRecordPermissions();
    console.log('All record permission CRUD tests completed.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();