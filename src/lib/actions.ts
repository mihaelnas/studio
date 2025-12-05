

'use server';

import { explainLatenessRisk } from '@/ai/flows/explain-lateness-risk';
import { predictLatenessRisk } from '@/ai/flows/predict-lateness-risk';
import type { PredictLatenessRiskOutput } from '@/ai/flows/predict-lateness-risk';
import { generatePayslipEmail } from '@/ai/flows/send-payslip-flow';
import { getFirestore, collection, getDocs, writeBatch, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseServer } from '@/firebase/server-init';
import type { Employee, ProcessedAttendance } from './types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PayrollEntry {
  employeeId: string;
  name: string;
  email: string;
  grossSalary: number;
}

const calculatePayroll = (employees: Employee[], attendance: ProcessedAttendance[]): PayrollEntry[] => {
  const payrollMap = new Map<string, { totalHours: number; overtimeHours: number }>();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  attendance.forEach(record => {
    const recordDate = new Date(record.date);
    if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
      const current = payrollMap.get(record.employee_id) || { totalHours: 0, overtimeHours: 0 };
      current.totalHours += record.total_worked_hours;
      current.overtimeHours += record.total_overtime_minutes > 0 ? record.total_overtime_minutes / 60 : 0;
      payrollMap.set(record.employee_id, current);
    }
  });

  return employees.map(employee => {
    const hourlyRate = employee.hourlyRate || 25000; // Default rate if not set
    const data = payrollMap.get(employee.id) || { totalHours: 0, overtimeHours: 0 };
    
    const basePay = (data.totalHours - data.overtimeHours) * hourlyRate;
    const overtimePay = data.overtimeHours * hourlyRate * 1.5; // Overtime at 150%
    const grossSalary = basePay + overtimePay;

    return {
      employeeId: employee.id,
      name: employee.name,
      email: employee.email,
      grossSalary,
    };
  });
};


export async function getLatenessExplanation(employeeId: string): Promise<string> {
  try {
    const result = await explainLatenessRisk({ employeeId });
    return result.explanation;
  } catch (error) {
    console.error('Error fetching lateness explanation:', error);
    return "Une erreur est survenue lors de la génération de l'explication.";
  }
}

export async function getLatenessPrediction(
  historicalData: string
): Promise<PredictLatenessRiskOutput | null> {
  try {
    const result = await predictLatenessRisk({
      historicalAttendanceData: historicalData,
    });
    return result;
  } catch (error) {
    console.error('Error fetching lateness prediction:', error);
    return null;
  }
}

