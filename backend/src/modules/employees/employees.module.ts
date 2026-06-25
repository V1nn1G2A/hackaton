import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { ReferenceController } from './reference.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Employee])],
  providers: [EmployeesService, EmployeesRepository],
  controllers: [EmployeesController, ReferenceController],
  exports: [EmployeesService],
})
export class EmployeesModule {}
