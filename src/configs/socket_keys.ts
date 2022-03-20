export enum SocketSubMessageTypes {
  JOIN_ROOM = 'joinRoom',
  SEND_MESSAGE = 'sendMessage',
}

export enum SocketPubMessageTypes {
  RATE_LIMITED = 'rateLimited',
  GET_PROFILE = 'getProfile',
  JOINED_NEW_MEMBER = 'joinedNewMember',
  LEAVED_EXISTING_MEMBER = 'leavedExistingMember',
  NEW_MESSAGE = 'newMessage',
}
