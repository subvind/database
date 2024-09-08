import * as request from 'supertest';

const API_URL = 'http://localhost:6969';

async function runTests() {
  let accessToken: string;

  try {
    console.log('Creating user or logging in...');
    try {
      await request(API_URL)
        .post('/storage/user')
        .send({ username: 'cacheuser', password: 'cachepass' });
      console.log('User created successfully.');
    } catch (error) {
      console.log('User already exists, proceeding with login.');
    }

    const loginResponse = await request(API_URL)
      .post('/storage/login')
      .send({ username: 'cacheuser', password: 'cachepass' });

    accessToken = loginResponse.body.access_token;

    console.log('Assigning user to database 2...');
    await request(API_URL)
      .post('/storage/assign-db')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dbIndex: 2 });

    console.log('Testing session set operation...');
    const setResponse = await request(API_URL)
      .post('/storage/set/2/sessionkey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'sessionvalue' });

    console.log('Session set response status:', setResponse.status);
    console.log('Session set response text:', setResponse.text);

    console.log('Testing session get operation...');
    const getResponse = await request(API_URL)
      .get('/storage/get/2/sessionkey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Session get response status:', getResponse.status);
    console.log('Session get response text:', getResponse.text);

    console.log('Testing session delete operation...');
    const deleteResponse = await request(API_URL)
      .post('/storage/del/2')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ keys: ['sessionkey'] });

    console.log('Session delete response status:', deleteResponse.status);
    console.log('Session delete response text:', deleteResponse.text);

    console.log('Verifying session key deletion...');
    const getDeletedResponse = await request(API_URL)
      .get('/storage/get/2/sessionkey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get deleted session key status:', getDeletedResponse.status);
    console.log('Get deleted session key text:', getDeletedResponse.text);

    console.log('Testing session expiration...');
    await request(API_URL)
      .post('/storage/set/2/expiringkey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'expiringvalue' });

    await request(API_URL)
      .post('/storage/expire/2/expiringkey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ seconds: 2 });

    console.log('Waiting for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const getExpiredResponse = await request(API_URL)
      .get('/storage/get/2/expiringkey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get expired session key status:', getExpiredResponse.status);
    console.log('Get expired session key text:', getExpiredResponse.text);

    console.log('All session cache tests completed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();