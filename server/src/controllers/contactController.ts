import { Request, Response } from 'express';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

function normalizePhone(number?: string) {
  if (!number) return null;
  // Remove non-digits, keep leading + if present
  const cleaned = number.replace(/[^+0-9]/g, '');
  // Normalize leading zeros and country codes could be added here as needed
  return cleaned;
}

// Expect body: { contacts: [{ id, name, numbers: ["+1234...","..."], note? }], consent: true }
export const syncContacts = async (req: Request, res: Response) => {
  const { contacts, consent } = req.body as { contacts?: any[]; consent?: boolean };

  if (!consent) {
    return sendError(res, 'User consent required to sync contacts', null, 400);
  }

  if (!Array.isArray(contacts)) {
    return sendError(res, 'Invalid contacts payload', null, 400);
  }

  try {
    // Build set of normalized phone numbers
    const numberMap = new Map<string, { contactIndex: number; original: any }>();
    contacts.forEach((c, idx) => {
      (c.numbers || []).forEach((n: string) => {
        const norm = normalizePhone(n);
        if (norm) numberMap.set(norm, { contactIndex: idx, original: c });
      });
    });

    const numbers = Array.from(numberMap.keys());
    if (numbers.length === 0) {
      return sendSuccess(res, 'No phone numbers to match', { existingUsers: [], unregisteredContacts: contacts });
    }

    // Find users with matching phoneNumber
    const matchedUsers = await User.find({ phoneNumber: { $in: numbers } }).select('username avatar _id phoneNumber');

    const existingMap = new Map<string, any>();
    matchedUsers.forEach((u) => {
      if (u.phoneNumber) existingMap.set(u.phoneNumber, u);
    });

    const existingUsers: any[] = [];
    const unregisteredContacts: any[] = [];

    // Mark contacts as registered/unregistered
    contacts.forEach((c) => {
      const foundNumbers = (c.numbers || []).map((n: string) => normalizePhone(n)).filter(Boolean as any);
      const foundUser = foundNumbers.map((fn: string) => existingMap.get(fn)).find(Boolean);
      if (foundUser) {
        existingUsers.push({ contact: c, user: foundUser });
      } else {
        unregisteredContacts.push(c);
      }
    });

    return sendSuccess(res, 'Contacts synced', { existingUsers, unregisteredContacts });
  } catch (error: any) {
    return sendError(res, 'Contact sync failed', error.message, 500);
  }
};
