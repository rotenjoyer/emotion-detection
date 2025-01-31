const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion');

// Load the webcam feed
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Adjust canvas size dynamically
    video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    });
}

// Load MediaPipe FaceMesh
async function loadFaceMesh() {
    const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results) => processResults(results));
    return faceMesh;
}

// Process FaceMesh results
function processResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            drawLandmarks(landmarks);
            detectEmotion(landmarks);  // Detect emotion
        }
    }
}

// Draw face landmarks & connect key points
function drawLandmarks(landmarks) {
    ctx.strokeStyle = "lime"; // Make the lines visible (neon green)
    ctx.lineWidth = 3; // Increase thickness for visibility
    ctx.fillStyle = "red"; // Color for landmark points

    // Convert normalized values to actual pixel positions
    const getX = (index) => landmarks[index].x * canvas.width;
    const getY = (index) => landmarks[index].y * canvas.height;

    // Draw dots on landmarks
    landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Define connections for eyebrows, mouth, and key features
    const connections = [
        [10, 151], // Eyebrows (top of forehead to brow)
        [13, 14],  // Mouth (top lip to bottom lip)
        [48, 54],  // Smile width
        [33, 133], // Eye width
        [61, 291]  // Cheek-to-cheek
    ];

    // Draw lines between connected points
    connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(getX(start), getY(start));
        ctx.lineTo(getX(end), getY(end));
        ctx.stroke();
    });
}

// Emotion detection logic (based on facial features)
function detectEmotion(landmarks) {
    let smile = landmarks[48].x - landmarks[54].x;
    let browRaise = landmarks[10].y - landmarks[151].y;
    let mouthOpen = landmarks[13].y - landmarks[14].y;
    let eyeOpenness = (landmarks[159].y - landmarks[145].y) + (landmarks[386].y - landmarks[374].y);
    let cheekRaise = landmarks[61].y - landmarks[291].y;
    let oneBrowHigher = landmarks[70].y - landmarks[300].y;
    let smirkAsymmetry = Math.abs(landmarks[48].y - landmarks[54].y);
    let browFurrow = landmarks[21].y - landmarks[22].y;
    let lipTightness = Math.abs(landmarks[0].x - landmarks[17].x);

    let emotion = "Neutral 😐";

    if (smile > 0.02) {
        emotion = "Happy 😊";
    } else if (browRaise > 0.03) {
        emotion = "Surprised 😲";
    } else if (mouthOpen > 0.05) {
        emotion = "Shocked 😱";
    } else if (browRaise < -0.02) {
        emotion = "Angry 😡";
    } else if (smile > 0.03 && mouthOpen > 0.04) {
        emotion = "Excited 🤩";
    } else if (smile > 0.01 && mouthOpen < 0.02) {
        emotion = "Content 😌";
    } else if (browRaise > 0.04 && mouthOpen < 0.03) {
        emotion = "Surprised 😲";
    } else if (smile < -0.02 && browRaise < -0.03) {
        emotion = "Sad 😢";
    } else if (smile < -0.03 && mouthOpen < 0.02) {
        emotion = "Disappointed 😞";
    } else if (eyeOpenness > 0.03 && smile < 0.01) {
        emotion = "Confused 🤨";
    } else if (eyeOpenness < 0.02 && mouthOpen < 0.03) {
        emotion = "Sleepy 💤";
    } else if (browRaise > 0.05 && mouthOpen < 0.05) {
        emotion = "Amazed 🤯";
    } else if (smile > 0.02 && mouthOpen > 0.02) {
        emotion = "Excited 🤩";
    } else if (smile > 0.01 && oneBrowHigher < -0.01) {
        emotion = "Smirking 😏";
    } else if (smile < -0.02 && browRaise < -0.01) {
        emotion = "Crying 😢";
    } else if (smile < -0.02 && browRaise > -0.02) {
        emotion = "Disappointed 😞";
    } else if (browRaise < -0.02 && eyeOpenness > 0.01) {
        emotion = "Embarrassed 😳";
    } else if (eyeOpenness > 0.02 && browRaise < 0.01) {
        emotion = "Lonely 🥺";
    } else if (browFurrow > 0.02 && lipTightness > 0.01) {
        emotion = "Furious 🤬";
    } else if (browRaise < -0.02 && smirkAsymmetry > 0.005) {
        emotion = "Annoyed 😤";
    } else if (eyeOpenness > 0.03 && browRaise > 0.02) {
        emotion = "Terrified 😨";
    } else if (smile < 0.01 && browRaise > 0.01 && eyeOpenness < 0.02) {
        emotion = "Nervous 😬";
    } else if (cheekRaise > 0.01 && mouthOpen < 0.02) {
        emotion = "Disgusted 🤢";
    } else if (oneBrowHigher > 0.005 && smile < 0.01) {
        emotion = "Displeased 🤨";
    } else if (eyeOpenness < 0.004 && mouthOpen > 0.02) {
        emotion = "Sleepy 🥱";
    } else if (eyeOpenness < 0.002 && browRaise < -0.02) {
        emotion = "Exhausted 😩";
    }

    emotionText.innerText = emotion;
}

// Initialize everything
async function init() {
    await startCamera();
    const faceMesh = await loadFaceMesh();
    setInterval(() => faceMesh.send({ image: video }), 100);
}

init();
