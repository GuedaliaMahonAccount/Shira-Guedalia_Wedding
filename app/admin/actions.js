"use server";

import clientPromise from "../../lib/db";
import * as XLSX from 'xlsx';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { getTableByNumber } from "../../lib/tables";

const ADMIN_PASSCODE = "guedalia050504";

export async function fetchStats(passcode) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        const [docs, settingDoc] = await Promise.all([
            db.collection("rsvps").find().sort({ created_at: -1 }).toArray(),
            db.collection("settings").findOne({ key: "hasCoupleTable" })
        ]);
        const hasCoupleTable = settingDoc ? Boolean(settingDoc.value) : false;

        const rawRsvps = docs.map(doc => ({
            id: doc._id.toString(),
            names: doc.names,
            guest_count: doc.guest_count,
            phone: doc.phone,
            attendance_type: doc.attendance_type,
            is_attending: doc.is_attending,
            guests: doc.guests,
            side: doc.side || "",
            admin_notes: doc.admin_notes || "",
            tableNumber: doc.tableNumber || null,
            is_couple: doc.is_couple || false,
            created_at: doc.created_at ? doc.created_at.toISOString() : null
        }));

        // Calculate statistics
        const stats = {
            totalResponses: rawRsvps.length,
            attending: 0,
            notAttending: 0,
            totalGuests: 0,
            totalChuppah: 0,
            totalEat: 0,
            totalDance: 0,
            // Per-side breakdown
            attendingGroomSide: 0,
            guestsGroomSide: 0,
            attendingBrideSide: 0,
            guestsBrideSide: 0,
            attendingNoSide: 0,
            guestsNoSide: 0
        };

        rawRsvps.forEach(rsvp => {
            if (rsvp.is_attending === 1) {
                stats.attending += 1;
                stats.totalGuests += rsvp.guest_count;

                // Per-side stats
                if (rsvp.side === "חתן") {
                    stats.attendingGroomSide += 1;
                    stats.guestsGroomSide += rsvp.guest_count;
                } else if (rsvp.side === "כלה") {
                    stats.attendingBrideSide += 1;
                    stats.guestsBrideSide += rsvp.guest_count;
                } else {
                    stats.attendingNoSide += 1;
                    stats.guestsNoSide += rsvp.guest_count;
                }

                if (rsvp.guests && Array.isArray(rsvp.guests) && rsvp.guests.length > 0) {
                    rsvp.guests.forEach(g => {
                        if (g.chuppah) stats.totalChuppah += 1;
                        if (g.eat !== false) stats.totalEat += 1;

                    });
                } else {
                    if (rsvp.attendance_type === "חופה") {
                        stats.totalChuppah += rsvp.guest_count;
                        stats.totalEat += rsvp.guest_count; // Assumption for old data

                    } else {
                        stats.totalChuppah += rsvp.guest_count;
                        stats.totalEat += rsvp.guest_count;

                    }
                }
            } else {
                stats.notAttending += 1;
            }
        });

        return { success: true, stats, rsvps: rawRsvps, hasCoupleTable };
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
            // Optionally, add guest names and their events to notes
            if (doc.guests && doc.guests.length > 0) {
                 const guestList = doc.guests.map(g => {
                     let events = [];
                     if (g.chuppah) events.push("חופה");
                     if (g.eat !== false) events.push("אוכל");

                     const evStr = events.length > 0 ? ` (${events.join('+')})` : "";
                     return `${g.name || "אורח"}${evStr}`;
                 }).join(", ");
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

export async function fetchGiftsAdmin(passcode) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        const docs = await db.collection("gifts").find().sort({ created_at: -1 }).toArray();
        const gifts = docs.map(doc => ({
            id: doc._id.toString(),
            name: doc.name || "",
            gift: doc.gift,
            created_at: doc.created_at ? doc.created_at.toISOString() : null
        }));

        return { success: true, gifts };
    } catch (error) {
        console.error("Failed to fetch admin gifts", error);
        return { error: "שגיאה בטעינת רשימת המתנות" };
    }
}

export async function deleteGiftAdmin(passcode, id) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        await db.collection("gifts").deleteOne({ _id: new ObjectId(id) });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete gift", error);
        return { error: "שגיאה במחיקת המתנה" };
    }
}

