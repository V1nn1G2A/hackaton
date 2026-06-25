/**
 * Захардкоженные справочники направлений и ролей.
 * Выведены из реальных файлов: «Шаблон плановой оценки.xlsx» + «ADUsers.xlsx».
 * Значения из входных файлов матчатся на эти enum через alias-маппинг (см. baseline.parser.ts).
 * См. architecture.md → «Маппинг входных файлов».
 */

export enum Direction {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  ANALYTICS = 'analytics',
  TEAMLEAD = 'teamlead',
  QA = 'qa',
  DEVOPS = 'devops',
  DESIGN = 'design',
  OTHER = 'other',
}

export enum Role {
  BACKEND_DEV = 'backend_dev',
  FRONTEND_DEV = 'frontend_dev',
  ANALYST = 'analyst',
  TECHWRITER = 'techwriter',
  QA = 'qa',
  DEVOPS = 'devops',
  DESIGNER = 'designer',
  TEAMLEAD = 'teamlead',
  OTHER = 'other',
}

/** Человекочитаемые подписи для UI и справочных эндпоинтов. */
export const DIRECTION_LABELS: Record<Direction, string> = {
  [Direction.BACKEND]: 'Бэкенд',
  [Direction.FRONTEND]: 'Фронтенд',
  [Direction.ANALYTICS]: 'Аналитика',
  [Direction.TEAMLEAD]: 'Тимлид',
  [Direction.QA]: 'QA',
  [Direction.DEVOPS]: 'DevOps',
  [Direction.DESIGN]: 'Дизайнер',
  [Direction.OTHER]: 'Прочее',
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.BACKEND_DEV]: 'Бекенд-разработчик',
  [Role.FRONTEND_DEV]: 'Frontend-разработчик',
  [Role.ANALYST]: 'Аналитик',
  [Role.TECHWRITER]: 'Техпис',
  [Role.QA]: 'QA',
  [Role.DEVOPS]: 'DevOps',
  [Role.DESIGNER]: 'Дизайнер',
  [Role.TEAMLEAD]: 'Тимлид',
  [Role.OTHER]: 'Прочее',
};

/** Каноническая AD-группа MemberOf для роли («айдишник роли»). */
export const ROLE_CANONICAL_GROUP: Record<Role, string | null> = {
  [Role.BACKEND_DEV]: 'back-team',
  [Role.FRONTEND_DEV]: 'front-team',
  [Role.ANALYST]: 'analytics-team',
  [Role.TECHWRITER]: 'techwrite-team',
  [Role.QA]: 'qa-team',
  [Role.DEVOPS]: 'sysadmin',
  [Role.DESIGNER]: 'designer-team',
  [Role.TEAMLEAD]: null, // конкретная *-lead группа берётся из MemberOf
  [Role.OTHER]: null,
};
