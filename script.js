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
            detectEmotion(landmarks);
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
