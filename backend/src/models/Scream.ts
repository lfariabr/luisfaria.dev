import mongoose, { Schema, Document } from 'mongoose'

export interface IScream extends Document {
    userEmail: string;
    text: string;
    modelUsed: string;
    explicitMode: boolean;
    isSubscriber: boolean;
    subscriptionType: string;
    goalsArray: string[];
    createdAt: Date;    
}

const ScreamSchema = new Schema(
    {
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    text: { type: String, required: true },
    modelUsed: { type: String, required: true },
    explicitMode: { type: Boolean, default: true }, // ⚠️ change to FALSE

    isSubscriber: { type: Boolean, default: true },  // ⚠️ replace with checkStripeCustomer(email) or add a isActiveSubscription field if not comming straight from Stripe, but i doubt it will be needed
    subscriptionType: { type: String, default: 'free' }, // 🔜 future paid logic
    goalsArray: { type: [String], default: [] }, // 🔜 user-defined goals
    },
    { timestamps: true }
);

export default mongoose.model<IScream>('Scream', ScreamSchema);
