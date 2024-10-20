import mongoose, { Document, Schema } from "mongoose";

interface ITransaction {
	userId: mongoose.Schema.Types.ObjectId;
	amount: number; // Positive for received, negative for sent
	date?: Date;
}

interface IUser extends Document {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	balance: number;
	carbonFootprint: number; // New field for carbon footprint
	transactions: ITransaction[];
	connections: mongoose.Schema.Types.ObjectId[]; // List of connected user IDs
}

const UserSchema: Schema = new Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	balance: { type: Number, default: 10000 },
	carbonFootprint: { type: Number, default: 0 }, // Default value for carbon footprint
	transactions: [
		{
			userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			amount: { type: Number, required: true }, // Positive or negative
			date: { type: Date, default: Date.now },
		},
	],
	connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of connected user IDs
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
