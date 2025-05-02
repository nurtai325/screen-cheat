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

let prompt = `I will send you an image of a multiple-choice math question.
Your task is to:

    Carefully analyze the question and solve it step by step.

    Determine which option (1–4) is the correct answer.

    Return your full response strictly as a JSON object, like in an HTTP response body.

The JSON object must include:

    A top-level field "answer" (number from 1 to 4), indicating the correct option.

    Optionally, include a "reasoning" field explaining how you arrived at the answer.

Do not return anything outside the JSON object. The entire response must be valid JSON without your enclosing '''json '''. The entire response must be parsable by JSON.parse function in javascript
Example:

{
  "answer": 2,
  "reasoning": "I factored the quadratic in the numerator and canceled out the common term in the denominator."
}`
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
		res.send(JSON.parse(promptResp.output_text).answer);
	}).catch((err) => {
		console.log(err);
		res.send("error");
	})
});

app.listen(port, () => {
	console.log(`Chatgpt cheat app listening on port ${port}`)
});
