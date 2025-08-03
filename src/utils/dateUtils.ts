import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Java LocalDate/LocalDateTime 배열 형식 또는 ISO 문자열을 포맷합니다.
 * @param dateValue - [year, month, day] 또는 [year, month, day, hour, minute, second, nano] 배열 또는 ISO 문자열
 * @param includeTime - 시간을 포함할지 여부 (기본값: true)
 * @param formatPattern - 커스텀 포맷 패턴 (선택사항)
 * @returns 포맷된 날짜 문자열
 */
export const formatDate = (
  dateValue: string | number[],
  includeTime = true,
  formatPattern?: string
): string => {
  try {
    let date: Date;
    
    if (Array.isArray(dateValue)) {
      // LocalDate: [year, month, day]
      // LocalDateTime: [year, month, day, hour, minute, second, nano]
      const [year, month, day, hour = 0, minute = 0] = dateValue;
      date = new Date(year, month - 1, day, hour, minute);
    } else {
      // ISO 문자열 또는 기타 날짜 문자열
      date = new Date(dateValue);
    }
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      console.error('Invalid date value:', dateValue);
      return '날짜 오류';
    }
    
    // 커스텀 포맷이 제공된 경우
    if (formatPattern) {
      return format(date, formatPattern, { locale: ko });
    }
    
    // 배열이고 길이가 3 이하면 날짜만 표시
    if (Array.isArray(dateValue) && dateValue.length <= 3) {
      return format(date, 'yyyy.MM.dd', { locale: ko });
    }
    
    // 기본 포맷
    return includeTime 
      ? format(date, 'yyyy.MM.dd HH:mm', { locale: ko })
      : format(date, 'yyyy.MM.dd', { locale: ko });
  } catch (error) {
    console.error('Date formatting error:', error, dateValue);
    return '날짜 오류';
  }
};

/**
 * 상세 모달용 날짜 포맷
 */
export const formatDateKorean = (
  dateValue: string | number[],
  includeTime = true
): string => {
  const pattern = includeTime ? 'yyyy년 MM월 dd일 HH:mm' : 'yyyy년 MM월 dd일';
  return formatDate(dateValue, includeTime, pattern);
};