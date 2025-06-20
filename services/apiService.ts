
import { Visit, EventType, VisitFormData, VisitTypeEnum, DailySummary, ChartDataPoint, AgeGroupCounts } from '../types';
import { INITIAL_EVENT_TYPES, AGE_GROUP_KEYS } from '../constants';

let visits: Visit[] = [
  { id: 1, date: '2024-07-15', visit_type: VisitTypeEnum.INDIVIDUAL, children_count: 2, adults_count: 1, seniors_count: 0, students_count: 0, event_type_id: 2, created_at: new Date().toISOString() },
  { id: 2, date: '2024-07-15', visit_type: VisitTypeEnum.GROUP, group_description: 'School Trip Grade 5', children_count: 25, adults_count: 2, seniors_count: 0, students_count: 0, event_type_id: 8, created_at: new Date().toISOString() },
  { id: 3, date: '2024-07-16', visit_type: VisitTypeEnum.INDIVIDUAL, children_count: 0, adults_count: 2, seniors_count: 1, students_count: 0, event_type_id: 5, created_at: new Date().toISOString() },
  { id: 4, date: new Date().toISOString().split('T')[0], visit_type: VisitTypeEnum.INDIVIDUAL, children_count: 1, adults_count: 1, seniors_count: 0, students_count: 0, event_type_id: 1, created_at: new Date().toISOString() },
];
let eventTypes: EventType[] = [...INITIAL_EVENT_TYPES];
let nextVisitId = visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1;

const delay = <T,>(data: T, ms: number = 300): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), ms));

const apiService = {
  getVisits: async (): Promise<Visit[]> => {
    return delay([...visits].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id - a.id) ));
  },

  createVisit: async (data: VisitFormData): Promise<Visit> => {
    const newVisit: Visit = {
      ...data,
      id: nextVisitId++,
      created_at: new Date().toISOString(),
    };
    visits.push(newVisit);
    return delay(newVisit);
  },

  updateVisit: async (id: number, data: VisitFormData): Promise<Visit | null> => {
    const index = visits.findIndex(v => v.id === id);
    if (index === -1) return delay(null);
    visits[index] = { ...visits[index], ...data };
    return delay(visits[index]);
  },

  deleteVisit: async (id: number): Promise<boolean> => {
    const initialLength = visits.length;
    visits = visits.filter(v => v.id !== id);
    return delay(visits.length < initialLength);
  },

  getEventTypes: async (): Promise<EventType[]> => {
    return delay([...eventTypes]);
  },

  exportVisits: async (): Promise<void> => {
    if (visits.length === 0) {
        alert("No data to export.");
        return delay(undefined);
    }
    const filename = `museum_visits_${new Date().toISOString().split('T')[0]}.csv`;
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
        eventType ? eventType.name : visit.event_type_id, // Use name if found
        visit.created_at
      ].join(',');
    });

    const csvContent = `data:text/csv;charset=utf-8,${headers.join(',')}\n${csvRows.join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return delay(undefined);
  },

  getTodaySummary: async (): Promise<DailySummary> => {
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
    return delay(summary);
  },

  getCurrentMonthData: async (): Promise<ChartDataPoint[]> => {
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
    return delay(data);
  },

  getHistoricalData: async (period: 'week' | 'month', count: number): Promise<ChartDataPoint[]> => {
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
      } else { // week
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
        // Ensure endDate is end of day for comparison
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 6);
        // Ensure startDate is start of day
        startDate.setHours(0,0,0,0);
        name = `W${getWeekNumber(startDate)}-${startDate.getFullYear().toString().slice(-2)}`;
      }
      
      const periodVisits = visits.filter(v => {
        const visitDate = new Date(v.date);
        visitDate.setHours(0,0,0,0); // Normalize visit date to start of day for comparison
        return visitDate >= startDate && visitDate <= endDate;
      });

      const point: ChartDataPoint = { name, children: 0, adults: 0, seniors: 0, students: 0 };
      periodVisits.forEach(v => {
        point.children += v.children_count;
        point.adults += v.adults_count;
        point.seniors += v.seniors_count;
        point.students += v.students_count;
      });
      data.unshift(point); // Add to beginning to keep chronological order
    }
    return delay(data);
  },
};

// Helper to get ISO week number
function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}


export default apiService;
