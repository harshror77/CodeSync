import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

// --- CONFIGURATION ---
const TARGET_USERS = 50; // Start with 50. CRDTs are extremely CPU heavy!
const YJS_URL = 'ws://localhost:1234';
const DOCUMENT_NAME = 'room_123::test_file.js'; // Matches your roomId::filePath format

console.log(`🚀 Starting Yjs CRDT Load Test with ${TARGET_USERS} concurrent editors...`);

let syncedUsers = 0;
let totalKeystrokes = 0;

for (let i = 1; i <= TARGET_USERS; i++) {
    // 1. Create a local Yjs Document for each "Bot"
    const ydoc = new Y.Doc();
    
    // 2. Connect the Bot to your Hocuspocus Server
    const provider = new HocuspocusProvider({
        url: YJS_URL,
        name: DOCUMENT_NAME,
        document: ydoc,
        // Disable logging so the terminal doesn't freeze
        quiet: true, 
    });

    // 3. Get the exact CodeMirror text instance your server tracks
    const ytext = ydoc.getText('codemirror');

    provider.on('synced', () => {
        syncedUsers++;
        if (syncedUsers === TARGET_USERS) {
            console.log(`✅ All ${TARGET_USERS} users successfully synced to the document!`);
            console.log(`🔥 Commencing Chaos Typing...`);
        }

        // 4. Simulate a user typing 5 times a second
        setInterval(() => {
            try {
                // Insert a random character at a random position
                const pos = Math.floor(Math.random() * ytext.length);
                const char = String.fromCharCode(97 + Math.floor(Math.random() * 26)); 
                
                ytext.insert(pos, char);
                totalKeystrokes++;

                // To prevent infinite memory growth during the test, delete old characters
                if (ytext.length > 5000) {
                    ytext.delete(0, 100);
                }
            } catch (e) {
                // Ignore indexing errors from extreme concurrent deletions
            }
        }, 200); 
    });
}

// Log stats every 2 seconds
setInterval(() => {
    console.log(`📊 Stats: ${totalKeystrokes} total keystrokes resolved across ${syncedUsers} active users.`);
}, 2000);