export class JoinRoomRequest {
  roomId: string;

  /**
   *  1: Android
   *  2: iOS
   */
  deviceType: 1 | 2;

  deviceId: string;
}

export class LeaveRoomRequest {
  roomId: string;

  /**
   *  1: Android
   *  2: iOS
   */
  deviceType: 1 | 2;

  deviceId: string;

  nickName: string;
}

export class SendMessageRequest {
  roomId: string;

  nickName: string;

  message: string;
}

export class SentMessage {
  nickName: string;

  message: string;
}
