import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Display notifications while LifeVault is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// REQUEST PERMISSION
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    console.log("Checking notification permission...");

    const permission = await Notifications.getPermissionsAsync();

    console.log("Permission result:", permission);

    if (permission.granted) {
      console.log("Notification permission already granted.");
      return true;
    }

    console.log("Requesting notification permission...");

    const result = await Notifications.requestPermissionsAsync();

    console.log("Permission request result:", result);

    return result.granted;
  } catch (error) {
    console.error("Permission diagnostic error:", error);
    return false;
  }
}

// SCHEDULE NOTIFICATION
export async function scheduleReminderNotification(
  title: string,
  description: string,
  reminderDateTime: string,
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (Platform.OS === "android") {
      const exactAlarm = await Notifications.getExactAlarmPermissionsAsync();

      console.log("Exact alarm permission:", exactAlarm);
    }

    if (!hasPermission) {
      console.log("Notification permission not granted.");
      return null;
    }

    const [datePart, timePart] = reminderDateTime.split(" ");

    const [year, month, day] = datePart.split("-").map(Number);

    const [hour, minute] = timePart.split(":").map(Number);

    const reminderDate = new Date(year, month - 1, day, hour, minute, 0);

    if (reminderDate.getTime() <= Date.now()) {
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
        type: "date",
        date: reminderDate,
        delivery: Platform.OS === "android" ? "alarmClock" : "bestEffort",
      },
    });

    console.log("Notification scheduled successfully:", notificationId);

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    console.log("All scheduled notifications:", scheduled);

    return notificationId;
  } catch (error) {
    console.error("Notification scheduling error:", error);
    return null;
  }
}

// CANCEL NOTIFICATION
export async function cancelReminderNotification(
  notificationId: string | null,
) {
  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);

      console.log("Notification cancelled:", notificationId);
    }
  } catch (error) {
    console.error("Notification cancellation error:", error);
  }
}
