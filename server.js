const express = require("express")
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const openai = require("openai");

try {
	process.loadEnvFile();
} catch (e) {
	console.log("put OPENAI_API_KEY env to .env file");
	process.exit(1);
}

let prompt = "i sent you a photo of a screen where in the browser i am passing a test with multiple choices. i want you to send me the answer number counting the choice from top to bottom. if there are multiple answers send them all with commas. send answer only."
const gptClient = new openai();

async function getAnswer(file) {
	const base64Image = fs.readFileSync(file, "base64");
	return gptClient.responses.create({
		model: "gpt-4.1",
		input: [
			{
				role: "user",
				content: [
					{ type: "input_text", text: prompt },
					{
						type: "input_image",
						image_url: `data:image/jpeg;base64,${base64Image}`,
					},
				],
			},
		],
	});
}

const storage = multer.diskStorage({
	destination: "/tmp",
	filename: function(req, file, cb) {
		const randomName = crypto.randomBytes(16).toString("hex");
		cb(null, randomName + ".png");
	}
});
const upload = multer({
	storage,
});

const app = express();
app.use(cors());
const port = 3000;

app.post('/chatgpt/check', upload.single("image"), (req, res) => {
	getAnswer(req.file.path).then((promptResp) => {
		res.send(promptResp.output_text);
	}).catch((err) => {
		console.log(err);
		res.send("error");
	})
});

app.listen(port, () => {
	console.log(`Chatgpt cheat app listening on port ${port}`)
});
