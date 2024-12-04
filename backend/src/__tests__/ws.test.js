import WebSocket from 'ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import GroupBudget from '../groupBudget.js';
import express from 'express';
import { Server } from 'http';
import { Observable } from '../Observer.js';


// Mock firebaseConfig.js, fixed path not found error
jest.mock('../firebaseConfig.js', () => ({
  db: {}, // Mocked Firestore database object
  storage: {}, // Mocked Storage object
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  getDoc: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(),
}));

// Test suite for web socket and observer
describe('WebSocket Server', () => {
  let server;
  let wss;
  let app;
  let port;

  const clients = {};
  const groupBudgets = {};

  beforeAll((done) => {
    // Setup Express and WebSocket server like in server.mjs
    app = express();
    server = createServer(app);
    wss = new WebSocketServer({ server });

    // Start server on a dynamic port
    server.listen(() => {
      port = server.address().port;
      done();
    });

    // Mock WebSocket events, including create and add GroupBudget
    wss.on('connection', (socket) => {
      socket.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.action === 'connect' && data.userId) {
          clients[data.userId] = socket;

          if (!groupBudgets[data.userId]) {
            groupBudgets[data.userId] = new GroupBudget(data.userId);
            groupBudgets[data.userId].clients = clients;
          }
        }
      });

      socket.on('close', () => {
        const userId = Object.keys(clients).find((id) => clients[id] === socket);
        if (userId) {
          delete clients[userId];
        }
      });
    });
  });

  afterAll((done) => {
    wss.close();
    server.close(done);
  });

  test('accept WebSocket connection', (done) => {
    const ws = new WebSocket(`ws://localhost:${port}`);

    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    ws.on('close', () => {
      done();
    });
  });

  test('handle connect action and update clients', (done) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    const userId = 'user123';

    ws.on('open', () => {
      ws.send(JSON.stringify({ action: 'connect', userId }));

      // Wait a moment for server to process the message
      setTimeout(() => {
        expect(clients[userId]).toBeDefined();
        expect(clients[userId]).toBeInstanceOf(WebSocket);

        ws.close();
        done();
      }, 50);
    });
  });

  test('clean up client on disconnect', (done) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    const userId = 'user456';

    ws.on('open', () => {
      ws.send(JSON.stringify({ action: 'connect', userId }));
      setTimeout(() => {
        ws.close();
      }, 50);
    });

    ws.on('close', () => {
      setTimeout(() => {
        expect(clients[userId]).toBeUndefined();
        done();
      }, 50);
    });
  });

  test('initialize GroupBudget for new user', (done) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    const userId = 'user789';

    ws.on('open', () => {
      ws.send(JSON.stringify({ action: 'connect', userId }));

      setTimeout(() => {
        expect(groupBudgets[userId]).toBeDefined();
        expect(groupBudgets[userId]).toBeInstanceOf(GroupBudget);

        ws.close();
        done();
      }, 50);
    });
  });

  test('notifyGroup sends messages to all group clients', (done) => {
    const ws1 = new WebSocket(`ws://localhost:${port}`);
    const ws2 = new WebSocket(`ws://localhost:${port}`);
    const groupId = 'testGroup';
    const userId1 = 'user1';
    const userId2 = 'user2';
    const mockMessage = { action: 'test', data: 'Hello Group!' };

    ws1.on('open', () => {
      ws1.send(JSON.stringify({ action: 'connect', userId: userId1 }));
    });

    ws2.on('open', () => {
      ws2.send(JSON.stringify({ action: 'connect', userId: userId2 }));
    });

    setTimeout(() => {
      // Mock a group and its clients
      groupBudgets[userId1].clients[groupId] = [
        { uid: userId1, socket: clients[userId1] },
        { uid: userId2, socket: clients[userId2] },
      ];

      // Spy on WebSocket send
      const spySend1 = jest.spyOn(clients[userId1], 'send');
      const spySend2 = jest.spyOn(clients[userId2], 'send');

      // Trigger notifyGroup
      groupBudgets[userId1].notifyGroup(groupId, mockMessage);

      // Verify that both clients received the message
      expect(spySend1).toHaveBeenCalledWith(
        JSON.stringify({ ...mockMessage, receiverId: userId1 })
      );
      expect(spySend2).toHaveBeenCalledWith(
        JSON.stringify({ ...mockMessage, receiverId: userId2 })
      );

      ws1.close();
      ws2.close();
      done();
    }, 100);
  });

  test('notifyGroup do nothing if groupId does not exist in clients', () => {
    const groupBudget = new GroupBudget('user1');
    const mockMessage = { action: 'test', data: 'No Group!' };
  
    // Ensure clients[groupId] is undefined
    groupBudget.clients = {};
    groupBudget.notifyGroup('nonexistentGroup', mockMessage);
  
    // Expect no errors and no messages sent
    expect(groupBudget.clients['nonexistentGroup']).toBeUndefined();
  });
  
  test('notifyGroup outputs "No active clients" if socket is not open', () => {
    const groupBudget = new GroupBudget('user1');
    const groupId = 'testGroup';
    const mockMessage = { action: 'test', data: 'Socket Closed!' };
  
    // Mock clients with a socket not in OPEN state
    const mockSocket = {
      readyState: WebSocket.CLOSED,
      send: jest.fn(),
    };
    groupBudget.clients[groupId] = [{ uid: 'user1', socket: mockSocket }];
  
    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
    groupBudget.notifyGroup(groupId, mockMessage);
  
    // Verify log output
    expect(consoleSpy).toHaveBeenCalledWith(`No active clients for group ${groupId}`);
    expect(mockSocket.send).not.toHaveBeenCalled();
  
    consoleSpy.mockRestore();
  });

  test('addObserver adds an observer to the observers list', () => {
    const observable = new Observable();
    observable.observers = []; //empty observer

    const observer = jest.fn(); // Mock a function as an observer
    observable.addObserver(observer);

    expect(observable.observers).toContain(observer); // Check if the observer was added
    expect(observable.observers.length).toBe(1); // Check the length of the observers list
});

  test('removeObserver removes an observer from the observers list', () => {
    const observable = new Observable();
    const observer1 = jest.fn();
    const observer2 = jest.fn();

    observable.observers = [observer1, observer2]; // Initialize observers list with two observers

    observable.removeObserver(observer1);

    expect(observable.observers).not.toContain(observer1); // Check if observer1 was removed
    expect(observable.observers).toContain(observer2); // Ensure observer2 is still in the list
    expect(observable.observers.length).toBe(1); // Ensure the length is correct
  });


  
});