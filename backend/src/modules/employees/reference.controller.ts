import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Direction,
  Role,
  DIRECTION_LABELS,
  ROLE_LABELS,
} from '../../common/enums/reference.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/** Захардкоженные справочники направлений и ролей (read-only). */
@ApiTags('reference')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReferenceController {
  @Get('directions')
  directions() {
    return Object.values(Direction).map((value) => ({
      value,
      label: DIRECTION_LABELS[value],
    }));
  }

  @Get('roles')
  roles() {
    return Object.values(Role).map((value) => ({
      value,
      label: ROLE_LABELS[value],
    }));
  }
}
