import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { AttackDto } from './dto/attack.dto';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCharacterDto) {
    return this.prisma.character.create({
      data: {
        name: dto.name.trim(),
        maxHp: dto.maxHp,
        hp: dto.maxHp,
        attack: dto.attack,
        requiredLevel: dto.requiredLevel,
      },
    });
  }

  findAll() {
    return this.prisma.character.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const character = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!character) throw new NotFoundException('Muñeco no encontrado');
    return character;
  }

  async update(id: number, dto: UpdateCharacterDto) {
    await this.findOne(id);

    return this.prisma.character.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        maxHp: dto.maxHp,
        attack: dto.attack,
        requiredLevel: dto.requiredLevel,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.character.delete({
      where: { id },
    });
  }

  async resetAllHp() {
    await this.prisma.$executeRawUnsafe(
      `UPDATE "Character" SET "hp" = "maxHp";`,
    );

    return { message: 'Bienvenido de nuevo' };
  }

  async attack(dto: AttackDto) {
    if (dto.attackerId === dto.targetId) {
      throw new BadRequestException('No deberias pegarte a ti mismo');
    }

    const attacker = await this.findOne(dto.attackerId);
    const target = await this.findOne(dto.targetId);

    const newHp = Math.max(0, target.hp - attacker.attack);

    const updatedTarget = await this.prisma.character.update({
      where: { id: target.id },
      data: { hp: newHp },
    });

    return {
      attacker: { id: attacker.id, name: attacker.name, attack: attacker.attack },
      target: updatedTarget,
      damage: attacker.attack,
    };
  }
}