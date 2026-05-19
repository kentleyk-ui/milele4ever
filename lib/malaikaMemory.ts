export type Role = "user" | "assistant";
export type Mode = "staff" | "public";

export type MemoryItem = {
  id: string;
  userId?: string;
  mode: Mode;
  role: Role;
  message: string;
  timestamp: number;
};

const staffMemory: MemoryItem[] = [];
const userMemory: MemoryItem[] = [];

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function addStaffMemory(role: Role, message: string) {
  staffMemory.push({
    id: makeId(),
    mode: "staff",
    role,
    message,
    timestamp: Date.now()
  });
}

export function getStaffHistory(limit = 50) {
  return staffMemory.slice(-limit);
}

export function addUserMemory(userId: string, role: Role, message: string) {
  userMemory.push({
    id: makeId(),
    mode: "public",
    userId,
    role,
    message,
    timestamp: Date.now()
  });
}

export function getUserHistory(userId: string, limit = 50) {
  return userMemory.filter(m => m.userId === userId).slice(-limit);
}

export function clearStaffMemory() {
  staffMemory.splice(0, staffMemory.length);
}

export function clearUserMemory(userId?: string) {
  if (userId) {
    const indices: number[] = [];
    userMemory.forEach((m, i) => { if (m.userId === userId) indices.push(i); });
    for (let i = indices.length - 1; i >= 0; i--) userMemory.splice(indices[i], 1);
  } else {
    userMemory.splice(0, userMemory.length);
  }
}
