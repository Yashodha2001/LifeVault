import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ==================================================
// NOTIFICATION HANDLER
// ==================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ==================================================
// REQUEST NOTIFICATION PERMISSION
// ==================================================

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    console.log("Checking notification permission...");

    let permission = await Notifications.getPermissionsAsync();

    console.log("Current notification permission:", permission);

    if (permission.granted) {
      console.log("Notification permission already granted.");
      return true;
    }

    permission = await Notifications.requestPermissionsAsync();

    console.log("Permission request result:", permission);

    if (!permission.granted) {
      console.log("Notification permission denied.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Notification permission error:", error);
    return false;
  }
}

// ==================================================
// CHECK ANDROID EXACT ALARM PERMISSION
// ==================================================

export async function checkExactAlarmPermission(): Promise<boolean> {
  try {
    if (Platform.OS !== "android") {
      return true;
    }

    const result = await Notifications.getExactAlarmPermissionsAsync();

    console.log("Exact alarm permission result:", result);

    return result.granted;
  } catch (error) {
    console.error("Exact alarm permission check error:", error);
    return false;
  }
}

// ==================================================
// SCHEDULE ONE-TIME REMINDER
// ==================================================

export async function scheduleReminderNotification(
  title: string,
  description: string,
  reminderDateTime: string,
): Promise<string | null> {
  try {
    console.log("Starting reminder notification scheduling...");

    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      console.log("Reminder notification permission denied.");
      return null;
    }

    const dateParts = reminderDateTime.split(" ");

    if (dateParts.length !== 2) {
      console.log("Invalid reminder date/time:", reminderDateTime);
      return null;
    }

    const [datePart, timePart] = dateParts;

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    const reminderDate = new Date(year, month - 1, day, hour, minute, 0);

    if (Number.isNaN(reminderDate.getTime())) {
      console.log("Invalid reminder date.");
      return null;
    }

    if (reminderDate.getTime() <= Date.now()) {
      console.log("Reminder time is in the past.");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `LifeVault Reminder: ${title}`,
        body: description || "You have a reminder!",
        sound: "default",
        data: {
          screen: "reminder",
        },
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        ...(Platform.OS === "android"
          ? { delivery: "alarmClock" as const }
          : {}),
      },
    });

    console.log("Reminder scheduled successfully:", notificationId);

    return notificationId;
  } catch (error) {
    console.error("Reminder notification scheduling error:", error);
    return null;
  }
}

// ==================================================
// SCHEDULE DAILY MEDICINE NOTIFICATION
// ==================================================

export async function scheduleDailyMedicineNotification(
  medicineName: string,
  dosage: string,
  reminderTime: string,
): Promise<string | null> {
  try {
    console.log("--------------------------------");
    console.log("Starting daily medicine notification...");
    console.log("Medicine:", medicineName);
    console.log("Dosage:", dosage);
    console.log("Reminder time:", reminderTime);

    // STEP 1: Check notification permission
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      console.log("Medicine notification permission not granted.");
      return null;
    }

    // STEP 2: Validate time
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!timePattern.test(reminderTime)) {
      console.log("Invalid medicine reminder time:", reminderTime);
      return null;
    }

    const [hour, minute] = reminderTime.split(":").map(Number);

    // STEP 3: Check exact alarm permission on Android
    if (Platform.OS === "android") {
      await checkExactAlarmPermission();
    }

    // STEP 4: Schedule daily notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Time to take ${medicineName}`,
        body: `Dosage: ${dosage}. Please follow your prescribed instructions.`,
        sound: "default",
        data: {
          screen: "medicine",
          medicineName,
        },
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === "android"
          ? { delivery: "alarmClock" as const }
          : {}),
      },
    });

    console.log("Daily medicine notification scheduled successfully!");

    console.log("Notification ID:", notificationId);
    console.log("Scheduled time:", `${hour}:${minute}`);

    console.log("--------------------------------");

    return notificationId;
  } catch (error) {
    console.error("--------------------------------");
    console.error("DAILY MEDICINE NOTIFICATION ERROR:", error);
    console.error("--------------------------------");

    return null;
  }
}

// ==================================================
// CANCEL NOTIFICATION
// ==================================================

export async function cancelReminderNotification(
  notificationId: string | null,
): Promise<void> {
  try {
    if (!notificationId) {
      console.log("No notification ID available to cancel.");
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);

    console.log("Notification cancelled successfully:", notificationId);
  } catch (error) {
    console.error("Notification cancellation error:", error);
  }
}

// ==================================================
// CANCEL MEDICINE NOTIFICATION
// ==================================================

export async function cancelMedicineNotification(
  notificationId: string | null,
): Promise<void> {
  await cancelReminderNotification(notificationId);
}

// ==================================================
// DIAGNOSTIC: CHECK SCHEDULED NOTIFICATIONS
// ==================================================

export async function checkScheduledNotifications() {
  try {
    console.log("Checking all scheduled notifications...");

    const permission = await Notifications.getPermissionsAsync();

    console.log("Notification permission:", permission);

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    console.log("Total scheduled notifications:", scheduled.length);

    scheduled.forEach((item, index) => {
      console.log(`Scheduled notification ${index + 1}:`, {
        id: item.identifier,
        title: item.content.title,
        body: item.content.body,
        trigger: item.trigger,
      });
    });

    return scheduled;
  } catch (error) {
    console.error("Notification diagnostic failed:", error);
    return [];
  }
}

// ==================================================
// TEST: SEND A NOTIFICATION AFTER 10 SECONDS
// ==================================================

export async function sendTestNotification(): Promise<boolean> {
  try {
    console.log("Starting test notification...");

    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      console.log("Test notification permission denied.");
      return false;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "LifeVault Test Notification",
        body: "Your local notifications are working!",
        sound: "default",
        data: {
          screen: "test",
        },
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });

    console.log("Test notification scheduled:", notificationId);

    return true;
  } catch (error) {
    console.error("Test notification failed:", error);
    return false;
  }
}
