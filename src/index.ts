import express, { Request, Response } from "express";
import connectDB from "./database";
import User from "./models/User";
import { log } from "console";

const app = express();
const port = 3000;

connectDB();

// Middleware to automatically parse incoming JSON requests
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
	res.send("Hello, TypeScript with Express!");
});

app.post("/users", async (req: Request, res: Response) => {
	log({ body: req.body });
	const { firstName, lastName, email, password } = req.body;

	const carbonFootprint = Math.floor(Math.random() * 50) + 1;

	let user = User.findOne({ email });

	if (!user) {
		res.status(400).json({ userexist: true });
		return;
	}

	try {
		const user = new User({ firstName, lastName, email, password });

		await user.save();
		res.status(201).json(user);
	} catch (error) {
		log(error);
		res.status(500).json({ message: "Server Error" });
	}
});

app.post("/login", async (req: Request, res: Response) => {
	const { email, password } = req.body;

	try {
		// Find user by email
		const user = await User.findOne({ email });
		log({ user });

		// Check if user exists and passwords match
		if (user && user.password === password) {
			res.status(200).json(user);
			return;
		} else {
			res.status(400).json({ message: "Invalid email or password" });
			return;
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error" });
		return;
	}
});

app.post("/transaction", async (req: Request, res: Response) => {
	const { senderId, recipientId, amount } = req.body;
	log({ body: req.body });

	if (!senderId || !recipientId || !amount) {
		res.status(400).json({ message: "Missing required fields" });
		return;
	}

	if (amount <= 0) {
		res.status(400).json({ message: "Amount must be positive" });
		return;
	}

	console.log("hello");

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
		sender.transactions.push({
			userId: recipientId,
			amount: -amount,
		}); // Negative for sender
		recipient.transactions.push({
			userId: senderId,
			amount,
		}); // Positive for recipient

		// Save both users' updated records
		await sender.save();
		await recipient.save();

		res.status(200).json({
			message: "Transaction successful",
			sender: {
				firstName: sender.firstName,
				lastName: sender.lastName,
				email: sender.email,
				balance: sender.balance,
				transactions: sender.transactions,
			},
			recipient: {
				firstName: recipient.firstName,
				lastName: recipient.lastName,
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

app.get("/users", async (req: Request, res: Response) => {
	try {
		// Fetch all users from the database
		const users = await User.find();

		// Return the list of users
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ message: "Server Error" });
	}
});
app.get("/users/:id", async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		// Find the user by ID
		const user = await User.findById(id);

		// If no user is found, return a 404 Not Found response
		if (!user) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		// Return the user data
		res.status(200).json(user);
	} catch (error) {
		// Handle any errors, such as invalid ObjectId or database errors
		res.status(500).json({ message: "Server Error" });
	}
});
app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
