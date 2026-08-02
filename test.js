import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// --- CONFIGURATION ---
const SOCKET_URL = 'ws://localhost:7000/socket.io/?EIO=4&transport=websocket';
const TARGET_ROOMS = 50; 

const connections = new Counter('ws_connections');
const joins = new Counter('ws_room_joins');
const messages = new Counter('ws_messages_sent');
const wsLatency = new Trend('ws_latency', true);

export const options = {
    stages: [
        { duration: '15s', target: 200 },  // Ramp up
        { duration: '30s', target: 1000 }, // Spike
        { duration: '15s', target: 0 },    // Ramp down
    ],
    thresholds: {
        ws_connections: ['count>0'],
    },
};

// HELPER: Generate a valid 24-character Hex string for MongoDB ObjectIds
function generateObjectId() {
    let result = '';
    const characters = 'abcdef0123456789';
    for (let i = 0; i < 24; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Pre-generate valid MongoDB Room IDs
const roomIds = [];
for (let i = 0; i < TARGET_ROOMS; i++) {
    roomIds.push(generateObjectId());
}

export default function () {
    // Assign a valid MongoDB ObjectId to the fake user
    const userId = generateObjectId();
    const username = `Tester_${__VU}`;
    
    // Pick a random Room ID from our valid list
    const roomId = roomIds[Math.floor(Math.random() * TARGET_ROOMS)]; 

    const res = ws.connect(SOCKET_URL, null, function (socket) {
        connections.add(1);
        let connectTime = Date.now();

        socket.on('open', () => {
            socket.send('40'); // Engine.IO init
            const joinPayload = `42["join-room",{"roomId":"${roomId}","userId":"${userId}","username":"${username}"}]`;
            socket.send(joinPayload);
            joins.add(1);
        });

        socket.on('message', (msg) => {
            if (msg === '2') socket.send('3'); // Ping/Pong
            
            if (msg.startsWith('42')) {
                const data = JSON.parse(msg.substring(2));
                if (data[0] === 'room-joined') {
                    wsLatency.add(Date.now() - connectTime);
                }
            }
        });

        socket.setInterval(function () {
            socket.send(`42["typing-start",{"roomId":"${roomId}","userId":"${userId}","username":"${username}"}]`);
            socket.send(`42["send-message",{"roomId":"${roomId}","userId":"${userId}","message":"Hello from k6!"}]`);
            messages.add(1);
            socket.send(`42["typing-stop",{"roomId":"${roomId}","userId":"${userId}","username":"${username}"}]`);
        }, 3000);

        socket.setTimeout(function () {
            socket.close();
        }, 35000); 
    });

    check(res, { 'status is 101 (Switching Protocols)': (r) => r && r.status === 101 });
    sleep(1); 
}