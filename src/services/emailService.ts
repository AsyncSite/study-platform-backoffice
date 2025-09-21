import axios from 'axios';

// TODO: Get this from environment variable
const API_BASE_URL = 'http://localhost:8089'; // noti-service port

export interface EmailPayload {
  templateId: string;
  to: string;
  variables: Record<string, any>;
}

export interface BulkEmailPayload {
  templateId: string;
  recipients: Array<{
    email: string;
    variables: Record<string, any>;
  }>;
}

class EmailService {
  private axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Send a single email using the noti-service
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      await this.axiosInstance.post('/api/noti/send', {
        templateId: payload.templateId,
        channelType: 'EMAIL',
        eventType: 'NOTI',
        to: payload.to,
        variables: payload.variables,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
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
    referenceUrl?: string
  ): Promise<void> {
    return this.sendEmail({
      templateId: 'querydaily-question',
      to: email,
      variables: {
        question,
        hint,
        referenceUrl: referenceUrl || 'https://asyncsite.com/querydaily',
      },
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
    followUpQuestions: string[]
  ): Promise<void> {
    return this.sendEmail({
      templateId: 'querydaily-answer-guide',
      to: email,
      variables: {
        question,
        analysis,
        keywords,
        starStructure,
        personaAnswers,
        followUpQuestions,
      },
    });
  }
}

export default new EmailService();