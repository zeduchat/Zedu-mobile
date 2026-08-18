package net.emerj.zedu

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONObject

object IncomingCallNotificationHelper {
    const val SERVICE_CHANNEL_ID = "incoming_direct_calls_service"
    const val NOTIFICATION_ID = 91001

    const val EXTRA_INCOMING_CALL = "incoming_direct_call"
    const val EXTRA_CALL_ACTION = "incoming_call_action"

    fun showIncomingCallNotification(context: Context, payload: JSONObject) {
        ensureChannels(context.applicationContext)

        val payloadJson = payload.toString()

        IncomingCallLaunchStore.save(context.applicationContext, payload, IncomingCallLaunchStore.ACTION_OPEN)
        IncomingCallForegroundService.start(
            context.applicationContext,
            payload.optString("caller_name", "Incoming call"),
            payloadJson,
        )
        launchIncomingCallUi(
            context.applicationContext,
            payloadJson,
            IncomingCallLaunchStore.ACTION_OPEN,
        )
    }

    fun buildServiceNotification(context: Context, callerName: String): Notification {
        ensureChannels(context)

        return NotificationCompat.Builder(context, SERVICE_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(callerName)
            .setContentText("Incoming call")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .setSilent(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .build()
    }

    fun launchIncomingCallUi(context: Context, payloadJson: String, action: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_INCOMING_CALL, true)
            putExtra(EXTRA_CALL_ACTION, action)
            putExtra("payload_json", payloadJson)
        }
        context.startActivity(intent)
    }

    fun dismiss(context: Context) {
        val appContext = context.applicationContext
        val notificationManager =
            appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        IncomingCallForegroundService.stop(appContext)
        IncomingCallRingingController.stop()
    }

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (notificationManager.getNotificationChannel(SERVICE_CHANNEL_ID) == null) {
            val serviceChannel = NotificationChannel(
                SERVICE_CHANNEL_ID,
                "Incoming call service",
                NotificationManager.IMPORTANCE_MIN,
            ).apply {
                description = "Keeps incoming call ringing active"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(serviceChannel)
        }
    }
}
