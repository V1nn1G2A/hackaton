import { BadRequestException, Injectable } from '@nestjs/common';
import { parseStructureFile, parseWorklogFile, parseJiraDate } from '../jira/jira.parser';

@Injectable()
export class VeiService {
  analyze(
    structureFile: Express.Multer.File,
    worklogFile: Express.Multer.File,
    deliveryKey: string,
  ) {
    if (!deliveryKey) throw new BadRequestException('Укажите ключ поставки (deliveryKey)');

    const structure = parseStructureFile(structureFile.buffer, deliveryKey.trim());
    const { worklogs } = parseWorklogFile(worklogFile.buffer);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── Hours per task key (from worklog) ──────────────────────────────────
    const hoursByTask = new Map<string, number>();
    const hoursByAssignee = new Map<string, { name: string; hours: number; login: string }>();
    const hoursByDate = new Map<string, number>();

    for (const wl of worklogs) {
      hoursByTask.set(wl.taskKey, (hoursByTask.get(wl.taskKey) ?? 0) + wl.hours);
      if (wl.parentKey) {
        hoursByTask.set(wl.parentKey, (hoursByTask.get(wl.parentKey) ?? 0) + wl.hours);
      }
      const key = wl.assigneeLogin ?? wl.assigneeRaw ?? 'unknown';
      if (!hoursByAssignee.has(key)) {
        hoursByAssignee.set(key, { name: wl.assigneeRaw ?? key, hours: 0, login: wl.assigneeLogin ?? '' });
      }
      hoursByAssignee.get(key)!.hours += wl.hours;

      if (wl.workDate) {
        hoursByDate.set(wl.workDate, (hoursByDate.get(wl.workDate) ?? 0) + wl.hours);
      }
    }

    // ── Epic stats ─────────────────────────────────────────────────────────
    const tasksByEpic = new Map<string, typeof structure.tasks>();
    for (const t of structure.tasks) {
      const ek = t.epicKey ?? '__none';
      if (!tasksByEpic.has(ek)) tasksByEpic.set(ek, []);
      tasksByEpic.get(ek)!.push(t);
    }

    const epics = structure.epics.map((e) => {
      const epicTasks = tasksByEpic.get(e.key) ?? [];
      const done = epicTasks.filter((t) => isDone(t.status)).length;
      const inProgress = epicTasks.filter((t) => isInProgress(t.status)).length;
      const overdue = e.dueDate ? new Date(e.dueDate) < today : false;
      const hoursLogged = hoursByTask.get(e.key) ?? 0;
      return {
        key: e.key,
        name: e.name,
        status: e.status,
        priority: e.priority,
        dueDate: e.dueDate,
        overdue,
        tasksTotal: epicTasks.length,
        tasksDone: done,
        tasksInProgress: inProgress,
        progressPct: epicTasks.length ? Math.round((done / epicTasks.length) * 100) : 0,
        hoursLogged,
      };
    });

    // ── Task-level stats ───────────────────────────────────────────────────
    const allTasks = structure.tasks;
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter((t) => isDone(t.status)).length;
    const inProgressTasks = allTasks.filter((t) => isInProgress(t.status)).length;
    const overdueTasks = allTasks.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < today && !isDone(t.status);
    });

    // ── Status breakdown ───────────────────────────────────────────────────
    const statusCount = new Map<string, number>();
    for (const t of allTasks) {
      const s = t.status ?? 'Unknown';
      statusCount.set(s, (statusCount.get(s) ?? 0) + 1);
    }
    const byStatus = [...statusCount.entries()]
      .map(([status, count]) => ({ status, count, pct: Math.round((count / totalTasks) * 100) }))
      .sort((a, b) => b.count - a.count);

    // ── Assignee stats (tasks) ─────────────────────────────────────────────
    const assigneeTaskMap = new Map<string, { name: string; total: number; done: number; overdue: number }>();
    for (const t of allTasks) {
      const key = t.assigneeRaw ?? 'Не назначен';
      if (!assigneeTaskMap.has(key)) assigneeTaskMap.set(key, { name: key, total: 0, done: 0, overdue: 0 });
      const row = assigneeTaskMap.get(key)!;
      row.total++;
      if (isDone(t.status)) row.done++;
      if (t.dueDate && new Date(t.dueDate) < today && !isDone(t.status)) row.overdue++;
    }

    // Merge tasks + hours per assignee
    const team = [...assigneeTaskMap.entries()].map(([key, t]) => {
      // Try matching by full name
      const hoursEntry = [...hoursByAssignee.values()].find((h) =>
        normalize(h.name) === normalize(key) || normalize(h.login) === normalize(key),
      ) ?? hoursByAssignee.get(key);
      return {
        name: t.name,
        tasksTotal: t.total,
        tasksDone: t.done,
        tasksOverdue: t.overdue,
        hoursLogged: hoursEntry?.hours ?? 0,
        donePct: t.total ? Math.round((t.done / t.total) * 100) : 0,
      };
    }).sort((a, b) => b.hoursLogged - a.hoursLogged || b.tasksDone - a.tasksDone);

    // ── Timeline: group by week ────────────────────────────────────────────
    const weekMap = new Map<string, number>();
    for (const [date, hours] of hoursByDate.entries()) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const week = monday.toISOString().slice(0, 10);
      weekMap.set(week, (weekMap.get(week) ?? 0) + hours);
    }
    const timeline = [...weekMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, hours]) => ({ week, hours: Math.round(hours * 10) / 10 }));

    // ── Summary ────────────────────────────────────────────────────────────
    const totalHours = [...hoursByAssignee.values()].reduce((s, e) => s + e.hours, 0);
    const totalEpics = epics.length;
    const doneEpics = epics.filter((e) => isDone(e.status)).length;
    const overdueEpics = epics.filter((e) => e.overdue && !isDone(e.status));

    const summary = {
      deliveryKey,
      deliveryName: structure.delivery.name,
      deliveryStatus: structure.delivery.status,
      deliveryDueDate: structure.delivery.dueDate,
      totalEpics,
      doneEpics,
      totalTasks,
      doneTasks,
      inProgressTasks,
      overdueTasks: overdueTasks.length,
      overdueEpics: overdueEpics.length,
      totalHoursLogged: Math.round(totalHours * 10) / 10,
      progressPct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
      epicProgressPct: totalEpics ? Math.round((doneEpics / totalEpics) * 100) : 0,
      warnings: structure.warnings,
    };

    return {
      summary,
      byStatus,
      epics: epics.sort((a, b) => (a.overdue ? -1 : 1) - (b.overdue ? -1 : 1) || b.hoursLogged - a.hoursLogged),
      overdueEpics,
      overdueTasks: overdueTasks.slice(0, 50),
      team,
      timeline,
    };
  }
}

function isDone(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'done' || s === 'closed' || s === 'resolved' || s.includes('закрыт') || s.includes('готов');
}
function isInProgress(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('progress') || s.includes('в работ') || s.includes('review');
}
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
}