export async function sendPayslipsByEmail(): Promise<{
  success: boolean;
  message: string;
}> {
  console.log('Starting payslip generation and sending process...');
  
  try {
    // Initialize Firestore Admin
    const { firestore } = initializeFirebaseServer();

    // 1. Fetch all employees and attendance data
    const employeesSnapshot = await getDocs(collection(firestore, 'employees'));
    const attendanceSnapshot = await getDocs(collection(firestore, 'processedAttendance'));
    
    const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    const attendance = attendanceSnapshot.docs.map(doc => doc.data() as ProcessedAttendance);

    // 2. Calculate payroll for the current month
    const payrollData = calculatePayroll(employees, attendance);

    if (payrollData.length === 0) {
      return { success: false, message: "Aucune donnée de paie à traiter pour le mois en cours." };
    }

    const payPeriod = format(new Date(), 'MMMM yyyy', { locale: fr });
    const batch = writeBatch(firestore);
    let successfulSends = 0;

    // 3. Iterate through each employee with payroll data
    for (const employeePayroll of payrollData) {
      if (employeePayroll.grossSalary <= 0) continue;

      const deductions = employeePayroll.grossSalary * 0.2; // 20% flat rate for taxes/etc.
      const netSalary = employeePayroll.grossSalary - deductions;

      // 4. Call Genkit to generate the payslip email content
      const emailContent = await generatePayslipEmail({
        employeeName: employeePayroll.name,
        grossSalary: Number(employeePayroll.grossSalary.toFixed(2)),
        deductions: Number(deductions.toFixed(2)),
        netSalary: Number(netSalary.toFixed(2)),
        payPeriod: payPeriod,
      });

      // 5. Store the sent payslip in Firestore for auditing
      const payslipDocRef = doc(collection(firestore, 'payslips'));
      batch.set(payslipDocRef, {
        employeeId: employeePayroll.employeeId,
        payPeriodStart: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        payPeriodEnd: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
        grossSalary: employeePayroll.grossSalary,
        deductions,
        netSalary,
        sentDate: serverTimestamp(),
        status: 'sent',
        // Storing email content for review, in a real app might store a PDF link
        emailSubject: emailContent.subject,
        emailBody: emailContent.body,
      });

      // 6. **SIMULATE** sending the email
      console.log(`--- SIMULATING EMAIL TO: ${employeePayroll.email} ---`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Body:\n${emailContent.body}`);
      console.log(`--- END SIMULATION ---`);
      
      successfulSends++;
    }

    // Commit all the new payslip documents to Firestore
    await batch.commit();

    const message = `${successfulSends} fiches de paie ont été générées et stockées. L'envoi réel est simulé dans la console du serveur.`;
    console.log(message);
    return { success: true, message };

  } catch (error) {
    console.error('Failed to send payslips:', error);
    return { success: false, message: 'Une erreur est survenue lors de la génération ou de l\'envoi des fiches de paie.' };
  }
}

interface ActivateEmployeeAccountProps {
    employeeId: string;
    email: string;
    password?: string;
    department: string;
    hourlyRate: number;
    isAdmin?: boolean;
}

export async function activateEmployeeAccount(props: ActivateEmployeeAccountProps): Promise<{ success: boolean; message: string }> {
    const { employeeId, email, password, department, hourlyRate, isAdmin } = props;

    if (!password) {
        return { success: false, message: "Le mot de passe est requis." };
    }

    const { auth, firestore } = initializeFirebaseServer();

    try {
        // 1. Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Update the employee document in Firestore
        // The employeeId passed in is the Firestore document ID.
        const employeeDocRef = doc(firestore, 'employees', employeeId);
        await updateDoc(employeeDocRef, {
            authUid: user.uid,
            email: email,
            department: department,
            hourlyRate: hourlyRate,
            role: isAdmin ? 'admin' : 'employee',
        });

        return { success: true, message: "Compte employé activé avec succès." };

    } catch (error: any) {
        console.error("Erreur lors de l'activation du compte employé:", error);
        let message = "Une erreur inconnue est survenue.";
        if (error.code === 'auth/email-already-in-use') {
            message = "Cette adresse e-mail est déjà utilisée par un autre compte.";
        } else if (error.code === 'auth/weak-password') {
            message = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
        }
        return { success: false, message: message };
    }
}


interface SignupUserProps {
    name: string;
    email: string;
    password?: string;
}

export async function signupUser(props: SignupUserProps): Promise<{ success: boolean; message: string }> {
    const { name, email, password } = props;

    if (!password) {
        return { success: false, message: "Le mot de passe est requis." };
    }

    const { auth, firestore } = initializeFirebaseServer();

    try {
        // Check if any employee exists to determine if this is the first user
        const employeesCollection = collection(firestore, 'employees');
        const existingEmployeesSnapshot = await getDocs(employeesCollection);
        const isFirstUser = existingEmployeesSnapshot.empty;

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create employee document in Firestore, using the auth UID as the document ID
        const employeeDocRef = doc(firestore, 'employees', user.uid);
        await setDoc(employeeDocRef, {
            id: user.uid,
            authUid: user.uid,
            employeeId: `EMP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`, // Placeholder biometric ID
            name: name,
            email: email,
            role: isFirstUser ? 'admin' : 'employee', // Assign 'admin' role if it's the first user
            department: "Non assigné",
            hourlyRate: 25000,
        });

        const message = isFirstUser 
            ? "Compte administrateur créé avec succès. Vous pouvez maintenant vous connecter."
            : "Compte créé avec succès. Vous pouvez maintenant vous connecter.";
        
        return { success: true, message };

    } catch (error: any)
{
        console.error("Erreur lors de la création du compte:", error);
        let message = "Une erreur inconnue est survenue.";
        if (error.code === 'auth/email-already-in-use') {
            message = "Cette adresse e-mail est déjà utilisée par un autre compte.";
        } else if (error.code === 'auth/weak-password') {
            message = "Le mot de passe doit contenir au moins 6 caractères.";
        }
        return { success: false, message: message };
    }
}
    