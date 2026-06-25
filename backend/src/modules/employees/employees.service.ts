import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { parseEmployeesBuffer } from './employee.parser';

@Injectable()
export class EmployeesService {
  constructor(private readonly repo: EmployeesRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const emp = await this.repo.findById(id);
    if (!emp) throw new NotFoundException('Сотрудник не найден');
    return emp;
  }

  create(dto: CreateEmployeeDto) {
    return this.repo.create({ ...dto, needsReview: false });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findById(id);
    // Ручная правка снимает флаг «требует проверки».
    await this.repo.update(id, { ...dto, needsReview: false });
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  /** Импорт справочника из Excel/CSV (FR-05). */
  async import(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');

    let parsed;
    try {
      parsed = parseEmployeesBuffer(file.buffer);
    } catch {
      throw new BadRequestException('Не удалось прочитать файл — ожидается Excel/CSV');
    }

    if (parsed.employees.length === 0) {
      throw new BadRequestException({
        message: 'В файле не найдено ни одного сотрудника',
        warnings: parsed.warnings,
      });
    }

    const { created, updated } = await this.repo.upsertMany(parsed.employees);
    return {
      total: parsed.employees.length,
      created,
      updated,
      warnings: parsed.warnings,
    };
  }
}
