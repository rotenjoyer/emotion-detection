const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion');

// Start webcam
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadedmetadata = resolve));

        // Set canvas size dynamically
        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        });

        video.play();
    } catch (error) {
        console.error("Webcam Error:", error);
    }
}

// Load FaceMesh
async function loadFaceMesh() {
    const faceMesh = new FaceMesh.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    await faceMesh.initialize();
    return faceMesh;
}

// Process results and draw on canvas
function processResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            drawLandmarks(landmarks);
            detectEmotion(landmarks);
        }
    }
}

// Draw face landmarks
function drawLandmarks(landmarks) {
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.fillStyle = "red";

    landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    const connections = [
        [10, 151], [13, 14], [48, 54], [33, 133], [61, 291]
    ];

    connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
        ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
        ctx.stroke();
    });
}

// Detect emotion
function detectEmotion(landmarks) {
    let mouthOpen = landmarks[13].y - landmarks[14].y;
    let browRaise = landmarks[10].y - landmarks[151].y;
    let smile = landmarks[48].x - landmarks[54].x;
    let eyeOpenness = (landmarks[159].y - landmarks[145].y) + (landmarks[386].y - landmarks[374].y);
    let cheekRaise = landmarks[61].y - landmarks[291].y;
    let oneBrowHigher = landmarks[70].y - landmarks[300].y;
    let smirkAsymmetry = Math.abs(landmarks[48].y - landmarks[54].y);
    let browFurrow = landmarks[21].y - landmarks[22].y;
    let lipTightness = Math.abs(landmarks[0].x - landmarks[17].x);

    let emotion = "Neutral 😐";

    if (smile > 0.03 && mouthOpen > 0.02) {
        emotion = "Excited 🤩";
    } else if (smile > 0.02 && eyeOpenness < 0.02) {
        emotion = "Laughing 😆";
    } else if (smile > 0.01 && oneBrowHigher < -0.01) {
        emotion = "Smirking 😏";
    } else if (smile > 0.01 && browRaise < 0.02) {
        emotion = "Relieved 😌";
    } else if (browRaise > 0.05 && mouthOpen > 0.04) {
        emotion = "Amazed 🤯";
    } else if (browRaise > 0.03 && mouthOpen > 0.03) {
        emotion = "Shocked 😱";
    } else if (oneBrowHigher > 0.01) {
        emotion = "Confused 🤨";
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

// Face detection loop
async function detectFace(faceMesh) {
    const results = await faceMesh.send({ image: video });
    processResults(results);
    requestAnimationFrame(() => detectFace(faceMesh)); // Ensures smooth real-time tracking
}

// Initialize everything
async function init() {
    await startCamera();
    const faceMesh = await loadFaceMesh();
    detectFace(faceMesh);
}

init();
