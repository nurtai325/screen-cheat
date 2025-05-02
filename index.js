let displayMediaOptions = {
	video: {
		displaySurface: "browser",
	},
	audio: {
		suppressLocalAudioPlayback: false,
	},
	preferCurrentTab: false,
	selfBrowserSurface: "exclude",
	systemAudio: "include",
	surfaceSwitching: "include",
	monitorTypeSurfaces: "include",
};

let screenCaptureStarted = false;
let notificationPermissionGranted = false;
let video = document.createElement("video");
video.autoplay = true;
let canvas = document.createElement("canvas");

async function startCapture(displayMediaOptions) {
	return navigator.mediaDevices
		.getDisplayMedia(displayMediaOptions)
		.then((stream) => {
			video.srcObject = stream;
		})
		.catch((err) => {
			console.error(err);
			return null;
		});
}

document.addEventListener("click", (event) => {
	event.preventDefault();
	if (!screenCaptureStarted) {
		startCapture();
		screenCaptureStarted = true;
	}
	if (!notificationPermissionGranted) {
		Notification.requestPermission();
		notificationPermissionGranted = true;
	}
});

document.addEventListener('keydown', function(event) {
	if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'j') {
		event.preventDefault();
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext('2d');
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		canvas.toBlob((blob) => {
			const title = `captured_image_${Date.now()}.png`
			const file = new File([blob], title, { type: 'image/png' });
			sendToChatGpt(file, (answer) => {
				sendNotification(answer);
			});
		});
	}
});

function sendToChatGpt(file, handle) {
	const formData = new FormData();
	formData.append("image", file);
	fetch("http://localhost:3000/chatgpt/check", {
		method: "POST",
		body: formData
	}).then(response => {
		if (!response.ok) {
			handle("error");
			return
		}
		return response.text();
	}).then(answer => {
		handle(answer);
	}).catch(error => {
		console.log(error);
		handle("error");
	});
}

function sendNotification(text) {
	const notification = new Notification("Microsoft Teams", { body: text });
	setTimeout(() => {
		notification.close();
	}, 3000);
}
