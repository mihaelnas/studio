
'use server';

import { NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server-init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';

// IMPORTANT: This is a simple secret key for demonstration.
// In a production environment, use a more secure method like environment variables.
const API_SECRET_KEY = process.env.ZKTEDO_API_SECRET || 'your-super-secret-key';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (authorization !== `Bearer ${API_SECRET_KEY}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const logData: Partial<AttendanceLog> = await request.json();

    if (!logData.personnelId || !logData.dateTime || !logData.inOutStatus) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const { firestore } = initializeFirebaseServer();
    const attendanceLogsCollection = collection(firestore, 'attendanceLogs');

    await addDoc(attendanceLogsCollection, {
      ...logData,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Log received successfully' }, { status: 201 });
  } catch (error) {
    console.error('API Error: Failed to receive log', error);
    let message = 'An unknown error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
