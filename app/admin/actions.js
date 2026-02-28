"use server";

import clientPromise from "../../lib/db";

const ADMIN_PASSCODE = "guedalia050504";

export async function fetchStats(passcode) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        const docs = await db.collection("rsvps").find().sort({ created_at: -1 }).toArray();
        const rawRsvps = docs.map(doc => ({
            id: doc._id.toString(),
            names: doc.names,
            guest_count: doc.guest_count,
            phone: doc.phone,
            attendance_type: doc.attendance_type,
            is_attending: doc.is_attending,
            guests: doc.guests,
            created_at: doc.created_at ? doc.created_at.toISOString() : null
        }));

        // Calculate statistics
        const stats = {
            totalResponses: rawRsvps.length,
            attending: 0,
            notAttending: 0,
            chuppahOnly: 0,
            dancingOnly: 0,
            both: 0,
            totalGuests: 0
        };

        rawRsvps.forEach(rsvp => {
            if (rsvp.is_attending === 1) {
                stats.attending += 1;
                stats.totalGuests += rsvp.guest_count;

                if (rsvp.guests && Array.isArray(rsvp.guests) && rsvp.guests.length > 0) {
                    rsvp.guests.forEach(g => {
                        if (g.chuppah && !g.dance) stats.chuppahOnly += 1;
                        else if (!g.chuppah && g.dance) stats.dancingOnly += 1;
                        else if (g.chuppah && g.dance) stats.both += 1;
                    });
                } else {
                    if (rsvp.attendance_type === "חופה") stats.chuppahOnly += rsvp.guest_count;
                    else if (rsvp.attendance_type === "ריקודים") stats.dancingOnly += rsvp.guest_count;
                    else if (rsvp.attendance_type === "שניהם") stats.both += rsvp.guest_count;
                }
            } else {
                stats.notAttending += 1;
            }
        });

        return { success: true, stats, rsvps: rawRsvps };
    } catch (error) {
        console.error("Failed to fetch statistics", error);
        return { error: "שגיאה בטעינת הנתונים" };
    }
}
