"use server";

import clientPromise from "../../lib/db";
import { getTableByNumber } from "../../lib/tables";

/**
 * Search guests by name for the public seating page.
 * Returns ONLY the minimum info needed: name + table assignment.
 * No phone, email, notes, or other private data is exposed.
 *
 * Table assignment is stored per-guest in guests[].tableNumber,
 * so different family members can sit at different tables
 * (e.g., father at men's table 2, mother at women's table 8).
 */
export async function searchGuestSeating(query) {
    if (!query || typeof query !== "string") {
        return { results: [] };
    }

    // Normalize: trim, collapse multiple spaces
    const cleaned = query.trim().replace(/\s+/g, " ");
    if (cleaned.length === 0 || cleaned.length > 100) {
        return { results: [] };
    }

    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        // Escape regex special chars from user input
        const escaped = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Search in the `names` field and in the `guests[].name` sub-documents
        // Only match RSVPs that are attending (is_attending === 1)
        const docs = await db
            .collection("rsvps")
            .find({
                is_attending: 1,
                $or: [
                    { names: { $regex: escaped, $options: "i" } },
                    { "guests.name": { $regex: escaped, $options: "i" } },
                ],
            })
            .limit(20)
            .toArray();

        // Build result set — one entry per individual guest name that matches
        const results = [];
        const seenKeys = new Set();

        for (const doc of docs) {
            // Check individual guests array first
            if (doc.guests && Array.isArray(doc.guests)) {
                for (const guest of doc.guests) {
                    const guestName = (guest.name || "").trim();
                    if (!guestName || guestName === "אורח") continue;

                    // Check if this individual name matches the search
                    const nameMatch = guestName.match(
                        new RegExp(escaped, "i")
                    );
                    if (nameMatch) {
                        const key = `${doc._id.toString()}_${guestName}`;
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);

                            // Per-guest tableNumber
                            const tableNumber = guest.tableNumber || null;
                            const tableInfo = tableNumber ? getTableByNumber(tableNumber) : null;

                            results.push({
                                id: doc._id.toString(),
                                name: guestName,
                                tableNumber: tableNumber,
                                category: tableInfo?.category || null,
                                section: tableInfo?.section || null,
                            });
                        }
                    }
                }
            }

            // Also check the top-level `names` field for cases where
            // guests array might not have individual names
            const topName = (doc.names || "").trim();
            if (topName && topName !== "לא צוין") {
                const topMatch = topName.match(new RegExp(escaped, "i"));
                if (topMatch) {
                    const key = `${doc._id.toString()}_top`;
                    if (!seenKeys.has(key)) {
                        // Don't add if we already have individual guest matches from this doc
                        const hasIndividualMatches = [...seenKeys].some(
                            (k) => k.startsWith(doc._id.toString()) && !k.endsWith("_top")
                        );
                        if (!hasIndividualMatches) {
                            seenKeys.add(key);
                            results.push({
                                id: doc._id.toString(),
                                name: topName,
                                tableNumber: null,
                                category: null,
                                section: null,
                            });
                        }
                    }
                }
            }
        }

        return { results };
    } catch (error) {
        console.error("Seating search failed:", error);
        return { error: "שגיאה בחיפוש. אנא נסו שוב." };
    }
}

/**
 * Fetch all guests grouped by table number for the visual table map.
 * Returns { [tableNumber]: ["Name1", "Name2", ...] }
 * Only includes attending guests with a table assignment.
 */
export async function getTableGuests() {
    try {
        const client = await clientPromise;
        const db = client.db("wedding");

        const docs = await db
            .collection("rsvps")
            .find({ is_attending: 1 })
            .toArray();

        const tableGuests = {};

        for (const doc of docs) {
            if (doc.guests && Array.isArray(doc.guests)) {
                for (const guest of doc.guests) {
                    const guestName = (guest.name || "").trim();
                    if (!guestName || guestName === "אורח") continue;

                    const tableNumber = guest.tableNumber;
                    if (!tableNumber) continue;

                    if (!tableGuests[tableNumber]) {
                        tableGuests[tableNumber] = [];
                    }
                    tableGuests[tableNumber].push(guestName);
                }
            }
        }

        return { tableGuests };
    } catch (error) {
        console.error("Failed to fetch table guests:", error);
        return { tableGuests: {} };
    }
}
