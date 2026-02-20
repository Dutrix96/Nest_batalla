import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('No hay usuario');

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  ranking(take: number = 50) {
    const safeTake = Math.max(1, Math.min(200, take));

    return this.prisma.user.findMany({
      take: safeTake,
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' },
        { wins: 'desc' },
        { email: 'asc' },
      ],
      select: {
        id: true,
        email: true,
        role: true,
        level: true,
        xp: true,
        wins: true,
        losses: true,
      },
    });
  }

  async addXp(userId: number, xpGanada: number) {
    if (!Number.isFinite(xpGanada) || xpGanada <= 0) {
      return this.findOne(userId);
    }

    const user = await this.findOne(userId);

    let nivel = user.level;
    let xp = user.xp + xpGanada;

    while (xp >= nivel * 100) {
      xp -= nivel * 100;
      nivel += 1;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { level: nivel, xp },
      select: {
        id: true,
        email: true,
        role: true,
        level: true,
        xp: true,
        wins: true,
        losses: true,
      },
    });
  }
}