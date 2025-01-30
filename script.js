const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion');

// Load the webcam feed
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Adjust canvas size
    video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    });
}

// Load MediaPipe Face Landmarker
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

// Draw face landmarks & detect emotions
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

// Draw facial landmarks
function drawLandmarks(landmarks) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.fillStyle = "red";

    // Draw circles on key landmarks
    landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Connect key facial points (eyebrows, mouth, etc.)
    const connections = [
        [10, 151], // Brows
        [13, 14],  // Mouth open
        [48, 54],  // Smile width
    ];

    connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
        ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
        ctx.stroke();
    });
}

// Emotion detection logic
function detectEmotion(landmarks) {
    let mouthOpen = landmarks[13].y - landmarks[14].y;
    let browRaise = landmarks[10].y - landmarks[151].y;
    let smile = landmarks[48].x - landmarks[54].x;

    let emotion = "Neutral 😐";
    if (smile > 0.02) emotion = "Happy 😊";
    else if (browRaise > 0.03) emotion = "Surprised 😲";
    else if (mouthOpen > 0.05) emotion = "Shocked 😱";
    else if (browRaise < -0.02) emotion = "Angry 😡";

    emotionText.innerText = emotion;
}

// Initialize everything
async function init() {
    await startCamera();
    const faceMesh = await loadFaceMesh();
    setInterval(() => faceMesh.send({ image: video }), 100);
}

init();
