package net.emerj.zedu

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

class IncomingCallModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "IncomingCallAndroid"

    @ReactMethod
    fun getLaunchIncomingCall(promise: Promise) {
        try {
            val launchData = IncomingCallLaunchStore.peek(reactApplicationContext)
            if (launchData == null) {
                promise.resolve(null)
                return
            }

            promise.resolve(buildLaunchWritableMap(launchData))
        } catch (error: Exception) {
            promise.reject("incoming_call_error", error)
        }
    }

    @ReactMethod
    fun clearLaunchIncomingCall(promise: Promise) {
        IncomingCallLaunchStore.clear(reactApplicationContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun dismissIncomingCallNotification(promise: Promise) {
        IncomingCallNotificationHelper.dismiss(reactApplicationContext)
        promise.resolve(null)
    }

    companion object {
        const val EVENT_INCOMING_CALL = "IncomingDirectCallAndroid"
        const val EVENT_INCOMING_CALL_CANCELLED = "IncomingDirectCallCancelled"

        private var reactContextRef: ReactApplicationContext? = null

        fun registerContext(context: ReactApplicationContext) {
            reactContextRef = context
        }

        fun emitIncomingCallEvent(payload: JSONObject, action: String) {
            val context = reactContextRef ?: return
            if (!context.hasActiveReactInstance()) {
                return
            }

            val invite = IncomingCallPayload.toInviteMap(payload)
            val params = buildLaunchWritableMap(
                IncomingCallLaunchStore.LaunchData(invite = invite, action = action),
            )

            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_INCOMING_CALL, params)
        }

        fun emitIncomingCallCancelled(payload: JSONObject) {
            val context = reactContextRef ?: return
            if (!context.hasActiveReactInstance()) {
                return
            }

            val params = Arguments.createMap()
            params.putString("buzzId", payload.optString("buzz_id", ""))

            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_INCOMING_CALL_CANCELLED, params)
        }

        private fun buildLaunchWritableMap(
            launchData: IncomingCallLaunchStore.LaunchData,
        ): WritableMap {
            val map = Arguments.createMap()
            map.putString("action", launchData.action)
            map.putMap("invite", toWritableMap(launchData.invite))
            return map
        }

        private fun toWritableMap(source: Map<String, Any?>): WritableMap {
            val map = Arguments.createMap()
            source.forEach { (key, value) ->
                when (value) {
                    null -> map.putNull(key)
                    is String -> map.putString(key, value)
                    is Boolean -> map.putBoolean(key, value)
                    is Int -> map.putInt(key, value)
                    is Double -> map.putDouble(key, value)
                    is Float -> map.putDouble(key, value.toDouble())
                    is Long -> map.putDouble(key, value.toDouble())
                    is List<*> -> map.putArray(key, Arguments.fromList(value))
                    is Map<*, *> -> {
                        @Suppress("UNCHECKED_CAST")
                        map.putMap(key, toWritableMap(value as Map<String, Any?>))
                    }
                    else -> map.putString(key, value.toString())
                }
            }
            return map
        }
    }
}
