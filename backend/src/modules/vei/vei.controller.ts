import {
  Controller, Post, Body, UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { VeiService } from './vei.service';

@ApiTags('vei')
@Controller('vei')
export class VeiController {
  constructor(private readonly service: VeiService) {}

  @Post('analyze')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'structureFile', maxCount: 1 },
      { name: 'worklogFile', maxCount: 1 },
    ]),
  )
  analyze(
    @Body('deliveryKey') deliveryKey: string,
    @UploadedFiles() files: { structureFile?: Express.Multer.File[]; worklogFile?: Express.Multer.File[] },
  ) {
    const structure = files?.structureFile?.[0];
    const worklog = files?.worklogFile?.[0];
    if (!structure || !worklog) {
      throw new BadRequestException('Нужны оба файла: structureFile и worklogFile');
    }
    return this.service.analyze(structure, worklog, deliveryKey ?? '');
  }
}
