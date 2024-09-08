import axios from 'axios';

const BASE_URL = 'http://localhost:6969';
const user1 = { username: 'testuser1_del_perm', password: 'testpassword1' };
const user2 = { username: 'testuser2_del_perm', password: 'testpassword2' };
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

async function deleteDatabase(token: string, dbIndex: number): Promise<boolean> {
  try {
    await axios.delete(`${BASE_URL}/storage/database/${dbIndex}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Database ${dbIndex} deleted successfully.`);
    return true;
  } catch (error) {
    console.log(`Failed to delete database ${dbIndex}: ${error.response?.data}`);
    return false;
  }
}

async function testDatabaseDeletionPermissions() {
  console.log('Testing database deletion permissions...');

  // Assign User1 to database 20
  await assignUserToDatabase(token1, 20);

  // Assign User2 to database 21
  await assignUserToDatabase(token2, 21);

  // Test User2 trying to delete User1's database (should fail)
  const deleteResult2 = await deleteDatabase(token2, 20);
  if (!deleteResult2) {
    console.log('Test passed: User2 correctly denied deletion of User1\'s database (20).');
  } else {
    console.error('Test failed: User2 incorrectly allowed to delete User1\'s database (20).');
  }

  // Test User1 trying to delete User2's database (should fail)
  const deleteResult4 = await deleteDatabase(token1, 21);
  if (!deleteResult4) {
    console.log('Test passed: User1 correctly denied deletion of User2\'s database (21).');
  } else {
    console.error('Test failed: User1 incorrectly allowed to delete User2\'s database (21).');
  }

  // Verify database assignments after attempted deletions
  const user1DatabasesA = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  console.log('User1 databases after attempted deletions:', user1DatabasesA.data);

  const user2DatabasesA = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token2}` }
  });
  console.log('User2 databases after attempted deletions:', user2DatabasesA.data);

  // Test User1 deleting their own database (should succeed)
  const deleteResult1 = await deleteDatabase(token1, 20);
  if (deleteResult1) {
    console.log('Test passed: User1 successfully deleted their own database (20).');
  } else {
    console.error('Test failed: User1 could not delete their own database (20).');
  }
  
  // Test User2 deleting their own database (should succeed)
  const deleteResult3 = await deleteDatabase(token2, 21);
  if (deleteResult3) {
    console.log('Test passed: User2 successfully deleted their own database (21).');
  } else {
    console.error('Test failed: User2 could not delete their own database (21).');
  }

  // Verify database assignments after deletions
  const user1Databases = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  console.log('User1 databases after deletions:', user1Databases.data);

  const user2Databases = await axios.get(`${BASE_URL}/storage/databases`, {
    headers: { Authorization: `Bearer ${token2}` }
  });
  console.log('User2 databases after deletions:', user2Databases.data);

  if (!user1Databases.data.includes(20) && !user2Databases.data.includes(21)) {
    console.log('Test passed: Database assignments are correct after deletions.');
  } else {
    console.error('Test failed: Database assignments are incorrect after deletions.');
  }

  if (user1DatabasesA.data.includes(20) && user2DatabasesA.data.includes(21)) {
    console.log('Test passed: Database assignments are correct after attempted deletions.');
  } else {
    console.error('Test failed: Database assignments are incorrect after deletions.');
  }
}

async function runTests() {
  try {
    token1 = await createUserAndLogin(user1.username, user1.password);
    token2 = await createUserAndLogin(user2.username, user2.password);

    await testDatabaseDeletionPermissions();
    console.log('All database deletion permission tests completed.');
  } catch (error) {
    console.error('An error occurred during testing:', error.message);
  }
}

runTests();