package com.thesystem.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import java.util.Calendar;

/**
 * TopicWidget — "Topic of the Day" Android home-screen widget.
 *
 * Shows a single THE SYSTEM motivational focus topic that rotates daily.
 * Uses a deterministic rotation based on day-of-year so every device shows
 * the same topic on the same day (no backend call needed — works fully offline).
 *
 * Size: 2×1 to 4×1 cells (configured in widget_topic_info.xml).
 * Tap → opens the app and navigates to the Habits screen.
 */
public class TopicWidget extends AppWidgetProvider {

    /** Motivational topics, rotating daily. Add more to increase variety. */
    private static final String[] TOPICS = {
        "DISCIPLINE OVER MOTIVATION",
        "ONE MORE REP. ONE MORE PROBLEM.",
        "CODE WITHOUT AI TODAY",
        "YOUR STREAK IS YOUR IDENTITY",
        "SLEEP IS THE PERFORMANCE DRUG",
        "ZINC · SUN · COLD SHOWER · EXERCISE",
        "LEETCODE: ONE PROBLEM, FULL SOLVE",
        "SPEAK ENGLISH FOR 30 MINUTES",
        "NO REELS. NO SHORTS. BUILD INSTEAD.",
        "REVIEW YOUR WEEKLY PROGRESS",
        "COMPOUND 1% EVERY SINGLE DAY",
        "THE HUNTER DOESN'T SKIP FUEL",
        "MORNING ROUTINE UNLOCKS THE DAY",
        "TESTOSTERONE IS BUILT, NOT GIVEN",
        "APPLY TO ONE JOB TODAY",
        "SYSTEM > WILLPOWER",
        "IDENTITY: WHO ARE YOU BECOMING?",
        "DEEP WORK: 90 MINUTES UNINTERRUPTED",
        "ENGLISH FLUENCY IS A WEAPON",
        "YOUR HABITS ARE YOUR RANK",
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        // Pick today's topic deterministically from day-of-year
        int dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        String topic = TOPICS[dayOfYear % TOPICS.length];

        // Build remote views from the widget layout
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_topic);
        views.setTextViewText(R.id.widget_topic_text, topic);

        // Tap intent → opens MainActivity (Capacitor loads Angular, routes to /habits via URL)
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_MAIN);
        launchIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.putExtra("route", "/habits");

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        manager.updateAppWidget(widgetId, views);
    }
}
