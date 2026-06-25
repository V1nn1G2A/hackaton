import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { ParsedEmployee } from './employee.parser';

@Injectable()
export class EmployeesRepository {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  findAll(): Promise<Employee[]> {
    return this.repo.find({ order: { fullName: 'ASC' } });
  }

  findById(id: string): Promise<Employee | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Employee>): Promise<Employee> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Employee>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  /**
   * Upsert по jiraIdentity: существующих обновляет, новых создаёт (FR-05).
   * Возвращает количество созданных/обновлённых.
   */
  async upsertMany(parsed: ParsedEmployee[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;
    for (const p of parsed) {
      const existing = p.jiraIdentity
        ? await this.repo.findOne({ where: { jiraIdentity: p.jiraIdentity } })
        : null;
      if (existing) {
        await this.repo.update(existing.id, {
          fullName: p.fullName,
          mail: p.mail ?? undefined,
          direction: p.direction,
          role: p.role,
          roleGroup: p.roleGroup ?? undefined,
          memberOf: p.memberOf ?? undefined,
          needsReview: p.needsReview,
        });
        updated++;
      } else {
        await this.repo.save(
          this.repo.create({
            fullName: p.fullName,
            jiraIdentity: p.jiraIdentity ?? undefined,
            mail: p.mail ?? undefined,
            direction: p.direction,
            role: p.role,
            roleGroup: p.roleGroup ?? undefined,
            memberOf: p.memberOf ?? undefined,
            needsReview: p.needsReview,
            active: true,
          }),
        );
        created++;
      }
    }
    return { created, updated };
  }
}
