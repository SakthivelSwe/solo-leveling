# THE SYSTEM — ProGuard / R8 Rules
# These rules are required when minifyEnabled = true for the release build.
# Without them, R8 would strip Capacitor plugin classes and crash at runtime.

# ── Capacitor / Cordova bridge ────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }

# ── Our own plugin / service classes ─────────────────────────────────────────
-keep class com.thesystem.app.** { *; }

# ── AndroidX WebKit / WebView ─────────────────────────────────────────────────
-keep class androidx.webkit.** { *; }
-keep class android.webkit.** { *; }

# ── Preserve @PluginMethod annotations so the bridge can find them at runtime ─
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# ── AppWidget (home screen widget) ────────────────────────────────────────────
-keep public class * extends android.appwidget.AppWidgetProvider { *; }

# ── BroadcastReceivers / Services referenced in AndroidManifest ───────────────
-keep public class * extends android.content.BroadcastReceiver { *; }
-keep public class * extends android.app.Service { *; }
-keep public class * extends android.app.Activity { *; }

# ── Health Connect API ────────────────────────────────────────────────────────
-keep class androidx.health.** { *; }

# ── Debugging: preserve line numbers in crash reports ────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
