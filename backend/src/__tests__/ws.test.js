import WebSocket from 'ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import GroupBudget from '../groupBudget.js';
import express from 'express';
import { Server } from 'http';

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

// Test suite for web socket, unresolved issue exists: meta url
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
});
