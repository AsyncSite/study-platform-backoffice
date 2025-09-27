import apiClient from '../api/client';

export interface EmailPayload {
  templateId: string;
  to: string;
  variables: Record<string, any>;
  scheduledAt?: string; // ISO 8601 datetime string for scheduled sending
}

export interface BulkEmailPayload {
  templateId: string;
  recipients: Array<{
    email: string;
    variables: Record<string, any>;
  }>;
}

class EmailService {
  /**
   * Send a single email using the noti-service
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      const requestData = {
        userId: payload.to, // Use email as userId
        templateId: payload.templateId,
        channelType: 'EMAIL',
        eventType: 'NOTI',
        recipientContact: payload.to,
        variables: payload.variables,
        ...(payload.scheduledAt && { scheduledAt: payload.scheduledAt })
      };

      console.log('🚀 Sending email request:', JSON.stringify(requestData, null, 2));

      // QueryDaily 메일은 force endpoint 사용 (알림 설정 무시)
      const endpoint = payload.templateId?.startsWith('querydaily') ? '/api/noti/force' : '/api/noti';
      console.log(`📮 Using endpoint: ${endpoint} for template: ${payload.templateId}`);

      const response = await apiClient.post(endpoint, requestData);

      console.log('✅ Email sent successfully:', response.data);
    } catch (error: any) {
      console.error('❌ Failed to send email:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        data: error.config?.data
      });
      throw error;
    }
  }

  /**
   * Send emails to multiple recipients
   */
  async sendBulkEmails(payload: BulkEmailPayload): Promise<void> {
    try {
      const promises = payload.recipients.map(recipient =>
        this.sendEmail({
          templateId: payload.templateId,
          to: recipient.email,
          variables: recipient.variables,
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      throw new Error('Failed to send bulk emails');
    }
  }

  /**
   * Send QueryDaily question email
   */
  async sendQueryDailyQuestion(
    email: string,
    question: string,
    hint: string,
    userName: string = '개발자',
    currentDay: number = 1,
    totalDays: number = 3,
    tomorrowTopic: string = '다음 주제',
    scheduledAt?: string
  ): Promise<void> {
    return this.sendEmail({
      templateId: 'querydaily-question',
      to: email,
      variables: {
        question,
        hint,
        userName,
        currentDay: currentDay.toString(),
        totalDays: totalDays.toString(),
        tomorrowTopic
      },
      ...(scheduledAt && { scheduledAt })
    });
  }

  /**
   * Send QueryDaily answer guide email
   */
  async sendQueryDailyAnswerGuide(
    email: string,
    question: string,
    analysis: string,
    keywords: string[],
    starStructure: {
      situation: string;
      task: string;
      action: string;
      result: string;
    },
    personaAnswers: {
      bigTech: string;
      unicorn: string;
    },
    followUpQuestions: string[],
    scheduledAt?: string
  ): Promise<void> {
    return this.sendEmail({
      templateId: 'querydaily-answer-guide',
      to: email,
      variables: {
        question,
        analysis,
        keywords: keywords.join(', '),
        'starStructure.situation': starStructure.situation,
        'starStructure.task': starStructure.task,
        'starStructure.action': starStructure.action,
        'starStructure.result': starStructure.result,
        'personaAnswers.bigTech': personaAnswers.bigTech,
        'personaAnswers.unicorn': personaAnswers.unicorn,
        followUpQuestions: followUpQuestions.join(' / '),
      },
      ...(scheduledAt && { scheduledAt })
    });
  }

  /**
   * Send QueryDaily challenge welcome email
   */
  async sendQueryDailyChallengeWelcome(
    email: string,
    userName: string = '개발자',
    challengeStartDate?: string,
    scheduledAt?: string
  ): Promise<void> {
    // Format the start date for display
    let challengeStartAt = '오늘부터';
    if (challengeStartDate) {
      const startDate = new Date(challengeStartDate);
      const today = new Date();
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        challengeStartAt = '오늘부터';
      } else if (diffDays === 1) {
        challengeStartAt = '내일부터';
      } else if (diffDays > 1) {
        challengeStartAt = `${startDate.getMonth() + 1}월 ${startDate.getDate()}일부터`;
      } else {
        challengeStartAt = `${startDate.getMonth() + 1}월 ${startDate.getDate()}일부터`;
      }
    }

    return this.sendEmail({
      templateId: 'querydaily-challenge-start',
      to: email,
      variables: {
        userName,
        challengeName: 'QueryDaily 3-Day Challenge',
        challengeStartAt,
        queryDailyBaseUrl: 'https://querydaily.asyncsite.com'
      },
      ...(scheduledAt && { scheduledAt })
    });
  }

  /**
   * Send QueryDaily challenge mid-feedback email
   */
  async sendQueryDailyChallengeMidFeedback(
    email: string,
    userName: string = '개발자',
    scheduledAt?: string
  ): Promise<void> {
    return this.sendEmail({
      templateId: 'querydaily-mid-feedback',
      to: email,
      variables: {
        userName,
        challengeName: 'QueryDaily 3-Day Challenge',
        midFeedbackTime: '2일차 중간',
        surveyUrl: 'https://forms.gle/querydaily-mid',
        kakaoChannelUrl: 'https://pf.kakao.com/_querydaily'
      },
      ...(scheduledAt && { scheduledAt })
    });
  }

  /**
   * Send QueryDaily challenge completion email
   */
  async sendQueryDailyChallengeComplete(
    email: string,
    userName: string = '개발자',
    scheduledAt?: string
  ): Promise<void> {
    return this.sendEmail({
      templateId: 'querydaily-challenge-complete',
      to: email,
      variables: {
        userName,
        challengeName: 'QueryDaily 3-Day Challenge',
        surveyUrl: 'https://forms.gle/querydaily-survey',
        queryDailyBaseUrl: 'https://querydaily.asyncsite.com'
      },
      ...(scheduledAt && { scheduledAt })
    });
  }
}

export default new EmailService();