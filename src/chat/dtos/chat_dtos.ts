export class JoinRoomRequest {
  roomId: string;

  /**
   *  1: Android
   *  2: iOS
   */
  deviceType: 1 | 2;

  deviceId: string;
}

export class SendMessageRequest {
  roomId: string;

  nickName: string;

  message: string;
}

export class SentMessage {
  nickName: string;

  message: string;

  createdAt: Date;
}

export class JoinedNewMember {
  nickName: string;

  joinedAt: Date;
}

export class LeavedExistingMember {
  nickName: string;

  leavedAt: Date;
}
