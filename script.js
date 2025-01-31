const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion');

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    };
}

async function loadFaceMesh() {
    const faceMesh = new FaceMesh.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
        maxNumFaces: 1, 
        minDetectionConfidence: 0.5, 
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(processResults);
    return faceMesh;
}

function processResults(results) {
    console.log(results);  // Log the results to check FaceMesh output
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            drawLandmarks(landmarks);
            detectEmotion(landmarks);
        }
    }
}

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

function detectEmotion(landmarks) {
    // Emotion detection logic...
}

async function init() {
    await startCamera();
    const faceMesh = await loadFaceMesh();
    setInterval(() => faceMesh.send({ image: video }), 100);
}

init();
