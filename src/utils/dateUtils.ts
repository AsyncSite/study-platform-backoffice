import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜를 KST(Asia/Seoul) 기준으로 포맷합니다.
 * 서버에서 오는 시간은 UTC로 간주합니다.
 */
export const formatDate = (
  dateValue: string | number[] | null | undefined,
  includeTime = true
): string => {
  if (!dateValue) return '-';

  try {
    let date: Date;

    if (Array.isArray(dateValue)) {
      // LocalDate: [year, month, day]
      // LocalDateTime: [year, month, day, hour, minute, second, nano]
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
      // 배열은 UTC로 생성
      date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    } else {
      // ISO 문자열
      const hasTimezone = dateValue.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateValue);
      if (hasTimezone) {
        date = new Date(dateValue);
      } else {
        // timezone 없으면 UTC로 간주
        date = new Date(dateValue + 'Z');
      }
    }

    if (isNaN(date.getTime())) {
      console.error('Invalid date value:', dateValue);
      return '날짜 오류';
    }

    // KST(Asia/Seoul)로 포맷
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };

    return new Intl.DateTimeFormat('ko-KR', options).format(date);
  } catch (error) {
    console.error('Date formatting error:', error, dateValue);
    return '날짜 오류';
  }
};

/**
 * 상세 모달용 날짜 포맷 (한국어)
 */
export const formatDateKorean = (
  dateValue: string | number[] | null | undefined,
  includeTime = true
): string => {
  if (!dateValue) return '-';

  try {
    let date: Date;

    if (Array.isArray(dateValue)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
      date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    } else {
      const hasTimezone = dateValue.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateValue);
      if (hasTimezone) {
        date = new Date(dateValue);
      } else {
        date = new Date(dateValue + 'Z');
      }
    }

    if (isNaN(date.getTime())) {
      return '날짜 오류';
    }

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };

    return new Intl.DateTimeFormat('ko-KR', options).format(date);
  } catch (error) {
    console.error('Date formatting error:', error, dateValue);
    return '날짜 오류';
  }
};

/**
 * date-fns format을 사용하는 레거시 함수 (기존 코드 호환용)
 */
export const formatDateLegacy = (
  dateValue: string | number[] | null | undefined,
  includeTime = true,
  formatPattern?: string
): string => {
  if (!dateValue) return '-';

  try {
    let date: Date;

    if (Array.isArray(dateValue)) {
      const [year, month, day, hour = 0, minute = 0] = dateValue;
      date = new Date(year, month - 1, day, hour, minute);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return '날짜 오류';
    }

    if (formatPattern) {
      return format(date, formatPattern, { locale: ko });
    }

    if (Array.isArray(dateValue) && dateValue.length <= 3) {
      return format(date, 'yyyy.MM.dd', { locale: ko });
    }

    return includeTime
      ? format(date, 'yyyy.MM.dd HH:mm', { locale: ko })
      : format(date, 'yyyy.MM.dd', { locale: ko });
  } catch (error) {
    console.error('Date formatting error:', error, dateValue);
    return '날짜 오류';
  }
};