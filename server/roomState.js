// This Map is the "hot" live state of all active rooms.
// It lives in server RAM — fast reads/writes, no DB overhead.
// we can't save every keystroke in mongodb cause it will be too slow and overload so we save all those details in RAM to access is faster and once we save the data before closing the app, everything gets saved in db 
// this is the temporary storage or temoporary real-time db
// approach: step1- first make an epmty registery: rooms = new Map() step2- think about what actions are going to happen in socket.io and make functions for each action step3- 
const rooms = new Map(); //js build in object- good for key value pairs and baar-baar Add/Remove karne ke liye zyada fast aur better hota hai. This is an empty registy or db (jo sirf RAM me rahega) jahan saare active rooms ka data aayega.

// Assign a unique color to each user so their cursor is distinguishable
const COLORS = [
  "#f9802a", "#8b5cf6", "#06b6d4",
  "#10b981", "#ef4444", "#99650d",
];

const getRoom = (roomId) => rooms.get(roomId); //arrow function where implicit(automatic) return use hua hai cause it doesn't have curly braces. (roomId): Input parameter hai. rooms.get(roomId):Map ka inbuilt function .get() hai jo ek key ki value nikalta hai and Map se uss ID waali room ka data nikalega.

const initRoom = (roomId, code = "") => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { code, users: [], cursors: {} });
  }
  return rooms.get(roomId);
};  //this function is for creating/initializing rooms 
/*Syntax & Logic:
code = "" -> Ise Default Parameter kehte hain. Agar kisi ne code pass nahi kiya, toh wo automatically empty string "" maan lega.
!rooms.has(roomId) -> .has() check karta hai ki kya ye key (roomId) Map mein pehle se hai? ! (Not) operator laga hai, matlab "Agar room pehle se NAHI hai".
rooms.set(Key, Value) -> Naya record banata hai.
{ code, users: [], cursors: {} } -> Ye us room ki "Value" ek Object hai. Jisme 3 cheezein hain:
code: Abhi screen par kya code likha hai (String).
users: Ek empty Array [] (jisme log judenge).
cursors: Ek empty Object {} (jisme sabki mouse positions store hongi).
Uske baad ye bani hui information return kar deta hai.
*/

const addUser = (roomId, userInfo) => {
  const room = getRoom(roomId);
  if (!room) return;
  // Assign color based on how many users are already in room
  const color = COLORS[room.users.length % COLORS.length];
  room.users.push({ ...userInfo, color });
};
/*
Logic: getRoom bula ke room dhoondho. Agar wo room nahi mila to wahi se function se bahar nikal jao (taaki badme error na aaye). Ise "Guard Clause" bolte hain.
Syntax & Logic:
Pehli line mein Modulo (%) operator se safe color nikal liya. (Jo maine aapko upar wale answer me bataya).
.push() ek Array function hai jo ek naye Item ko Array ke end (aakhiri) mein daal deta hai.
{ ...userInfo, color } -> Ye bahut important syntax hai jise Spread Operator (...) bolte hain. Iska matlab hai ki userInfo object ke andar jo bhi properties pehle se aayi hain (jaise username, id) un sabko "khool ke" idhar daal do, aur uske saath-saath apni taraf se ek aur field add kardo jiska naam color hai.
*/

const removeUser = (roomId, socketId) => {
  const room = getRoom(roomId);
  if (!room) return;
  room.users = room.users.filter((u) => u.socketId !== socketId);
  delete room.cursors[socketId];
  // If room is empty, clean it up from RAM
  if (room.users.length === 0) rooms.delete(roomId);
};

const updateCode = (roomId, code) => {
  const room = getRoom(roomId);
  if (room) room.code = code;
};

const updateCursor = (roomId, socketId, position) => {
  const room = getRoom(roomId);
  if (room) room.cursors[socketId] = position;
};

module.exports = { initRoom, getRoom, addUser, removeUser, updateCode, updateCursor };

// Why a separate file for roomState? Both index.js (where you attach Socket.io) and socketHandlers.js need access to the same Map. If you define the Map inside either file, the other can't share it. A dedicated module exports a single shared instance — Node.js caches module exports, so everyone importing roomState.js gets the exact same Map object.