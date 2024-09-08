import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const user1 = { username: 'testuser1_perm', password: 'testpassword1' };
const user2 = { username: 'testuser2_perm', password: 'testpassword2' };
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

async function testDatabasePermissions() {
  console.log('Testing database permissions...');

  // Test assigning to a new database
  const assignResult1 = await assignUserToDatabase(token1, 10);
  if (assignResult1) {
    console.log('Test passed: User1 successfully assigned to database 10.');
  } else {
    console.error('Test failed: User1 could not be assigned to database 10.');
  }

  // Test assigning to the same database with a different user (should fail)
  const assignResult2 = await assignUserToDatabase(token2, 10);
  if (!assignResult2) {
    console.log('Test passed: User2 correctly denied assignment to database 10.');
  } else {
    console.error('Test failed: User2 was incorrectly assigned to database 10.');
  }

  // Test assigning User2 to a different database
  const assignResult3 = await assignUserToDatabase(token2, 11);
  if (assignResult3) {
    console.log('Test passed: User2 successfully assigned to database 11.');
  } else {
    console.error('Test failed: User2 could not be assigned to database 11.');
  }

  // Verify database assignments
  const user1Databases = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  console.log('User1 databases:', user1Databases.data);

  const user2Databases = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token2}` }
  });
  console.log('User2 databases:', user2Databases.data);

  if (user1Databases.data.includes(10) && !user1Databases.data.includes(11) &&
      user2Databases.data.includes(11) && !user2Databases.data.includes(10)) {
    console.log('Test passed: Database assignments are correct for both users.');
  } else {
    console.error('Test failed: Database assignments are incorrect.');
  }
}

async function runTests() {
  try {
    token1 = await createUserAndLogin(user1.username, user1.password);
    token2 = await createUserAndLogin(user2.username, user2.password);

    await testDatabasePermissions();
    console.log('All permission tests completed.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();