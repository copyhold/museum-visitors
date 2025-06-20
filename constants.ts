
import { EventType } from './types';

export const API_BASE_URL = '/api'; // Mocked, so not actually used for network requests

export const NAV_TABS = [
  { id: 'add', label: 'Add Visit' },
  { id: 'manage', label: 'Manage Visits' },
  { id: 'reports', label: 'Reports' },
];

export const INITIAL_EVENT_TYPES: EventType[] = [
  { id: 1, name: "Meeting with writer" },
  { id: 2, name: "Excursion" },
  { id: 3, name: "Concert" },
  { id: 4, name: "Workshop" },
  { id: 5, name: "Exhibition opening" },
  { id: 6, name: "Lecture" },
  { id: 7, name: "Film screening" },
  { id: 8, name: "Children's program" },
];

export const AGE_GROUP_KEYS: (keyof import('./types').AgeGroupCounts)[] = ['children_count', 'adults_count', 'seniors_count', 'students_count'];

export const AGE_GROUP_DISPLAY_KEYS: ('children' | 'adults' | 'seniors' | 'students')[] = ['children', 'adults', 'seniors', 'students'];


export const AGE_GROUP_LABELS: Record<string, string> = {
  children_count: 'Children',
  adults_count: 'Adults',
  seniors_count: 'Seniors',
  students_count: 'Students',
  children: 'Children',
  adults: 'Adults',
  seniors: 'Seniors',
  students: 'Students',
};

export const AGE_GROUP_COLORS: Record<string, string> = {
  children: '#8884d8', // Corresponds to AGE_GROUP_DISPLAY_KEYS
  adults: '#82ca9d',
  seniors: '#ffc658',
  students: '#ff8042',
};

export const MAX_GROUP_DESCRIPTION_LENGTH = 100;

export const HISTORICAL_PERIOD_OPTIONS = [
  { value: 'week', label: 'Weeks' },
  { value: 'month', label: 'Months' },
];

export const HISTORICAL_COUNT_OPTIONS = [2, 3, 4, 6, 8, 12];

