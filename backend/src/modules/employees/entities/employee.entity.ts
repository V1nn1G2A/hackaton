import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Direction, Role } from '../../../common/enums/reference.enum';

/**
 * Справочник сотрудников (FR-05): сотрудник → направление → роль.
 * Загружается из ADUsers.xlsx, дополняется/редактируется вручную.
 * Источник матчинга с Jira-исполнителем — jiraIdentity (sAMAccountName) / mail.
 */
@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  /** sAMAccountName — основной ключ матчинга с Jira-выгрузкой. */
  @Index()
  @Column({ nullable: true })
  jiraIdentity: string;

  @Column({ nullable: true })
  mail: string;

  @Column({ type: 'enum', enum: Direction, default: Direction.OTHER })
  direction: Direction;

  @Column({ type: 'enum', enum: Role, default: Role.OTHER })
  role: Role;

  /** Канонический «айдишник роли» — AD-группа MemberOf (back-team, front-team …). */
  @Column({ nullable: true })
  roleGroup: string;

  /** Исходное значение MemberOf (для аудита/уточнения). */
  @Column({ nullable: true, type: 'text' })
  memberOf: string;

  @Column({ default: true })
  active: boolean;

  /** true, если направление/роль не удалось распознать → «требует проверки» (FR-05, FR-12). */
  @Column({ default: false })
  needsReview: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
