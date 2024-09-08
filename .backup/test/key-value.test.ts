import * as request from 'supertest';
import { NestApplication } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NestFactory } from '@nestjs/core';

async function runTests() {
  let app: NestApplication;
  let accessToken: string;

  try {
    console.log('Initializing application...');
    app = await NestFactory.create(AppModule);
    await app.init();

    console.log('Creating user and getting access token...');
    await request(app.getHttpServer())
      .post('/storage/user')
      .send({ username: 'testuser', password: 'testpass' });

    const loginResponse = await request(app.getHttpServer())
      .post('/storage/login')
      .send({ username: 'testuser', password: 'testpass' });

    accessToken = loginResponse.body.access_token;

    console.log('Assigning user to database 0...');
    await request(app.getHttpServer())
      .post('/storage/assign-db')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dbIndex: 0 });

    console.log('Testing set and get operations...');
    const setResponse = await request(app.getHttpServer())
      .post('/storage/set/0/testkey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'testvalue' });

    console.log('Set response status:', setResponse.status);
    console.log('Set response text:', setResponse.text);

    const getResponse = await request(app.getHttpServer())
      .get('/storage/get/0/testkey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get response status:', getResponse.status);
    console.log('Get response text:', getResponse.text);

    console.log('Testing increment operation...');
    await request(app.getHttpServer())
      .post('/storage/set/0/counter')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: '10' });

    const incrResponse = await request(app.getHttpServer())
      .post('/storage/incr/0/counter')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Increment response status:', incrResponse.status);
    console.log('Increment response text:', incrResponse.text);

    const getIncrResponse = await request(app.getHttpServer())
      .get('/storage/get/0/counter')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get incremented value status:', getIncrResponse.status);
    console.log('Get incremented value text:', getIncrResponse.text);

    console.log('Testing delete operation...');
    await request(app.getHttpServer())
      .post('/storage/set/0/deletekey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'to be deleted' });

    const deleteResponse = await request(app.getHttpServer())
      .post('/storage/del/0')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ keys: ['deletekey'] });

    console.log('Delete response status:', deleteResponse.status);
    console.log('Delete response text:', deleteResponse.text);

    const getDeletedResponse = await request(app.getHttpServer())
      .get('/storage/get/0/deletekey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get deleted key status:', getDeletedResponse.status);
    console.log('Get deleted key text:', getDeletedResponse.text);

    console.log('Testing exists operation...');
    await request(app.getHttpServer())
      .post('/storage/set/0/existkey1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'value1' });

    await request(app.getHttpServer())
      .post('/storage/set/0/existkey2')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'value2' });

    const existsResponse = await request(app.getHttpServer())
      .get('/storage/exists/0?keys=existkey1&keys=existkey2&keys=nonexistentkey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Exists response status:', existsResponse.status);
    console.log('Exists response text:', existsResponse.text);

    console.log('Testing expiration operation...');
    await request(app.getHttpServer())
      .post('/storage/set/0/expirekey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'will expire' });

    const expireResponse = await request(app.getHttpServer())
      .post('/storage/expire/0/expirekey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ seconds: 1 });

    console.log('Expire response status:', expireResponse.status);
    console.log('Expire response text:', expireResponse.text);

    console.log('Waiting for 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const getExpiredResponse = await request(app.getHttpServer())
      .get('/storage/get/0/expirekey')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Get expired key status:', getExpiredResponse.status);
    console.log('Get expired key text:', getExpiredResponse.text);

    console.log('All tests completed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (app) {
      await app.close();
      console.log('Application closed.');
    }
  }
}

runTests();