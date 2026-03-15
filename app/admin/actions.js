"use server";

import clientPromise from "../../lib/db";
import * as XLSX from 'xlsx';
import { ObjectId } from 'mongodb';

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

export async function exportGuestsData(passcode, exportType = "all") {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        const query = (exportType === "new") ? { is_exported: { $ne: true } } : {};
        
        const docs = await db.collection("rsvps").find(query).toArray();
        if (docs.length === 0) {
            return { error: "אין נתונים חדשים לייצוא" };
        }

        const headers = [
            "*שם המוזמן (חובה)",
            "נייד",
            "כמה יגיעו?",
            "מהצד של...",
            "סטטוס הגעה (יגיע, מתלבט, לא יגיע)",
            "האם נשלחה הזמנה? (נשלחה, לא נשלחה)",
            "mail",
            "הערות (מלל חופשי)",
            "מספר הטלפון של המשתמש שהכניס את המוזמן באפליקציה"
        ];

        const rows = docs.map(doc => {
            const isAttendingText = doc.is_attending === 1 ? "יגיע" : "לא יגיע";
            let comments = doc.reason || "";
            // Optionally, add guest names to notes
            if (doc.guests && doc.guests.length > 0) {
                 const guestList = doc.guests.map(g => g.name || "אורח").join(", ");
                 comments += comments ? ` | מגיעים: ${guestList}` : `מגיעים: ${guestList}`;
            }

            return {
                [headers[0]]: doc.names || "",
                [headers[1]]: doc.phone || "",
                [headers[2]]: doc.guest_count || 0,
                [headers[3]]: doc.side || "",
                [headers[4]]: isAttendingText,
                [headers[5]]: "",
                [headers[6]]: "",
                [headers[7]]: comments,
                [headers[8]]: ""
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Guests");

        const base64Excel = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

        if (exportType === "new" || exportType === "all") {
            const ids = docs.map(d => d._id);
            await db.collection("rsvps").updateMany(
                { _id: { $in: ids } },
                { $set: { is_exported: true, exported_at: new Date() } }
            );
        }

        return { success: true, base64Excel };
    } catch (error) {
        console.error("Failed to export data", error);
        return { error: "שגיאה בייצוא הנתונים" };
    }
}

export async function deleteRsvp(passcode, id) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");
        await db.collection("rsvps").deleteOne({ _id: new ObjectId(id) });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete rsvp", error);
        return { error: "שגיאה במחיקת הרשומה" };
    }
}
