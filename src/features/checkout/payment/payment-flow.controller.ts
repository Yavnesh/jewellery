export type ClientPaymentAction =
  | { type: "REDIRECT"; redirectUrl: string }
  | { type: "SDK"; publicKey: string; sessionId: string }
  | { type: "NONE" };

export type PaymentState =
  | "IDLE"
  | "VALIDATING_CART"
  | "CREATING_ORDER"
  | "INITIALIZING_PAYMENT"
  | "AWAITING_CUSTOMER_ACTION"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED";

export interface PaymentClient {
  supports(action: ClientPaymentAction): boolean;
  execute(action: ClientPaymentAction): Promise<{ success: boolean; error?: string }>;
}

export class PaymentFlowController {
  private clients: PaymentClient[] = [];
  private state: PaymentState = "IDLE";
  private stateListener?: (state: PaymentState) => void;

  registerClient(client: PaymentClient) {
    this.clients.push(client);
  }

  onStateChange(listener: (state: PaymentState) => void) {
    this.stateListener = listener;
  }

  private setState(newState: PaymentState) {
    this.state = newState;
    if (this.stateListener) {
      this.stateListener(this.state);
    }
  }

  async startCheckout(requestData: any) {
    try {
      this.setState("VALIDATING_CART");
      this.setState("CREATING_ORDER");
      this.setState("INITIALIZING_PAYMENT");

      // Replace with actual API call to /api/checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize payment");
      }

      this.setState("AWAITING_CUSTOMER_ACTION");
      
      const action = data.payment.clientAction as ClientPaymentAction;
      
      const client = this.clients.find(c => c.supports(action));
      if (!client) {
        throw new Error("No client found for payment action");
      }

      const result = await client.execute(action);
      
      if (result.success) {
        this.setState("PAYMENT_PROCESSING");
        // Typically here we poll the backend or wait for webhook to confirm success
        // Simulating immediate success for frontend demo
        this.setState("PAYMENT_CONFIRMED");
      } else {
        this.setState("PAYMENT_FAILED");
      }
    } catch (error) {
      console.error("Checkout flow error:", error);
      this.setState("PAYMENT_FAILED");
    }
  }
}

// Implement standard redirect client
export class RedirectPaymentClient implements PaymentClient {
  supports(action: ClientPaymentAction): boolean {
    return action.type === "REDIRECT";
  }

  async execute(action: ClientPaymentAction): Promise<{ success: boolean }> {
    if (action.type === "REDIRECT") {
      window.location.href = action.redirectUrl;
      // The promise won't really resolve because of the redirect
      return new Promise(() => {}); 
    }
    return { success: false };
  }
}

// Implement Razorpay SDK client
export class RazorpaySdkClient implements PaymentClient {
  supports(action: ClientPaymentAction): boolean {
    return action.type === "SDK";
  }

  async execute(action: ClientPaymentAction): Promise<{ success: boolean; error?: string }> {
    if (action.type !== "SDK") return { success: false };

    return new Promise((resolve) => {
      const options = {
        key: action.publicKey,
        order_id: action.sessionId,
        handler: function (response: any) {
          // Success callback
          resolve({ success: true });
        },
        modal: {
          ondismiss: function () {
            resolve({ success: false, error: "Payment cancelled by user" });
          }
        }
      };
      // Assume Razorpay script is loaded globally
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    });
  }
}
