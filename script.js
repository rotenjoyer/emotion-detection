const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion');

// Start webcam
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadedmetadata = resolve)); // Ensure it's loaded
        video.play();
    } catch (error) {
        console.error("Webcam Error:", error);
    }
}

// Load FaceMesh
async function loadFaceMesh() {
    const faceMesh = new FaceMesh.FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    await faceMesh.initialize();
    faceMesh.onResults(processResults);
    return faceMesh;
}

// Process results
function processResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
        results.multiFaceLandmarks.forEach((landmarks) => {
            drawLandmarks(landmarks);
            detectEmotion(landmarks);
        });
    }
}

// Draw landmarks
function drawLandmarks(landmarks) {
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.fillStyle = "red";

    landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Detect emotion
function detectEmotion(landmarks) {
    let mouthOpen = landmarks[13].y - landmarks[14].y;
    let smile = landmarks[48].x - landmarks[54].x;
    let browRaise = landmarks[10].y - landmarks[151].y;

    let emotion = "Neutral 😐";
    if (smile > 0.02) emotion = "Happy 😊";
    if (browRaise > 0.03) emotion = "Surprised 😲";
    if (mouthOpen > 0.05) emotion = "Shocked 😱";

    emotionText.innerText = emotion;
}

// Initialize
async function init() {
    await startCamera();
    const faceMesh = await loadFaceMesh();

    async function detectFace() {
        await faceMesh.send({ image: video });
        requestAnimationFrame(detectFace);
    }
    detectFace();
}

init();
