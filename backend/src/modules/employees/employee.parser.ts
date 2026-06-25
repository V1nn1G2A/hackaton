import {
  Direction,
  Role,
  ROLE_CANONICAL_GROUP,
} from '../../common/enums/reference.enum';

/**
 * Парсер справочника сотрудников «ADUsers.xlsx» (лист «AD Users»).
 *
 * Колонки: DisplayName | sAMAccountName | mail | MemberOf | Роль | Направление.
 * Резолв направления/роли: сперва по текстовым колонкам Роль/Направление (источник истины),
 * затем fallback по AD-группам MemberOf. Нераспознанное → OTHER + needsReview.
 * Контрактные группы (agency-team, outsource, outstaff-team …) при резолве игнорируются.
 * См. architecture.md → «Маппинг входных файлов».
 */

const DIRECTION_ALIAS: Record<string, Direction> = {
  'бэкенд': Direction.BACKEND,
  'бекенд': Direction.BACKEND,
  'backend': Direction.BACKEND,
  'фронтенд': Direction.FRONTEND,
  'frontend': Direction.FRONTEND,
  'аналитика': Direction.ANALYTICS,
  'analytics': Direction.ANALYTICS,
  'тимлид': Direction.TEAMLEAD,
  'teamlead': Direction.TEAMLEAD,
  'qa': Direction.QA,
  'devops': Direction.DEVOPS,
  'дизайнер': Direction.DESIGN,
  'дизайн': Direction.DESIGN,
  'design': Direction.DESIGN,
};

const ROLE_ALIAS: Record<string, Role> = {
  'бекенд-разработчик': Role.BACKEND_DEV,
  'бэкенд-разработчик': Role.BACKEND_DEV,
  'frontend-разработчик': Role.FRONTEND_DEV,
  'фронтенд-разработчик': Role.FRONTEND_DEV,
  'аналитик': Role.ANALYST,
  'analyst': Role.ANALYST,
  'техпис': Role.TECHWRITER,
  'техписатель': Role.TECHWRITER,
  'techwriter': Role.TECHWRITER,
  'qa': Role.QA,
  'devops': Role.DEVOPS,
  'дизайнер': Role.DESIGNER,
  'designer': Role.DESIGNER,
  'тимлид': Role.TEAMLEAD,
  'teamlead': Role.TEAMLEAD,
};

/** Командная AD-группа → (направление, роль). */
const GROUP_MAP: Record<string, { direction: Direction; role: Role }> = {
  'back-team': { direction: Direction.BACKEND, role: Role.BACKEND_DEV },
  'front-team': { direction: Direction.FRONTEND, role: Role.FRONTEND_DEV },
  'analytics-team': { direction: Direction.ANALYTICS, role: Role.ANALYST },
  'techwrite-team': { direction: Direction.ANALYTICS, role: Role.TECHWRITER },
  'qa-team': { direction: Direction.QA, role: Role.QA },
  'sysadmin': { direction: Direction.DEVOPS, role: Role.DEVOPS },
  'designer-team': { direction: Direction.DESIGN, role: Role.DESIGNER },
};

const HEADER_ALIASES: Record<string, string[]> = {
  fullName: ['displayname', 'фио', 'имя'],
  jiraIdentity: ['samaccountname', 'login', 'логин'],
  mail: ['mail', 'email', 'почта'],
  memberOf: ['memberof', 'группы'],
  role: ['роль', 'role'],
  direction: ['направление', 'direction'],
};

export interface ParsedEmployee {
  fullName: string;
  jiraIdentity: string | null;
  mail: string | null;
  direction: Direction;
  role: Role;
  roleGroup: string | null;
  memberOf: string | null;
  needsReview: boolean;
}

export interface ParsedEmployees {
  employees: ParsedEmployee[];
  warnings: string[];
}

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

function splitGroups(memberOf: string): string[] {
  return memberOf
    .split(/[;,]/)
    .map((g) => g.trim())
    .filter(Boolean);
}

/** Резолвит роль/направление по тексту колонок, затем по AD-группам. */
function resolve(
  rawRole: string,
  rawDirection: string,
  groups: string[],
): { direction: Direction; role: Role; roleGroup: string | null } {
  let role = ROLE_ALIAS[rawRole.toLowerCase()] ?? null;
  let direction = DIRECTION_ALIAS[rawDirection.toLowerCase()] ?? null;

  // Fallback: командная группа из MemberOf.
  if (!role || !direction) {
    for (const g of groups) {
      const hit = GROUP_MAP[g.toLowerCase()];
      if (hit) {
        role = role ?? hit.role;
        direction = direction ?? hit.direction;
        break;
      }
    }
  }

  // Fallback: суффикс *-lead → Тимлид.
  if (!role && groups.some((g) => /-lead$/i.test(g))) {
    role = Role.TEAMLEAD;
    direction = direction ?? Direction.TEAMLEAD;
  }

  const resolvedRole = role ?? Role.OTHER;
  const leadGroup = groups.find((g) => /-lead$/i.test(g)) ?? null;
  const roleGroup =
    resolvedRole === Role.TEAMLEAD
      ? leadGroup
      : ROLE_CANONICAL_GROUP[resolvedRole];

  return {
    direction: direction ?? Direction.OTHER,
    role: resolvedRole,
    roleGroup,
  };
}

export function parseEmployeesBuffer(buffer: Buffer): ParsedEmployees {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const xlsx = require('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid: unknown[][] = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  const warnings: string[] = [];
  if (grid.length < 2) {
    return { employees: [], warnings: ['Файл пуст или не содержит данных.'] };
  }

  // Сопоставление колонок по заголовкам (устойчиво к перестановке).
  const headerRow = (grid[0] ?? []).map((c) => toStr(c).toLowerCase());
  const col: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    col[field] = headerRow.findIndex((h) => aliases.includes(h));
  }
  // Дефолтная раскладка, если заголовки не распознаны.
  const fallback = {
    fullName: 0,
    jiraIdentity: 1,
    mail: 2,
    memberOf: 3,
    role: 4,
    direction: 5,
  };
  for (const f of Object.keys(fallback)) {
    if (col[f] === -1 || col[f] === undefined) col[f] = (fallback as any)[f];
  }

  const employees: ParsedEmployee[] = [];
  let reviewCount = 0;

  for (let i = 1; i < grid.length; i++) {
    const row = grid[i] ?? [];
    const fullName = toStr(row[col.fullName]);
    const jiraIdentity = toStr(row[col.jiraIdentity]);
    if (!fullName && !jiraIdentity) continue;

    const memberOf = toStr(row[col.memberOf]);
    const groups = splitGroups(memberOf);
    const { direction, role, roleGroup } = resolve(
      toStr(row[col.role]),
      toStr(row[col.direction]),
      groups,
    );

    const needsReview = role === Role.OTHER || direction === Direction.OTHER;
    if (needsReview) reviewCount++;

    employees.push({
      fullName: fullName || jiraIdentity,
      jiraIdentity: jiraIdentity || null,
      mail: toStr(row[col.mail]) || null,
      direction,
      role,
      roleGroup,
      memberOf: memberOf || null,
      needsReview,
    });
  }

  if (employees.length === 0) {
    warnings.push('Не найдено ни одного сотрудника — проверьте структуру файла.');
  }
  if (reviewCount > 0) {
    warnings.push(`${reviewCount} сотрудник(ов) с нераспознанной ролью/направлением — требует проверки.`);
  }

  return { employees, warnings };
}
