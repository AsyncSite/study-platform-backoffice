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
}

export default new EmailService();