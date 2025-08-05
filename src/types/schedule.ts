// 요일
export const DayOfWeek = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY'
} as const;

export type DayOfWeek = typeof DayOfWeek[keyof typeof DayOfWeek];

// 반복 주기
export const ScheduleFrequency = {
  WEEKLY: 'WEEKLY',       // 매주
  BIWEEKLY: 'BIWEEKLY',   // 격주
  MONTHLY: 'MONTHLY'      // 매월
} as const;

export type ScheduleFrequency = typeof ScheduleFrequency[keyof typeof ScheduleFrequency];

// 기간 단위
export const DurationUnit = {
  WEEKS: 'WEEKS',
  MONTHS: 'MONTHS'
} as const;

export type DurationUnit = typeof DurationUnit[keyof typeof DurationUnit];

// 일정 데이터 인터페이스
export interface ScheduleData {
  daysOfWeek: DayOfWeek[];
  startTime: string;  // HH:mm 형식
  endTime: string;    // HH:mm 형식
  frequency: ScheduleFrequency;
  additionalInfo?: string;
}

// 기간 데이터 인터페이스
export interface DurationData {
  value: number;
  unit: DurationUnit;
}

// 한글 변환 함수들
export const dayToKorean = (day: DayOfWeek): string => {
  const map: Record<DayOfWeek, string> = {
    [DayOfWeek.MONDAY]: '월',
    [DayOfWeek.TUESDAY]: '화',
    [DayOfWeek.WEDNESDAY]: '수',
    [DayOfWeek.THURSDAY]: '목',
    [DayOfWeek.FRIDAY]: '금',
    [DayOfWeek.SATURDAY]: '토',
    [DayOfWeek.SUNDAY]: '일'
  };
  return map[day];
};

export const frequencyToKorean = (freq: ScheduleFrequency): string => {
  const map: Record<ScheduleFrequency, string> = {
    [ScheduleFrequency.WEEKLY]: '매주',
    [ScheduleFrequency.BIWEEKLY]: '격주',
    [ScheduleFrequency.MONTHLY]: '매월'
  };
  return map[freq];
};

export const durationUnitToKorean = (unit: DurationUnit): string => {
  const map: Record<DurationUnit, string> = {
    [DurationUnit.WEEKS]: '주',
    [DurationUnit.MONTHS]: '개월'
  };
  return map[unit];
};

// 일정 데이터를 한글 문자열로 변환
export const formatScheduleToKorean = (schedule: ScheduleData): string => {
  const days = schedule.daysOfWeek
    .map(day => dayToKorean(day))
    .join(', ');
  
  const freq = frequencyToKorean(schedule.frequency);
  
  return `${freq} ${days} ${schedule.startTime}-${schedule.endTime}`;
};

// 기간 데이터를 한글 문자열로 변환
export const formatDurationToKorean = (duration: DurationData): string => {
  return `${duration.value}${durationUnitToKorean(duration.unit)}`;
};