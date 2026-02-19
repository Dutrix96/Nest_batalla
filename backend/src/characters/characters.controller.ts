import {Body,Controller,Delete,Get,Param,Patch,Post,UseGuards,} from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { AttackDto } from './dto/attack.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findAll() {
    return this.charactersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.charactersService.findOne(Number(id));
  }

  @Post('attack')
  attack(@Body() dto: AttackDto) {
    return this.charactersService.attack(dto);
  }


  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateCharacterDto) {
    return this.charactersService.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCharacterDto) {
    return this.charactersService.update(Number(id), dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.charactersService.remove(Number(id));
  }

  @Roles('ADMIN')
  @Post('reset')
  reset() {
    return this.charactersService.resetAllHp();
  }
}