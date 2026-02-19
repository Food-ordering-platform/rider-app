# 🛵 ChowEazy Rider App

![Expo](https://img.shields.io/badge/Expo-54.0-black?logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.81-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Zustand](https://img.shields.io/badge/Zustand-5.0-orange)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?logo=socket.io)

The official **ChowEazy Rider App** is a cross-platform mobile application built specifically for delivery logistics. Built with **React Native** and **Expo**, it empowers delivery personnel to receive dispatch requests, view live routes, and update order statuses in real-time.

---

## ✨ Key Features

- **🔴 Live Dispatch & Real-Time Tracking:** Integrated with `socket.io-client` to receive instant order dispatches and emit live GPS coordinates back to the customer and vendor.
- **🗺️ Geospatial Navigation:** Leverages `expo-location` and `react-native-maps` to display delivery routes, estimate arrival times, and calculate distance-based earnings.
- **🔔 Instant Notifications:** Uses `expo-notifications` to alert riders of new order requests even when the app is in the background.
- **📱 Hardware Integrations:** Utilizes haptic feedback (`expo-haptics`), device clipboard (`expo-clipboard`), and camera/gallery (`expo-image-picker`) for a deeply integrated native experience.
- **🔒 Secure Storage:** Employs `expo-secure-store` to keep JWT tokens and rider credentials safely encrypted on-device.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native & Expo (v54) |
| Navigation | Expo Router (`expo-router` v6) |
| Local State | Zustand |
| Server State | TanStack React Query |
| Mapping | React Native Maps & Expo Location |
| Real-time | Socket.io Client |
| Validation | Zod |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v20+ |
| Expo CLI | Latest (`npm install -g expo-cli`) |
| Device | Expo Go app on physical device **or** iOS Simulator / Android Emulator |

---

### 1. Clone & Install

```bash
git clone https://github.com/your-org/rider-app.git
cd rider-app
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://your-local-ip:4000/api
EXPO_PUBLIC_SOCKET_URL=http://your-local-ip:4000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

> ⚠️ **Note:** For local development on physical devices, use your machine's local IP address instead of `localhost`.

### 3. Start the Development Server

```bash
npx expo start
```

### 4. Run on a Device or Emulator

| Platform | Action |
|---|---|
| Physical Device | Scan the QR code with the **Expo Go** app |
| iOS Simulator | Press `i` in the terminal |
| Android Emulator | Press `a` in the terminal |

---

## 📦 Build & Deployment

This project is configured for **EAS (Expo Application Services)**.

To build the `APK`/`AAB` for Android or `IPA` for iOS:

```bash
eas build --platform all
```

---

<div align="center">
  Built with ❤️ for the <strong>ChowEazy</strong> Ecosystem
</div>
