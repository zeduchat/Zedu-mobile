package net.emerj.zedu

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object IncomingCallRingingController {
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null

    private val vibrationPattern = longArrayOf(0, 900, 500, 900)

    fun start(context: Context) {
        stop()
        startRingtone(context)
        startVibration(context)
    }

    fun stop() {
        try {
            mediaPlayer?.stop()
        } catch (_: Exception) {
        }
        mediaPlayer?.release()
        mediaPlayer = null

        vibrator?.cancel()
        vibrator = null
    }

    private fun startRingtone(context: Context) {
        val player = MediaPlayer.create(context.applicationContext, R.raw.incomingcall) ?: return
        player.isLooping = true
        player.setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build(),
        )
        player.start()
        mediaPlayer = player
    }

    private fun startVibration(context: Context) {
        val appContext = context.applicationContext
        val activeVibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = appContext.getSystemService(VibratorManager::class.java)
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            appContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        } ?: return

        vibrator = activeVibrator

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activeVibrator.vibrate(
                VibrationEffect.createWaveform(vibrationPattern, 0),
            )
        } else {
            @Suppress("DEPRECATION")
            activeVibrator.vibrate(vibrationPattern, 0)
        }
    }
}
