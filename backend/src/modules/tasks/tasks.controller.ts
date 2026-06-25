import {
  Controller, Get, Patch, Delete, Post,
  Param, Body, Query, UseGuards,
  UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { UpdateTaskDto, TaskFilterDto } from './dto/task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('sprints/:sprintId/tasks')
  findTree(@Param('sprintId') sprintId: string, @Query() filters: TaskFilterDto) {
    return this.tasksService.findTree(sprintId, filters);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete('tasks/:id')
  remove(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }

  @Post('sprints/:sprintId/tasks/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'structureFile', maxCount: 1 },
      { name: 'worklogFile', maxCount: 1 },
    ]),
  )
  importTasks(
    @Param('sprintId') sprintId: string,
    @Body('deliveryKey') deliveryKey: string,
    @UploadedFiles()
    files: {
      structureFile?: Express.Multer.File[];
      worklogFile?: Express.Multer.File[];
    },
  ) {
    const structure = files?.structureFile?.[0];
    const worklog = files?.worklogFile?.[0];
    if (!structure || !worklog) {
      throw new BadRequestException('Нужны оба файла: structureFile и worklogFile');
    }
    if (!deliveryKey?.trim()) {
      throw new BadRequestException('Нужен ключ родительской задачи в поле deliveryKey');
    }
    return this.tasksService.importStub(sprintId, deliveryKey.trim(), structure, worklog);
  }
}
