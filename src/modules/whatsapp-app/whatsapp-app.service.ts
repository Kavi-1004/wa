import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppAppService {
  private readonly logger = new Logger(WhatsAppAppService.name);

  constructor(private readonly configService: ConfigService) { }

  async sendTemplateMessage(recipient?: string) {
    const accessToken = this.configService.get<string>('WHATSAPP_API_TOKEN');
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const recipientPhone =
      recipient || this.configService.get<string>('WHATSAPP_RECIPIENT_PHONE');

    const apiUrl = this.configService.get<string>(
      'WHATSAPP_API_URL',
      'https://graph.facebook.com/v25.0',
    );

    if (!accessToken || !phoneNumberId || !recipientPhone) {
      throw new Error(
        'Missing WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, or WHATSAPP_RECIPIENT_PHONE',
      );
    }

    try {
      const url = `${apiUrl}/${phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: recipientPhone.replace('+', ''), // Remove + if present
        type: 'template',
        template: {
          name: 'reading',
          language: {
            code: 'en',
          },
        },
      };

      this.logger.log(`Sending WhatsApp template message to ${payload.to}`);
      this.logger.debug(`Request URL: ${url}`);
      this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`Failed to send template message`);
        this.logger.error(`Status: ${response.status}`);
        this.logger.error(`Response: ${JSON.stringify(data, null, 2)}`);
        throw new Error(JSON.stringify(data));
      }

      this.logger.log(`Template message sent successfully`);
      this.logger.log(JSON.stringify(data, null, 2));

      return data;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error sending message: ${error.message}`);
      } else {
        this.logger.error(`Unknown error: ${JSON.stringify(error)}`);
      }

      throw error;
    }
  }
}