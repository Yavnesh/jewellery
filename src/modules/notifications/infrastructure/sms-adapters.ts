import { SmsAdapter, SmsProvider } from "../domain/sms.types";

export class MockSmsAdapter implements SmsAdapter {
  public readonly provider = SmsProvider.MOCK;
  async sendSms(to: string, message: string): Promise<boolean> {
    console.log(`[SMS MOCK] Send to ${to}: "${message}"`);
    return true;
  }
  async sendOtp(to: string, code: string): Promise<boolean> {
    console.log(`[SMS MOCK] Send OTP ${code} to ${to}`);
    return true;
  }
}

export class TwilioSmsAdapter implements SmsAdapter {
  public readonly provider = SmsProvider.TWILIO;

  async sendSms(to: string, message: string): Promise<boolean> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER || "+1234567890";

    if (!accountSid || !authToken) {
      console.warn("Twilio credentials not configured. Falling back to console logging.");
      console.log(`[Twilio SMS Fallback] to ${to}: "${message}"`);
      return true;
    }

    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const body = new URLSearchParams({ From: from, To: to, Body: message });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });

      return response.ok;
    } catch (e) {
      console.error("Twilio sendSms failed:", e);
      return false;
    }
  }

  async sendOtp(to: string, code: string): Promise<boolean> {
    return this.sendSms(to, `Your Vamika Jewels verification OTP is ${code}. Valid for 10 minutes.`);
  }
}

export class GupshupSmsAdapter implements SmsAdapter {
  public readonly provider = SmsProvider.GUPSHUP;

  async sendSms(to: string, message: string): Promise<boolean> {
    const userId = process.env.GUPSHUP_USER_ID;
    const password = process.env.GUPSHUP_PASSWORD;

    if (!userId || !password) {
      console.warn("Gupshup credentials missing. Logging to console.");
      console.log(`[Gupshup SMS Fallback] to ${to}: "${message}"`);
      return true;
    }

    try {
      const url = `https://enterprise.smsgupshup.com/GatewayAPI/rest?method=SendMessage&send_to=${to}&msg=${encodeURIComponent(message)}&msg_type=TEXT&userid=${userId}&auth_scheme=plain&password=${password}&v=1.1`;
      const response = await fetch(url);
      return response.ok;
    } catch (e) {
      console.error("Gupshup sendSms failed:", e);
      return false;
    }
  }

  async sendOtp(to: string, code: string): Promise<boolean> {
    return this.sendSms(to, `Your Vamika OTP is ${code}`);
  }
}

export class Msg91SmsAdapter implements SmsAdapter {
  public readonly provider = SmsProvider.MSG91;

  async sendSms(to: string, message: string): Promise<boolean> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const flowId = process.env.MSG91_FLOW_ID;

    if (!authKey) {
      console.warn("MSG91 credentials missing. Logging to console.");
      console.log(`[MSG91 SMS Fallback] to ${to}: "${message}"`);
      return true;
    }

    try {
      const response = await fetch("https://api.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "authkey": authKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          flow_id: flowId,
          recipients: [{ mobiles: to, message }]
        })
      });
      return response.ok;
    } catch (e) {
      console.error("MSG91 sendSms failed:", e);
      return false;
    }
  }

  async sendOtp(to: string, code: string): Promise<boolean> {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      console.log(`[MSG91 OTP Fallback] Send ${code} to ${to}`);
      return true;
    }

    try {
      const response = await fetch(`https://api.msg91.com/api/v5/otp/send?mobile=${to}&authkey=${authKey}&otp=${code}`);
      return response.ok;
    } catch (e) {
      console.error("MSG91 sendOtp failed:", e);
      return false;
    }
  }
}
