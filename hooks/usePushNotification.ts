import { useState, useEffect } from "react";
import axios from "axios";

// Replace with your actual VAPID public key and backend URL
const VAPID_PUBLIC_KEY = process.env.EXPO_VAPID_PUBLIC_API_KEY
const API_URL = process.env.EXPO_PUBLIC_API_URL

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function useWebPushNotification() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);

  useEffect(() => {
    async function registerWebPush() {
      if (!VAPID_PUBLIC_KEY) {
        console.warn("VAPID_PUBLIC_KEY is not configured");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker not supported in this browser");
        return;
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        console.warn("Notification permission denied");
        return;
      }

      // Register service worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/service-worker.js");
      }

      // Subscribe to push
      const pushSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to backend
      await axios.post(`${API_URL}/api/notifications/subscribe`, pushSub);

      setSubscription(pushSub);
      console.log("✅ Web Push Subscription:", pushSub);
    }

    registerWebPush().catch(console.error);
  }, []);

  return { subscription, permission };
}
