import { z } from "zod";

// --- AUTH SCHEMAS ---

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const signupSchema = z.object({
  name: z.string().min(2, { message: "Company Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  // Zod can still use regex internally, but it's much cleaner to implement
  phone: z.string().regex(/^[0-9]{10,11}$/, { message: "Phone number must be 10 or 11 digits" }),
  address: z.string().min(5, { message: "Address is too short" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// --- WALLET SCHEMAS ---

// We create a function to pass dynamic values like 'availableBalance'
export const createWithdrawalSchema = (availableBalance: number) => 
  z.object({
    amount: z.coerce.number() // Automatically converts string "1000" to number 1000
      .min(1000, { message: "Minimum withdrawal is ₦1,000" })
      .max(availableBalance, { message: "Insufficient funds" }),
    
    bankName: z.string().min(3, { message: "Please enter a valid bank name" }),
    
    accountNumber: z.string()
      .regex(/^[0-9]{10}$/, { message: "Account number must be exactly 10 digits" }),
      
    accountName: z.string().min(3, { message: "Please enter the account holder's name" }),
  });

// Export TypeScript types automatically inferred from the schemas
export type SignupFormData = z.infer<typeof signupSchema>;