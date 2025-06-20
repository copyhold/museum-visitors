import { Visit, EventType, VisitFormData, DailySummary, ChartDataPoint } from '../types';

const API_BASE = '/api/v1';

const apiService = {
  async getVisits(): Promise<Visit[]> {
    const res = await fetch(`${API_BASE}/visits`);
    if (!res.ok) throw new Error('Failed to fetch visits');
    return res.json();
  },

  async getEventTypes(): Promise<EventType[]> {
    // Try /event-types, fallback to /categories for legacy
    let res = await fetch(`${API_BASE}/event-types`);
    if (!res.ok) {
      res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error('Failed to fetch event types');
    }
    return res.json();
  },

  async getTodaySummary(): Promise<DailySummary> {
    const res = await fetch(`${API_BASE}/summary/today`);
    if (!res.ok) throw new Error('Failed to fetch today summary');
    return res.json();
  },

  async getCurrentMonthData(): Promise<ChartDataPoint[]> {
    const res = await fetch(`${API_BASE}/chart/month`);
    if (!res.ok) throw new Error('Failed to fetch current month data');
    return res.json();
  },

  async getHistoricalData(period: 'week' | 'month', count: number): Promise<ChartDataPoint[]> {
    const params = new URLSearchParams({ period, count: String(count) });
    const res = await fetch(`${API_BASE}/chart/historical?${params}`);
    if (!res.ok) throw new Error('Failed to fetch historical data');
    return res.json();
  },

  async createVisit(data: VisitFormData): Promise<Visit> {
    const res = await fetch(`${API_BASE}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create visit');
    return res.json();
  },

  async updateVisit(id: number, data: VisitFormData): Promise<Visit> {
    const res = await fetch(`${API_BASE}/visits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update visit');
    return res.json();
  },

  async deleteVisit(id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/visits/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete visit');
    return res.json();
  },

  async exportVisits(): Promise<void> {
    // This will trigger a download in the browser
    const res = await fetch(`${API_BASE}/visits/export`);
    if (!res.ok) throw new Error('Failed to export visits');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visits.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default apiService;
