package net.emerj.zedu

import android.app.Notification
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

class IncomingCallForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val callerName = intent?.getStringExtra(EXTRA_CALLER_NAME) ?: "Incoming call"

        IncomingCallNotificationHelper.ensureChannels(this)
        IncomingCallRingingController.start(this)

        val notification = IncomingCallNotificationHelper.buildServiceNotification(this, callerName)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                IncomingCallNotificationHelper.NOTIFICATION_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL,
            )
        } else {
            startForeground(IncomingCallNotificationHelper.NOTIFICATION_ID, notification)
        }

        return START_STICKY
    }

    override fun onDestroy() {
        IncomingCallRingingController.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    companion object {
        private const val EXTRA_CALLER_NAME = "caller_name"
        private const val EXTRA_PAYLOAD_JSON = "payload_json"

        fun start(context: Context, callerName: String, payloadJson: String) {
            val intent = Intent(context, IncomingCallForegroundService::class.java).apply {
                putExtra(EXTRA_CALLER_NAME, callerName)
                putExtra(EXTRA_PAYLOAD_JSON, payloadJson)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            IncomingCallRingingController.stop()
            context.stopService(Intent(context, IncomingCallForegroundService::class.java))
        }
    }
}
