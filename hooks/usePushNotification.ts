import { useState, useEffect } from "react";
import axios from "axios";
import { Platform } from "react-native";
import { useAuth } from "../context/authContext"; // 🟢 Ensure this path is correct

const VAPID_PUBLIC_KEY = process.env.EXPO_VAPID_PUBLIC_API_KEY;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function useWebPushNotification() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { user } = useAuth(); // 🟢 Get the logged-in user

  useEffect(() => {
    async function registerWebPush() {
      // 1. Wait for user to be logged in
      if (!user?.id) return; 

      if (!VAPID_PUBLIC_KEY || Platform.OS !== "web" || !("serviceWorker" in navigator)) {
        return;
      }

      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return;

        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register("/service-worker.js");
        }

        await navigator.serviceWorker.ready;

        let pushSub = await registration.pushManager.getSubscription();
        if (!pushSub) {
          pushSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // 🟢 CHANGE: Send userId manually in the body
        await axios.post(`${API_URL}/api/notifications/subscribe`, {
          subscription: pushSub,
          userId: user.id 
        });

        setSubscription(pushSub);
        console.log("✅ Web Push Registered for User:", user.id);

      } catch (error) {
        console.error("❌ Web Push Error:", error);
      }
    }

    registerWebPush();
  }, [user]); // Re-run when user logs in

  return { subscription };
}