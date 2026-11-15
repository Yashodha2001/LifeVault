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
    if (Platform.OS !== "android") return true;

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
    if (!hasPermission) return null;

    const dateParts = reminderDateTime.trim().split(" ");
    if (dateParts.length !== 2) {
      console.log("Invalid reminder date/time:", reminderDateTime);
      return null;
    }

    const [datePart, timePart] = dateParts;
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    if (
      !year ||
      !month ||
      !day ||
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      console.log("Invalid reminder date/time values:", reminderDateTime);
      return null;
    }

    const reminderDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (
      reminderDate.getFullYear() !== year ||
      reminderDate.getMonth() !== month - 1 ||
      reminderDate.getDate() !== day
    ) {
      console.log("Invalid calendar date:", reminderDateTime);
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
        data: { screen: "reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
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

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log("Medicine notification permission not granted.");
      return null;
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(reminderTime)) {
      console.log("Invalid medicine reminder time:", reminderTime);
      return null;
    }

    const [hour, minute] = reminderTime.split(":").map(Number);

    // Keep the existing medicine exact-alarm check, but do not create
    // notification channels here. The app's current Expo Go setup does not
    // need a channel-creation call in this helper.
    if (Platform.OS === "android") {
      await checkExactAlarmPermission();
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Time to take ${medicineName}`,
        body: `Dosage: ${dosage}. Please follow your prescribed instructions.`,
        sound: "default",
        data: { screen: "medicine", medicineName },
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

    console.log("Daily medicine notification scheduled:", notificationId);
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
// SCHEDULE IMPORTANT DATE NOTIFICATION
// ==================================================
// eventDate must be YYYY-MM-DD.
// notificationDaysBefore = 0 means no notification.
// Notifications are scheduled for 9:00 AM on the selected advance day.

export async function scheduleImportantDateNotification(
  title: string,
  description: string,
  eventDate: string,
  notificationDaysBefore: number,
): Promise<string | null> {
  try {
    const daysBefore = Number(notificationDaysBefore);

    if (!Number.isInteger(daysBefore) || daysBefore < 0 || daysBefore > 30) {
      console.log(
        "Invalid Important Date notification days:",
        notificationDaysBefore,
      );
      return null;
    }

    // Zero means the user does not want an advance notification.
    if (daysBefore === 0) {
      console.log("No advance notification requested for this Important Date.");
      return null;
    }

    const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = eventDate.match(datePattern);
    if (!match) {
      console.log("Invalid Important Date. Expected YYYY-MM-DD:", eventDate);
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const event = new Date(year, month - 1, day, 9, 0, 0, 0);

    // Reject impossible dates such as 2026-02-31.
    if (
      event.getFullYear() !== year ||
      event.getMonth() !== month - 1 ||
      event.getDate() !== day
    ) {
      console.log("Invalid calendar date for Important Date:", eventDate);
      return null;
    }

    // Move back by the requested number of calendar days.
    event.setDate(event.getDate() - daysBefore);
    event.setHours(9, 0, 0, 0);

    if (event.getTime() <= Date.now()) {
      console.log(
        "Important Date notification time is in the past; not scheduled.",
      );
      return null;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log("Important Date notification permission denied.");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 Upcoming Important Date: ${title}`,
        body: description
          ? `${description} (Event date: ${eventDate})`
          : `Your important date is coming up on ${eventDate}.`,
        sound: "default",
        data: {
          screen: "dates",
          eventDate,
          title,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: event,
      },
    });

    console.log(
      "Important Date notification scheduled:",
      notificationId,
      event,
    );
    return notificationId;
  } catch (error) {
    console.error("Important Date notification scheduling error:", error);
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
// CANCEL IMPORTANT DATE NOTIFICATION
// ==================================================

export async function cancelImportantDateNotification(
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

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "LifeVault Test Notification",
        body: "Your local notifications are working!",
        sound: "default",
        data: { screen: "test" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });

    console.log("Test notification scheduled.");
    return true;
  } catch (error) {
    console.error("Test notification failed:", error);
    return false;
  }
}
