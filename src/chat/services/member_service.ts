import { Injectable } from '@nestjs/common';
import { Members, Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database_service';

@Injectable()
export class MemberService {
  constructor(private dbService: DatabaseService) {}

  async findOneByClientIdAsync(clientId: string): Promise<Members | null> {
    return await this.dbService.members.findUnique({
      where: {
        client_id: clientId,
      },
    });
  }

  async createAsync(data: Prisma.MembersCreateInput): Promise<Members> {
    return await this.dbService.members.create({
      data,
    });
  }

  async upsertByClientIdAsync(clientId: string, data: Prisma.MembersCreateInput): Promise<Members> {
    return await this.dbService.members.upsert({
      where: {
        client_id: clientId,
      },
      update: {
        room_id: data.room_id,
        device_type: data.device_type,
        device_id: data.device_id,
        nick_name: data.nick_name,
      },
      create: data,
    });
  }

  async deleteByClientIdAsync(clientId: string): Promise<void> {
    await this.dbService.members.deleteMany({
      where: {
        client_id: clientId,
      },
    });
  }
}
