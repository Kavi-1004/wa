import { registerAs } from "@nestjs/config";

export default registerAs("whatsapp", () => ({
  apiToken: process.env.WHATSAPP_API_TOKEN || "",
  businessId: process.env.WHATSAPP_BUSINESS_ID || "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  apiUrl: process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v25.0",
}));
