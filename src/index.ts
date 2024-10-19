import express, { Request, Response } from "express";
import connectDB from "./database";
import User from "./models/User";

const app = express();
const port = 3000;

connectDB();

app.get("/", (req: Request, res: Response) => {
	res.send("Hello, TypeScript with Express!");
});

app.post("/users", async (req: Request, res: Response) => {
	const { name, email, password } = req.body;

	const carbonFootprint = Math.floor(Math.random() * 50) + 1;

	try {
		const user = new User({ name, email, password });
		await user.save();
		res.status(201).json(user);
	} catch (error) {
		res.status(500).json({ message: "Server Error" });
	}
});

app.post("/login", async (req: Request, res: Response) => {
	const { email, password } = req.body;

	try {
		// Find user by email
		const user = await User.findOne({ email });

		// Check if user exists and passwords match
		if (user && user.password === password) {
			res.status(200).json({ message: "Login successful", user });
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error" });
	}
});

app.post("/transaction", async (req: Request, res: Response) => {
	const { senderId, recipientId, amount } = req.body;

	if (!senderId || !recipientId || !amount) {
		res.status(400).json({ message: "Missing required fields" });
		return;
	}

	if (amount <= 0) {
		res.status(400).json({ message: "Amount must be positive" });
		return;
	}

	try {
		// Find the sender and recipient users
		const sender = await User.findById(senderId);
		const recipient = await User.findById(recipientId);

		if (!sender || !recipient) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		if (sender.balance < amount) {
			res.status(400).json({ message: "Insufficient balance" });
			return;
		}

		// Deduct amount from sender's balance (negative) and add to recipient's balance (positive)
		sender.balance -= amount;
		recipient.balance += amount;

		// Add transaction records to both users
		sender.transactions.push({ userId: senderId, amount: -amount }); // Negative for sender
		recipient.transactions.push({ userId: senderId, amount }); // Positive for recipient

		// Save both users' updated records
		await sender.save();
		await recipient.save();

		res.status(200).json({
			message: "Transaction successful",
			sender: {
				name: sender.name,
				email: sender.email,
				balance: sender.balance,
				transactions: sender.transactions,
			},
			recipient: {
				name: recipient.name,
				email: recipient.email,
				balance: recipient.balance,
				transactions: recipient.transactions,
			},
		});
	} catch (error) {
		res.status(500).json({ message: "Server Error" });
	}
});

app.post("/connect", async (req: Request, res: Response) => {
	const { userId, connectionId } = req.body;

	if (!userId || !connectionId) {
		res.status(400).json({ message: "Missing required fields" });
		return;
	}

	try {
		const user = await User.findById(userId);
		const connectionUser = await User.findById(connectionId);

		if (!user || !connectionUser) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		// Check if already connected
		if (user.connections.includes(connectionId)) {
			res.status(400).json({ message: "Already connected" });
			return;
		}

		// Add the connection
		user.connections.push(connectionId);
		await user.save();

		res.status(200).json({
			message: "Connection successful",
			connections: user.connections,
		});
	} catch (error) {
		res.status(500).json({ message: "Server Error" });
	}
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
