import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * UTC 시간을 KST로 변환 (9시간 추가)
 */
const toKST = (date: Date): Date => {
  // 서버에서 오는 시간이 UTC인 경우 KST로 변환
  // 이미 Z가 붙어있거나 timezone이 있으면 Date가 자동 처리함
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
};

/**
 * Java LocalDate/LocalDateTime 배열 형식 또는 ISO 문자열을 포맷합니다.
 * 서버에서 오는 시간은 UTC로 간주하고 KST로 변환합니다.
 * @param dateValue - [year, month, day] 또는 [year, month, day, hour, minute, second, nano] 배열 또는 ISO 문자열
 * @param includeTime - 시간을 포함할지 여부 (기본값: true)
 * @param formatPattern - 커스텀 포맷 패턴 (선택사항)
 * @param convertToKST - UTC를 KST로 변환할지 여부 (기본값: true)
 * @returns 포맷된 날짜 문자열
 */
export const formatDate = (
  dateValue: string | number[] | null | undefined,
  includeTime = true,
  formatPattern?: string,
  convertToKST = true
): string => {
  if (!dateValue) return '-';

  try {
    let date: Date;

    if (Array.isArray(dateValue)) {
      // LocalDate: [year, month, day]
      // LocalDateTime: [year, month, day, hour, minute, second, nano]
      const [year, month, day, hour = 0, minute = 0] = dateValue;
      // 배열 형식은 이미 로컬 시간으로 간주
      date = new Date(year, month - 1, day, hour, minute);
    } else {
      // ISO 문자열 또는 기타 날짜 문자열
      // 서버에서 오는 LocalDateTime은 timezone 정보가 없으므로 UTC로 간주
      const hasTimezone = dateValue.includes('Z') || dateValue.includes('+') || dateValue.includes('-', 10);

      if (hasTimezone) {
        // 이미 timezone 정보가 있으면 그대로 파싱
        date = new Date(dateValue);
      } else {
        // timezone 정보가 없으면 UTC로 파싱 후 KST 변환
        date = new Date(dateValue + 'Z'); // UTC로 파싱
        if (convertToKST) {
          date = toKST(date);
        }
      }
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