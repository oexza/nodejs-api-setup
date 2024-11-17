import { eventStore, TagGroup } from '../lib/events/eventStore.js';
import nodemailer from 'nodemailer';
import { v7 as uuidv7 } from 'uuid';

//note that this is for demo purposes, and may not send an actual email.

// For development, use ethereal.email
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'your-ethereal-email',
        pass: 'your-ethereal-password'
    }
});

interface UserRegistered {
    id: string;
    username: string;
    email: string;
}

async function sendVerificationEmail(user: UserRegistered, verificationToken: string) {
    const verificationUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
    
    await transporter.sendMail({
        from: '"User Service" <noreply@userservice.com>',
        to: user.email,
        subject: 'Verify your email',
        html: `
            <h1>Welcome ${user.username}!</h1>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
        `
    });
}

// Event handler
async function handleUserRegistered() {
    const registrationEvents = await eventStore.getEventsByTagGroups([
        TagGroup.create([
            { key: 'domain', value: 'registration' },
            { key: 'eventType', value: 'UserRegistered'}
        ])
    ]);

    for (const event of registrationEvents) {
        try {
            const verificationToken = uuidv7();
            await sendVerificationEmail(event.payload as UserRegistered, verificationToken);

            // Store verification event
            await eventStore.append({
                type: 'VerificationEmailSent',
                payload: {
                    userId: event.payload.id,
                    email: event.payload.email,
                    verificationToken
                },
                tags: [
                    { key: 'userId', value: event.payload.id },
                    { key: 'email', value: event.payload.email },
                    { key: 'domain', value: 'verification' },
                    { key: 'verificationToken', value: verificationToken }
                ]
            });
        } catch (error: any) {
            console.error('Failed to send verification email:', error);
            
            // Store failure event
            await eventStore.append({
                type: 'VerificationEmailFailed',
                payload: {
                    userId: event.payload.id,
                    email: event.payload.email,
                    error: error.message
                },
                tags: [
                    { key: 'userId', value: event.payload.id },
                    { key: 'email', value: event.payload.email },
                    { key: 'domain', value: 'verification' },
                    { key: 'status', value: 'failed' }
                ]
            });
        }
    }
}

// Start the handler
export function startVerificationEmailHandler() {
    setInterval(handleUserRegistered, 5000); // Check every 5 seconds
} 