export async function updateRsvp(passcode, id, updates) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    // Only allow updating specific safe fields
    const allowedFields = ["side", "names", "guest_count", "phone", "is_attending", "admin_notes"];
    const sanitizedUpdates = {};
    for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
            sanitizedUpdates[key] = updates[key];
        }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
        return { error: "אין שדות לעדכון" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");
        await db.collection("rsvps").updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...sanitizedUpdates, updated_at: new Date() } }
        );
        return { success: true };
    } catch (error) {
        console.error("Failed to update rsvp", error);
        return { error: "שגיאה בעדכון הרשומה" };
    }
}

/**
 * Assign a table number to a specific guest within an RSVP record.
 * Uses dot-notation to update only guests[guestIndex].tableNumber.
 */
export async function updateGuestTable(passcode, rsvpId, guestIndex, tableNumber) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    const idx = parseInt(guestIndex, 10);
    if (isNaN(idx) || idx < 0) {
        return { error: "אינדקס אורח לא תקין" };
    }

    // Validate table number (valid configured table or null to clear)
    let tableVal = null;
    if (tableNumber !== null && tableNumber !== undefined && tableNumber !== "") {
        tableVal = parseInt(tableNumber, 10);
        if (isNaN(tableVal) || !getTableByNumber(tableVal)) {
            return { error: "מספר שולחן לא תקין" };
        }
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        const setField = `guests.${idx}.tableNumber`;
        if (tableVal === null) {
            await db.collection("rsvps").updateOne(
                { _id: new ObjectId(rsvpId) },
                { $unset: { [setField]: "" }, $set: { updated_at: new Date() } }
            );
        } else {
            await db.collection("rsvps").updateOne(
                { _id: new ObjectId(rsvpId) },
                { $set: { [setField]: tableVal, updated_at: new Date() } }
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to update guest table:", error);
        return { error: "שגיאה בעדכון שולחן" };
    }
}

/**
 * Toggle the Bride & Groom table (table 1000, 2 seats).
 * When enabled:
 *   - saves hasCoupleTable: true in settings
 *   - ensures an RSVP for "גדליה ושירה" exists and is seated at table 1000
 * When disabled:
 *   - saves hasCoupleTable: false in settings
 *   - removes the couple's RSVP and unseats any guests at table 1000
 */
export async function toggleCoupleTable(passcode, enabled) {
    if (passcode !== ADMIN_PASSCODE) {
        return { error: "סיסמה שגויה" };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");
        const isEnabled = Boolean(enabled);

        // 1. Persist the toggle setting
        await db.collection("settings").updateOne(
            { key: "hasCoupleTable" },
            { $set: { key: "hasCoupleTable", value: isEnabled, updated_at: new Date() } },
            { upsert: true }
        );

        if (isEnabled) {
            // 2. Add or restore RSVP for "גדליה ושירה"
            const coupleRsvp = await db.collection("rsvps").findOne({
                $or: [
                    { is_couple: true },
                    { names: "גדליה ושירה" }
                ]
            });

            const coupleData = {
                names: "גדליה ושירה",
                guest_count: 2,
                phone: "",
                attendance_type: "חופה + אוכל",
                side: "חתן וכלה",
                is_attending: 1,
                is_couple: true,
                admin_notes: "שולחן חתן וכלה (2 מקומות)",
                guests: [
                    { name: "גדליה", chuppah: true, eat: true, dance: true, tableNumber: 1000 },
                    { name: "שירה", chuppah: true, eat: true, dance: true, tableNumber: 1000 }
                ],
                updated_at: new Date()
            };

            if (coupleRsvp) {
                await db.collection("rsvps").updateOne(
                    { _id: coupleRsvp._id },
                    { $set: coupleData }
                );
            } else {
                await db.collection("rsvps").insertOne({
                    ...coupleData,
                    created_at: new Date()
                });
            }
        } else {
            // 3. Remove the couple's RSVP and unassign table 1000
            await db.collection("rsvps").deleteMany({
                $or: [
                    { is_couple: true },
                    { names: "גדליה ושירה" }
                ]
            });

            await db.collection("rsvps").updateMany(
                { "guests.tableNumber": 1000 },
                { $unset: { "guests.$.tableNumber": "" } }
            );
        }

        revalidatePath("/admin");
        revalidatePath("/seating");
        return { success: true, hasCoupleTable: isEnabled };
    } catch (error) {
        console.error("Failed to toggle couple table:", error);
        return { error: "שגיאה בעדכון הגדרת שולחן חתן וכלה" };
    }
}

