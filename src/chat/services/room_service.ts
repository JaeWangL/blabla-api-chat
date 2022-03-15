import { Injectable } from '@nestjs/common';
import { Prisma, Rooms } from '@prisma/client';
import { DatabaseService } from '../../database/database_service';

@Injectable()
export class RoomService {
  constructor(private dbService: DatabaseService) {}

  async findOneByRoomIdAsync(roomId: string): Promise<Rooms | null> {
    return await this.dbService.rooms.findUnique({
      where: {
        room_id: roomId,
      },
    });
  }

  async createAsync(data: Prisma.RoomsCreateInput): Promise<Rooms> {
    return await this.dbService.rooms.create({
      data,
    });
  }

  async updateByRoomIdAsync(roomId: string, data: Prisma.RoomsUpdateInput): Promise<void> {
    await this.dbService.rooms.update({
      where: {
        room_id: roomId,
      },
      data,
    });
  }

  async decreaseMemberCountAsync(roomId: string): Promise<Rooms> {
    return await this.dbService.rooms.update({
      where: {
        room_id: roomId,
      },
      data: {
        accumulated_members_count: {
          decrement: 1,
        },
      },
    });
  }

  async upsertByRoomIdAsync(roomId: string): Promise<Rooms> {
    return await this.dbService.rooms.upsert({
      where: {
        room_id: roomId,
      },
      update: {
        accumulated_members_count: {
          increment: 1,
        },
      },
      create: {
        room_id: roomId,
        accumulated_members_count: 1,
      },
    });
  }

  async deleteByRoomIdAsync(roomId: string): Promise<void> {
    await this.dbService.rooms.delete({
      where: {
        room_id: roomId,
      },
    });
  }
}
