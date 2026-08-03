"use client";

import { useEffect } from "react";
import { datadogRum } from "@datadog/browser-rum";

export default function DatadogInit() {
  useEffect(() => {
    // Only initialize Datadog if consent is granted or if it's considered necessary
    const hasConsent = localStorage.getItem("cookie_consent_analytics") === "true";
    
    if (hasConsent && !datadogRum.getInternalContext()) {
      datadogRum.init({
        applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID || "dummy-app-id",
        clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "dummy-token",
        site: "datadoghq.com",
        service: "tanishq-ecommerce",
        env: process.env.NODE_ENV || "development",
        version: "1.0.0",
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: "mask-user-input",
      });
      
      datadogRum.startSessionReplayRecording();
    }
  }, []);

  return null;
}
