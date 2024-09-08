import * as request from 'supertest';

const API_URL = 'http://localhost:6969';

async function runTests() {
  let accessToken: string;

  try {
    console.log('Creating user or logging in...');
    try {
      await request(API_URL)
        .post('/storage/user')
        .send({ username: 'mquser', password: 'mqpass' });
      console.log('User created successfully.');
    } catch (error) {
      console.log('User already exists, proceeding with login.');
    }

    const loginResponse = await request(API_URL)
      .post('/storage/login')
      .send({ username: 'mquser', password: 'mqpass' });

    accessToken = loginResponse.body.access_token;

    console.log('Assigning user to database 1...');
    await request(API_URL)
      .post('/storage/assign-db')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dbIndex: 1 });

    console.log('Testing rpush operation...');
    const rpushResponse = await request(API_URL)
      .post('/storage/rpush/1/queue')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ values: ['message1', 'message2', 'message3'] });

    console.log('RPush response status:', rpushResponse.status);
    console.log('RPush response text:', rpushResponse.text);

    console.log('Testing llen operation...');
    const llenResponse = await request(API_URL)
      .get('/storage/llen/1/queue')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('LLen response status:', llenResponse.status);
    console.log('LLen response text:', llenResponse.text);

    console.log('Testing lrange operation...');
    const lrangeResponse = await request(API_URL)
      .get('/storage/lrange/1/queue?start=0&stop=-1')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('LRange response status:', lrangeResponse.status);
    console.log('LRange response text:', lrangeResponse.text);

    console.log('Testing lpop operation...');
    const lpopResponse = await request(API_URL)
      .post('/storage/lpop/1/queue')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('LPop response status:', lpopResponse.status);
    console.log('LPop response text:', lpopResponse.text);

    console.log('Checking queue length after lpop...');
    const llenAfterPopResponse = await request(API_URL)
      .get('/storage/llen/1/queue')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('LLen after pop response status:', llenAfterPopResponse.status);
    console.log('LLen after pop response text:', llenAfterPopResponse.text);

    console.log('Checking queue contents after lpop...');
    const lrangeAfterPopResponse = await request(API_URL)
      .get('/storage/lrange/1/queue?start=0&stop=-1')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('LRange after pop response status:', lrangeAfterPopResponse.status);
    console.log('LRange after pop response text:', lrangeAfterPopResponse.text);

    console.log('All tests completed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();