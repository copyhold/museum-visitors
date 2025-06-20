import { Hono } from 'hono';
import { Visit, EventType, VisitFormData, VisitTypeEnum, DailySummary, ChartDataPoint, AgeGroupCounts } from './types';
import { INITIAL_EVENT_TYPES, AGE_GROUP_KEYS } from './constants';

let visits: Visit[] = [
  { id: 1, date: '2024-07-15', visit_type: VisitTypeEnum.INDIVIDUAL, children_count: 2, adults_count: 1, seniors_count: 0, students_count: 0, event_type_id: 2, created_at: new Date().toISOString() },
  { id: 2, date: '2024-07-15', visit_type: VisitTypeEnum.GROUP, group_description: 'School Trip Grade 5', children_count: 25, adults_count: 2, seniors_count: 0, students_count: 0, event_type_id: 8, created_at: new Date().toISOString() },
  { id: 3, date: '2024-07-16', visit_type: VisitTypeEnum.INDIVIDUAL, children_count: 0, adults_count: 2, seniors_count: 1, students_count: 0, event_type_id: 5, created_at: new Date().toISOString() },
  { id: 4, date: new Date().toISOString().split('T')[0], visit_type: VisitTypeEnum.INDIVIDUAL, children_count: 1, adults_count: 1, seniors_count: 0, students_count: 0, event_type_id: 1, created_at: new Date().toISOString() },
];
let eventTypes: EventType[] = [...INITIAL_EVENT_TYPES];
let nextVisitId = visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1;

const app = new Hono();

// Helper: delay for simulating latency
const delay = async <T,>(data: T, ms: number = 100): Promise<T> => new Promise(resolve => setTimeout(() => resolve(data), ms));

// Helper: get ISO week number
function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

app.get('/visits', async (c) => {
  const sorted = [...visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id - a.id));
  return c.json(await delay(sorted));
});

app.post('/visits', async (c) => {
  const data = await c.req.json<VisitFormData>();
  const newVisit: Visit = {
    ...data,
    id: nextVisitId++,
    created_at: new Date().toISOString(),
  };
  visits.push(newVisit);
  return c.json(await delay(newVisit));
});

app.put('/visits/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const data = await c.req.json<VisitFormData>();
  const index = visits.findIndex(v => v.id === id);
  if (index === -1) return c.json(null, 404);
  visits[index] = { ...visits[index], ...data };
  return c.json(await delay(visits[index]));
});

app.delete('/visits/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const initialLength = visits.length;
  visits = visits.filter(v => v.id !== id);
  return c.json(await delay(visits.length < initialLength));
});

app.get('/event-types', async (c) => {
  return c.json(await delay([...eventTypes]));
});

app.get('/visits/export', async (c) => {
  if (visits.length === 0) {
    return c.text('No data to export.', 404);
  }
  const headers = ['id', 'date', 'visit_type', 'group_description', ...AGE_GROUP_KEYS, 'event_type_id', 'created_at'];
  const csvRows = visits.map(visit => {
    const eventType = eventTypes.find(et => et.id === visit.event_type_id);
    return [
      visit.id,
      visit.date,
      visit.visit_type,
      visit.group_description || '',
      visit.children_count,
      visit.adults_count,
      visit.seniors_count,
      visit.students_count,
      eventType ? eventType.name : visit.event_type_id,
      visit.created_at
    ].join(',');
  });
  const csvContent = `${headers.join(',')}\n${csvRows.join('\n')}`;
  return c.text(csvContent, 200, { 'content-type': 'text/csv' });
});

app.get('/summary/today', async (c) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.date === todayStr);
  const summary: DailySummary = {
    total_visitors: 0,
    individual_visits: 0,
    group_visits: 0,
    age_breakdown: { children_count: 0, adults_count: 0, seniors_count: 0, students_count: 0 },
  };
  todayVisits.forEach(visit => {
    const visitTotal = visit.children_count + visit.adults_count + visit.seniors_count + visit.students_count;
    summary.total_visitors += visitTotal;
    if (visit.visit_type === VisitTypeEnum.INDIVIDUAL) summary.individual_visits++;
    if (visit.visit_type === VisitTypeEnum.GROUP) summary.group_visits++;
    summary.age_breakdown.children_count += visit.children_count;
    summary.age_breakdown.adults_count += visit.adults_count;
    summary.age_breakdown.seniors_count += visit.seniors_count;
    summary.age_breakdown.students_count += visit.students_count;
  });
  return c.json(await delay(summary));
});

app.get('/chart/month', async (c) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: ChartDataPoint[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dailyVisits = visits.filter(v => v.date === dateStr);
    const point: ChartDataPoint = {
      name: String(day).padStart(2, '0'),
      children: 0, adults: 0, seniors: 0, students: 0
    };
    dailyVisits.forEach(v => {
      point.children += v.children_count;
      point.adults += v.adults_count;
      point.seniors += v.seniors_count;
      point.students += v.students_count;
    });
    data.push(point);
  }
  return c.json(await delay(data));
});

app.get('/chart/historical', async (c) => {
  const period = c.req.query('period') as 'week' | 'month';
  const count = Number(c.req.query('count')) || 4;
  const data: ChartDataPoint[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    let startDate: Date;
    let endDate: Date;
    let name: string;
    if (period === 'month') {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
      name = targetMonth.toLocaleString('default', { month: 'short', year: '2-digit' });
    } else {
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 6);
      startDate.setHours(0,0,0,0);
      name = `W${getWeekNumber(startDate)}-${startDate.getFullYear().toString().slice(-2)}`;
    }
    const periodVisits = visits.filter(v => {
      const visitDate = new Date(v.date);
      visitDate.setHours(0,0,0,0);
      return visitDate >= startDate && visitDate <= endDate;
    });
    const point: ChartDataPoint = { name, children: 0, adults: 0, seniors: 0, students: 0 };
    periodVisits.forEach(v => {
      point.children += v.children_count;
      point.adults += v.adults_count;
      point.seniors += v.seniors_count;
      point.students += v.students_count;
    });
    data.unshift(point);
  }
  return c.json(await delay(data));
});

export default app;
