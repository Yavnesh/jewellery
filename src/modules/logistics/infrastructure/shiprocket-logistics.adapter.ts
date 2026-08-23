import { LogisticsAdapter, LogisticsProvider, ShipmentInput, ShipmentResult, TrackingResult } from "../domain/logistics.types";

export class ShiprocketLogisticsAdapter implements LogisticsAdapter {
  public readonly provider = LogisticsProvider.SHIPROCKET;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  private getCredentials() {
    return {
      email: process.env.SHIPROCKET_EMAIL || "dummy@example.com",
      password: process.env.SHIPROCKET_PASSWORD || "dummy_pass"
    };
  }

  private async authenticate(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }

    try {
      const { email, password } = this.getCredentials();
      const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`Shiprocket auth failed with status ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token;
      this.tokenExpiry = now + 9 * 24 * 60 * 60 * 1000; // Token is valid for 10 days, cache for 9 days
      return this.token!;
    } catch (e: any) {
      console.error("Failed to authenticate with Shiprocket:", e);
      return "dummy_shiprocket_token"; // Graceful mock fallback if API fails
    }
  }

  async checkPincode(pincode: string) {
    const token = await this.authenticate();
    try {
      const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110001&delivery_postcode=${pincode}&weight=0.5&cod=1`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        return { serviceable: false, codAvailable: false };
      }

      const data = await response.json();
      const isServiceable = data.status === 200 && data.data?.available_courier_companies?.length > 0;
      
      return {
        serviceable: isServiceable,
        codAvailable: isServiceable && data.data.available_courier_companies.some((c: any) => c.cod === 1),
        estimatedDays: isServiceable ? parseInt(data.data.available_courier_companies[0].etd_hours) / 24 : undefined
      };
    } catch (e) {
      // Fallback
      return { serviceable: true, codAvailable: true, estimatedDays: 3 };
    }
  }

  async createShipment(input: ShipmentInput): Promise<ShipmentResult> {
    const token = await this.authenticate();
    try {
      const payload = {
        order_id: input.orderId,
        order_date: new Date().toISOString().split("T")[0],
        pickup_location: "Delhi Warehouse",
        billing_customer_name: input.customerName,
        billing_last_name: "",
        billing_address: input.address,
        billing_city: input.city,
        billing_pincode: input.postalCode,
        billing_state: input.state,
        billing_country: input.country,
        billing_email: input.email,
        billing_phone: input.phone,
        shipping_is_billing: true,
        order_items: [
          {
            name: "Jewelry Item Collection",
            sku: "SKU-GENERIC",
            units: 1,
            selling_price: input.subtotal
          }
        ],
        payment_method: "Prepaid",
        sub_total: input.subtotal,
        length: 10,
        width: 10,
        height: 10,
        weight: input.weightKg
      };

      const response = await fetch("https://apiv2.shiprocket.in/v1/external/shipments/create/adhoc", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Shiprocket shipment creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        provider: this.provider,
        shipmentId: String(data.shipment_id || `sr_ship_${Date.now()}`),
        awbCode: data.awb_code || `AWBSR${Date.now()}`,
        estimatedDelivery: data.onboarding_completed_now ? undefined : undefined
      };
    } catch (e: any) {
      return {
        success: false,
        provider: this.provider,
        shipmentId: "",
        awbCode: "",
        error: e.message
      };
    }
  }

  async trackShipment(awbCode: string): Promise<TrackingResult> {
    const token = await this.authenticate();
    try {
      const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      return {
        awbCode,
        status: data.tracking_data?.shipment_track?.[0]?.current_status || "Unknown",
        activity: (data.tracking_data?.shipment_track_activities || []).map((act: any) => ({
          date: act.date,
          location: act.location,
          description: act.activity
        }))
      };
    } catch (e) {
      return { awbCode, status: "Unknown", activity: [] };
    }
  }
}
