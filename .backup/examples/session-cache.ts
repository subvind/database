import { DatabaseClient } from "../client/index";

const database = new DatabaseClient('http://localhost:6969');

async function main() {
  try {
    console.log('Creating user or logging in...');
    await database.createUser('sessionuser', 'sessionpass');

    await database.login('sessionuser', 'sessionpass');
    console.log('Logged in successfully.');

    console.log('Assigning user to database 3...');
    await database.assignUserToDatabase(3);

    // Simulating a session
    const sessionId = 'user123_session';
    
    console.log('Setting session data...');
    await database.set(3, sessionId, JSON.stringify({
      userId: 'user123',
      lastAccess: new Date().toISOString(),
      data: {
        cart: ['item1', 'item2'],
        preferences: { theme: 'dark' }
      }
    }));

    console.log('Setting session expiration...');
    await database.expire(3, sessionId, 3600); // Expire in 1 hour

    console.log('Retrieving session data...');
    const sessionData = await database.get(3, sessionId);
    console.log('Session data:', sessionData);

    console.log('Updating session data...');
    const updatedSessionData = JSON.parse(sessionData);
    updatedSessionData.data.cart.push('item3');
    await database.set(3, sessionId, JSON.stringify(updatedSessionData));

    console.log('Retrieving updated session data...');
    const updatedData = await database.get(3, sessionId);
    console.log('Updated session data:', updatedData);

    console.log('Simulating session logout...');
    await database.del(3, [sessionId]);

    console.log('Verifying session deletion...');
    const deletedSession = await database.get(3, sessionId);
    console.log('Deleted session data:', deletedSession);

    console.log('Cleaning up database...');
    await database.deleteDatabase(3);

    console.log('Session cache demonstration completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();