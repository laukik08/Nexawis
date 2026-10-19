import type { TimeSeriesPoint, DateRangePreset } from '../types/analytics';

/**
 * Historical Time Series for AWIS Intelligence Trends
 * Generated for standard ranges: 7d, 30d, 90d
 */
export const mockAwisTrends: Record<DateRangePreset, TimeSeriesPoint[]> = {
  '7d': [
    { date: '2026-10-12', label: 'Mon 12', value: 87.2, benchmark: 85.0, secondaryValue: 74 },
    { date: '2026-10-13', label: 'Tue 13', value: 87.8, benchmark: 85.0, secondaryValue: 75 },
    { date: '2026-10-14', label: 'Wed 14', value: 88.1, benchmark: 85.0, secondaryValue: 76 },
    { date: '2026-10-15', label: 'Thu 15', value: 88.0, benchmark: 85.0, secondaryValue: 77 },
    { date: '2026-10-16', label: 'Fri 16', value: 88.5, benchmark: 85.0, secondaryValue: 78 },
    { date: '2026-10-17', label: 'Sat 17', value: 88.3, benchmark: 85.0, secondaryValue: 77 },
    { date: '2026-10-18', label: 'Sun 18', value: 88.9, benchmark: 85.0, secondaryValue: 79 }
  ],
  '30d': [
    { date: '2026-09-19', label: 'Sep 19', value: 84.5, benchmark: 85.0, secondaryValue: 72 },
    { date: '2026-09-23', label: 'Sep 23', value: 85.1, benchmark: 85.0, secondaryValue: 73 },
    { date: '2026-09-27', label: 'Sep 27', value: 85.9, benchmark: 85.0, secondaryValue: 74 },
    { date: '2026-10-01', label: 'Oct 01', value: 86.4, benchmark: 85.0, secondaryValue: 75 },
    { date: '2026-10-05', label: 'Oct 05', value: 87.2, benchmark: 85.0, secondaryValue: 76 },
    { date: '2026-10-09', label: 'Oct 09', value: 87.8, benchmark: 85.0, secondaryValue: 77 },
    { date: '2026-10-13', label: 'Oct 13', value: 88.2, benchmark: 85.0, secondaryValue: 77 },
    { date: '2026-10-18', label: 'Oct 18', value: 88.9, benchmark: 85.0, secondaryValue: 79 }
  ],
  '90d': [
    { date: '2026-07-20', label: 'Jul W3', value: 82.1, benchmark: 85.0, secondaryValue: 69 },
    { date: '2026-08-03', label: 'Aug W1', value: 83.4, benchmark: 85.0, secondaryValue: 71 },
    { date: '2026-08-17', label: 'Aug W3', value: 84.2, benchmark: 85.0, secondaryValue: 72 },
    { date: '2026-08-31', label: 'Sep W1', value: 85.0, benchmark: 85.0, secondaryValue: 73 },
    { date: '2026-09-14', label: 'Sep W3', value: 86.3, benchmark: 85.0, secondaryValue: 75 },
    { date: '2026-09-28', label: 'Oct W1', value: 87.5, benchmark: 85.0, secondaryValue: 77 },
    { date: '2026-10-12', label: 'Oct W3', value: 88.9, benchmark: 85.0, secondaryValue: 79 }
  ],
  'custom': [
    { date: '2026-09-01', label: 'Week 1', value: 85.0, benchmark: 85.0, secondaryValue: 73 },
    { date: '2026-09-15', label: 'Week 3', value: 86.2, benchmark: 85.0, secondaryValue: 75 },
    { date: '2026-10-01', label: 'Week 5', value: 87.4, benchmark: 85.0, secondaryValue: 76 },
    { date: '2026-10-18', label: 'Week 7', value: 88.9, benchmark: 85.0, secondaryValue: 79 }
  ]
};

/**
 * Historical Time Series for Project Performance (Demo metric)
 */
export const mockProjectPerformanceTrends: Record<DateRangePreset, TimeSeriesPoint[]> = {
  '7d': [
    { date: '2026-10-12', label: 'Mon', value: 91.5, benchmark: 88.0 },
    { date: '2026-10-13', label: 'Tue', value: 92.0, benchmark: 88.0 },
    { date: '2026-10-14', label: 'Wed', value: 92.4, benchmark: 88.0 },
    { date: '2026-10-15', label: 'Thu', value: 92.8, benchmark: 88.0 },
    { date: '2026-10-16', label: 'Fri', value: 93.5, benchmark: 88.0 },
    { date: '2026-10-17', label: 'Sat', value: 93.7, benchmark: 88.0 },
    { date: '2026-10-18', label: 'Sun', value: 94.1, benchmark: 88.0 }
  ],
  '30d': [
    { date: '2026-09-19', label: 'Sep 19', value: 89.2, benchmark: 88.0 },
    { date: '2026-09-27', label: 'Sep 27', value: 90.8, benchmark: 88.0 },
    { date: '2026-10-05', label: 'Oct 05', value: 92.1, benchmark: 88.0 },
    { date: '2026-10-13', label: 'Oct 13', value: 93.4, benchmark: 88.0 },
    { date: '2026-10-18', label: 'Oct 18', value: 94.1, benchmark: 88.0 }
  ],
  '90d': [
    { date: '2026-07-20', label: 'Jul W3', value: 86.4, benchmark: 88.0 },
    { date: '2026-08-17', label: 'Aug W3', value: 88.7, benchmark: 88.0 },
    { date: '2026-09-14', label: 'Sep W3', value: 91.2, benchmark: 88.0 },
    { date: '2026-10-12', label: 'Oct W3', value: 94.1, benchmark: 88.0 }
  ],
  'custom': [
    { date: '2026-09-01', label: 'Sep 01', value: 89.5, benchmark: 88.0 },
    { date: '2026-09-20', label: 'Sep 20', value: 91.2, benchmark: 88.0 },
    { date: '2026-10-10', label: 'Oct 10', value: 93.3, benchmark: 88.0 },
    { date: '2026-10-18', label: 'Oct 18', value: 94.1, benchmark: 88.0 }
  ]
};

/**
 * Standard palette colors for analytics dimensions & charts
 */
export const analyticsColorPalette = [
  '#0284c7', // Cyan / Teal
  '#16a34a', // Lime / Emerald
  '#f59e0b', // Amber / Gold
  '#a855f7', // Purple
  '#06b6d4', // Bright Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
  '#8b5cf6', // Indigo
  '#f43f5e', // Rose
  '#10b981'  // Green
];
