/**
 * Telegram Bot notification helper
 * Sends formatted messages to the configured Telegram chat
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Send a message to the Telegram bot
 * @param {string} message - The message text (supports HTML formatting)
 */
export async function sendTelegramNotification(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID — skipping notification.");
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML",
            }),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            console.error("[Telegram] Failed to send notification:", res.status, errorBody);
        }
    } catch (err) {
        console.error("[Telegram] Error sending notification:", err.message);
    }
}

/**
 * Format an RSVP submission into a detailed Telegram notification message
 */
export function formatRSVPNotification({ isUpdate, isAttending, names, guestCount, guests, phone, side, reason }) {
    const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
    const statusEmoji = isAttending ? "✅" : "❌";
    const statusText = isAttending ? "מגיע/ה" : "לא מגיע/ה";
    const updateTag = isUpdate ? " (עדכון)" : "";

    let msg = "";
    msg += `${statusEmoji} <b>אישור הגעה חדש${updateTag}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `👤 <b>שם:</b> ${names || "לא צוין"}\n`;
    msg += `📊 <b>סטטוס:</b> ${statusText}\n`;
    msg += `👥 <b>מספר אורחים:</b> ${guestCount}\n`;

    if (side) {
        msg += `💒 <b>צד:</b> ${side === "חתן" ? "צד החתן" : "צד הכלה"}\n`;
    }

    if (phone) {
        msg += `📱 <b>טלפון:</b> ${phone}\n`;
    }

    if (isAttending && guests && guests.length > 0) {
        msg += `\n🎉 <b>פירוט המוזמנים:</b>\n`;
        guests.forEach((g, i) => {
            const events = [];
            if (g.chuppah) events.push("חופה");
            if (g.eat !== false) events.push("ארוחה");
            if (g.dance) events.push("ריקודים");
            const eventsStr = events.length > 0 ? events.join(", ") : "לא נבחרו אירועים";
            msg += `   ${i + 1}. ${g.name || "—"} → ${eventsStr}\n`;
        });
    }

    if (!isAttending && reason) {
        msg += `\n📝 <b>סיבה:</b> ${reason}\n`;
    }

    msg += `\n🕐 <b>תאריך:</b> ${now}`;

    return msg;
}
