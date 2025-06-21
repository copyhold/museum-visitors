import { Hono } from 'hono';
import {D1Database} from '@cloudflare/workers-types';
import { Visit, EventType, VisitFormData, VisitTypeEnum, DailySummary, ChartDataPoint } from './types';
import { AGE_GROUP_KEYS } from './constants';

type Env = { VISITORS_DB: D1Database };
import { serveStatic } from 'hono/cloudflare-workers';
// Import the Vite manifest for static serving
import manifest from './dist/.vite/manifest.json';
const app = new Hono<{ Bindings: Env }>();

// Helper: get ISO week number
function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

app.get('/api/v1/categories', async (c) => {
  const db = c.env.VISITORS_DB;
  const { results } = await db.prepare(
    `SELECT * FROM event_types`
  ).all();
  return c.json(results as unknown as EventType[]);
});

// GET /visits
app.get('/api/v1/visits', async (c) => {
  const db = c.env.VISITORS_DB;
  const { results } = await db.prepare(
    `SELECT * FROM visits ORDER BY date DESC, id DESC`
  ).all();
  return c.json(results as unknown as Visit[]);
});

// POST /visits
app.post('/api/v1/visits', async (c) => {
  const db = c.env.VISITORS_DB;
  const data = await c.req.json<VisitFormData>();
  const now = new Date().toISOString();
  const result = await db.prepare(
    `INSERT INTO visits (date, visit_type, group_description, children_count, adults_count, seniors_count, students_count, event_type_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.date,
    data.visit_type,
    data.group_description || null,
    data.children_count,
    data.adults_count,
    data.seniors_count,
    data.students_count,
    data.event_type_id,
    now
  ).run();
  const { results } = await db.prepare('SELECT * FROM visits WHERE id = ?').bind(result.meta.last_row_id).all();
  return c.json(results[0]);
});

// PUT /visits/:id
app.put('/api/v1/visits/:id', async (c) => {
  const db = c.env.VISITORS_DB;
  const id = Number(c.req.param('id'));
  const data = await c.req.json<VisitFormData>();
  await db.prepare(
    `UPDATE visits SET date=?, visit_type=?, group_description=?, children_count=?, adults_count=?, seniors_count=?, students_count=?, event_type_id=? WHERE id=?`
  ).bind(
    data.date,
    data.visit_type,
    data.group_description || null,
    data.children_count,
    data.adults_count,
    data.seniors_count,
    data.students_count,
    data.event_type_id,
    id
  ).run();
  const { results } = await db.prepare('SELECT * FROM visits WHERE id = ?').bind(id).all();
  return results[0] ? c.json(results[0]) : c.json(null, 404);
});

// DELETE /visits/:id
app.delete('/api/v1/visits/:id', async (c) => {
  const db = c.env.VISITORS_DB;
  const id = Number(c.req.param('id'));
  const result = await db.prepare('DELETE FROM visits WHERE id = ?').bind(id).run();
  return c.json(result.meta.changes > 0);
});

// GET /event-types
app.get('/api/v1/event-types', async (c) => {
  const db = c.env.VISITORS_DB;
  const { results } = await db.prepare('SELECT * FROM event_types ORDER BY id').all();
  return c.json(results as unknown as EventType[]);
});

// GET /visits/export
app.get('/api/v1/visits/export', async (c) => {
  const db = c.env.VISITORS_DB;
  const headers = ['id', 'date', 'visit_type', 'group_description', ...AGE_GROUP_KEYS, 'event_type_id', 'created_at'];
  const { results } = await db.prepare('SELECT * FROM visits ORDER BY date DESC, id DESC').all();
  if (!results.length) return c.text('No data to export.', 404);
  const csvRows = results.map((visit: any) => [
    visit.id,
    visit.date,
    visit.visit_type,
    visit.group_description || '',
    visit.children_count,
    visit.adults_count,
    visit.seniors_count,
    visit.students_count,
    visit.event_type_id,
    visit.created_at
  ].join(','));
  const csvContent = `${headers.join(',')}\n${csvRows.join('\n')}`;
  return c.text(csvContent, 200, { 'content-type': 'text/csv' });
});

// GET /summary/today
app.get('/api/v1/summary/today', async (c) => {
  const db = c.env.VISITORS_DB;
  const todayStr = new Date().toISOString().split('T')[0];
  const { results } = await db.prepare('SELECT * FROM visits WHERE date = ?').bind(todayStr).all();
  const summary: DailySummary = {
    total_visitors: 0,
    individual_visits: 0,
    group_visits: 0,
    age_breakdown: { children_count: 0, adults_count: 0, seniors_count: 0, students_count: 0 },
  };
  for (const visit of results as unknown as Visit[]) {
    const visitTotal = visit.children_count + visit.adults_count + visit.seniors_count + visit.students_count;
    summary.total_visitors += visitTotal;
    if (visit.visit_type === VisitTypeEnum.INDIVIDUAL) summary.individual_visits++;
    if (visit.visit_type === VisitTypeEnum.GROUP) summary.group_visits++;
    summary.age_breakdown.children_count += visit.children_count;
    summary.age_breakdown.adults_count += visit.adults_count;
    summary.age_breakdown.seniors_count += visit.seniors_count;
    summary.age_breakdown.students_count += visit.students_count;
  }
  return c.json(summary);
});

// GET /chart/month
app.get('/api/v1/chart/month', async (c) => {
  const db = c.env.VISITORS_DB;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: ChartDataPoint[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const { results } = await db.prepare('SELECT * FROM visits WHERE date = ?').bind(dateStr).all();
    const point: ChartDataPoint = {
      name: String(day).padStart(2, '0'),
      children: 0, adults: 0, seniors: 0, students: 0
    };
    for (const v of results as unknown as Visit[]) {
      point.children += v.children_count;
      point.adults += v.adults_count;
      point.seniors += v.seniors_count;
      point.students += v.students_count;
    }
    data.push(point);
  }
  return c.json(data);
});

// GET /chart/historical
app.get('/api/v1/chart/historical', async (c) => {
  const db = c.env.VISITORS_DB;
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
    // Query visits in range
    const { results } = await db.prepare(
      'SELECT * FROM visits WHERE date >= ? AND date <= ?'
    ).bind(
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10)
    ).all();
    const point: ChartDataPoint = { name, children: 0, adults: 0, seniors: 0, students: 0 };
    for (const v of results as unknown as Visit[]) {
      point.children += v.children_count;
      point.adults += v.adults_count;
      point.seniors += v.seniors_count;
      point.students += v.students_count;
    }
    data.unshift(point);
  }
  return c.json(data);
});

app.get('/favicon.ico', (c) => new Response(null, { status: 204 }));
app.get('*', serveStatic({ root: './', path: 'index.html', manifest }));

export default app;
