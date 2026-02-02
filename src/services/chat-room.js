class ChatRoom {
  constructor() {
    this.usersByName = new Map();
    this.usernamesBySocketId = new Map();
  }

  addUser(username, socketId) {
    const normalized = this.normalizeName(username);
    if (!normalized) {
      return { success: false, reason: 'invalidName' };
    }

    if (this.usersByName.has(normalized)) {
      return { success: false, reason: 'nameRepeat' };
    }

    const user = this.buildUser(normalized, socketId);
    this.usersByName.set(normalized, user);
    this.usernamesBySocketId.set(socketId, normalized);

    return {
      success: true,
      user,
      users: this.listUsers()
    };
  }

  removeUser(socketId) {
    const username = this.usernamesBySocketId.get(socketId);
    if (!username) {
      return null;
    }

    this.usernamesBySocketId.delete(socketId);
    const user = this.usersByName.get(username);
    this.usersByName.delete(username);
    return user;
  }

  getUserByName(username) {
    return this.usersByName.get(username);
  }

  getUserBySocketId(socketId) {
    const username = this.usernamesBySocketId.get(socketId);
    return username ? this.usersByName.get(username) : undefined;
  }

  listUsers() {
    return Array.from(this.usersByName.values()).map((user) => ({ ...user }));
  }

  count() {
    return this.usersByName.size;
  }

  buildUser(username, socketId) {
    return {
      username,
      sessionid: socketId,
      userid: socketId,
      joinedAt: new Date().toISOString()
    };
  }

  normalizeName(username) {
    if (!username || typeof username !== 'string') {
      return '';
    }

    return username.trim();
  }
}

const chatRoom = new ChatRoom();

export default chatRoom;
