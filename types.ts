
export enum VisitTypeEnum {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
}

export interface AgeGroupCounts {
  children_count: number;
  adults_count: number;
  seniors_count: number;
  students_count: number;
}

export interface EventType {
  id: number;
  name: string;
}

export interface Visit extends AgeGroupCounts {
  id: number;
  date: string; // YYYY-MM-DD
  visit_type: VisitTypeEnum;
  group_description?: string | null;
  event_type_id: number;
  created_at?: string; // ISO DateTime
}

export interface VisitFormData extends Omit<Visit, 'id' | 'created_at'> {
  id?: number; // Optional for edit mode
}

export interface DailySummary {
  total_visitors: number;
  individual_visits: number;
  group_visits: number;
  age_breakdown: AgeGroupCounts;
}

export interface ChartDataPoint {
  name: string; // e.g., Day of month, Week number, Month name
  children: number;
  adults: number;
  seniors: number;
  students: number;
  [key: string]: string | number; // To allow generic access
}

export interface HistoricalReportParams {
  period: 'week' | 'month';
  count: number;
}
