"use server";

import clientPromise from "../lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ObjectId } from "mongodb";

export async function submitRSVP(data) {
    if (!data) return { error: "No data provided" };

    const is_attending = data.isAttending === "yes" ? 1 : 0;
    const guest_count = parseInt(data.guestCount, 10);
    const phone = data.phone || "";

    let dbNames = "";
    let attendance_type = "";
    let guests = [];
    let reason = "";
    let side = data.side || "";

    let searchNames = [];

    if (is_attending === 1) {
        if (!data.guests || data.guests.length === 0) {
            return { error: "אנא בררו את פרטי המגיעים" };
        }
        guests = data.guests;
        dbNames = guests.map(g => g.name || "אורח").join(", ");
        if (!dbNames.trim()) {
            dbNames = "אורחים (" + guest_count + ")";
        }
        searchNames = guests.map(g => g.name?.trim()).filter(n => n && n !== "אורח");
    } else {
        guests = data.guests || [];
        dbNames = data.names || "לא צוין";
        reason = data.reason || "";
        searchNames = dbNames.split(/[, ו]+/).map(n => n.trim()).filter(n => n && n !== "לא צוין");
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        // If not forcing an update, check for existing
        if (!data.forceUpdateId && searchNames.length > 0) {
            // Build regex for each search name
            const orConditions = searchNames.map(name => ({
                names: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
            }));

            const existingRsvp = await db.collection("rsvps").findOne({ $or: orConditions });

            if (existingRsvp) {
                // Check if identical
                let isIdentical = false;
                if (existingRsvp.is_attending === is_attending && existingRsvp.guest_count === guest_count && (existingRsvp.side || "") === side) {
                    if (is_attending === 1) {
                        if (existingRsvp.guests && existingRsvp.guests.length === guests.length) {
                            isIdentical = existingRsvp.guests.every((eg, i) => {
                                const ng = guests[i];
                                return eg.name === ng.name && eg.chuppah === ng.chuppah && eg.meal === ng.meal && eg.dance === ng.dance;
                            });
                        }
                    } else {
                        if (existingRsvp.guests && existingRsvp.guests.length === guests.length && guests.length > 0) {
                            isIdentical = existingRsvp.guests.every((eg, i) => eg.name === guests[i]?.name) && existingRsvp.reason === reason;
                        } else {
                            isIdentical = existingRsvp.names === dbNames && existingRsvp.reason === reason;
                        }
                    }
                }

                if (isIdentical) {
                    return { success: true, message: "ראינו שכבר אישרתם בעבר עם אותם פרטים בדיוק! ההזמנה שלכם שמורה במערכת. תודה רבה." };
                } else {
                    // Send it back to the client for confirmation
                    return {
                        requiresConfirmation: true,
                        existingRsvp: {
                            _id: existingRsvp._id.toString(),
                            is_attending: existingRsvp.is_attending,
                            guest_count: existingRsvp.guest_count,
                            names: existingRsvp.names,
                            guests: existingRsvp.guests || [],
                            phone: existingRsvp.phone || "",
                            reason: existingRsvp.reason || "",
                            side: existingRsvp.side || ""
                        }
                    };
                }
            }
        }

        if (data.forceUpdateId) {
            await db.collection("rsvps").updateOne(
                { _id: new ObjectId(data.forceUpdateId) },
                {
                    $set: {
                        names: dbNames,
                        guest_count,
                        phone,
                        attendance_type,
                        guests,
                        reason,
                        side,
                        is_attending,
                        updated_at: new Date()
                    }
                }
            );
        } else {
            await db.collection("rsvps").insertOne({
                names: dbNames,
                guest_count,
                phone,
                attendance_type,
                guests,
                reason,
                side,
                is_attending,
                created_at: new Date()
            });
        }

        revalidatePath("/admin");
        return { success: true, message: "תודה רבה! עכשיו זה מעודכן בהצלחה." };
    } catch (error) {
        console.error("Failed to save RSVP", error);
        return { error: "שגיאה בשמירת הנתונים. אנא נסו שוב." };
    }
}
