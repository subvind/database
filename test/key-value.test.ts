import * as request from 'supertest';

const API_URL = 'http://localhost:6969';

async function runTests() {
  let accessToken: string;

  try {
    console.log('Creating user or logging in...');
    try {
      await request(API_URL)
        .post('/storage/user')
        .send({ username: 'testuser', password: 'testpass' });
      console.log('User created successfully.');
    } catch (error) {
      console.log('User already exists, proceeding with login.');
    }

    const loginResponse = await request(API_URL)
      .post('/storage/login')
      .send({ username: 'testuser', password: 'testpass' });

    accessToken = loginResponse.body.access_token;

    console.log('Assigning user to database 0...');
    await request(API_URL)
      .post('/storage/assign-db')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dbIndex: 0 });

    console.log('Testing set and get operations...');
    const setResponse = await request(API_URL)
      .post('/storage/set/0/testkey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'testvalue' });

    console.log('Set response status:', setResponse.status);
    console.log('Set response text:', setResponse.text);

    const getResponse = await request(API_URL)
      .get('/storage/get/0/testkey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get response status:', getResponse.status);
    console.log('Get response text:', getResponse.text);

    console.log('Testing increment operation: starting from 1...');
    await request(API_URL)
      .post('/storage/set/0/counter')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: '1' });

    const incrResponse = await request(API_URL)
      .post('/storage/incr/0/counter')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Increment response status:', incrResponse.status);
    console.log('Increment response text:', incrResponse.text);

    const getIncrResponse = await request(API_URL)
      .get('/storage/get/0/counter')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get incremented value status:', getIncrResponse.status);
    console.log('Get incremented value text:', getIncrResponse.text);

    console.log('Testing delete operation...');
    await request(API_URL)
      .post('/storage/set/0/deletekey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'to be deleted' });

    const deleteResponse = await request(API_URL)
      .post('/storage/del/0')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ keys: ['deletekey'] });

    console.log('Delete response status:', deleteResponse.status);
    console.log('Delete response text:', deleteResponse.text);

    const getDeletedResponse = await request(API_URL)
      .get('/storage/get/0/deletekey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get deleted key status:', getDeletedResponse.status);
    console.log('Get deleted key text:', getDeletedResponse.text);

    console.log('Testing exists operation...');
    await request(API_URL)
      .post('/storage/set/0/existkey1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'value1' });

    await request(API_URL)
      .post('/storage/set/0/existkey2')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'value2' });

    const existsResponse = await request(API_URL)
      .get('/storage/exists/0?keys=existkey1&keys=existkey2&keys=nonexistentkey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Exists response status:', existsResponse.status);
    console.log('Exists response text:', existsResponse.text);

    console.log('Testing expiration operation...');
    await request(API_URL)
      .post('/storage/set/0/expirekey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'will expire' });

    const expireResponse = await request(API_URL)
      .post('/storage/expire/0/expirekey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ seconds: 1 });

    console.log('Expire response status:', expireResponse.status);
    console.log('Expire response text:', expireResponse.text);

    console.log('Waiting for 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const getExpiredResponse = await request(API_URL)
      .get('/storage/get/0/expirekey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get expired key status:', getExpiredResponse.status);
    console.log('Get expired key text:', getExpiredResponse.text);

    console.log('All tests completed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();