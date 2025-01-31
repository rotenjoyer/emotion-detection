const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion');

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadedmetadata = resolve));
        video.play();
    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
}

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

function processResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        for (const landmarks of results.multiFaceLandmarks) {
            drawLandmarks(landmarks);
            detectEmotion(landmarks);
        }
    } else {
        emotionText.innerText = "No Face Detected ❌";
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
}

function detectEmotion(landmarks) {
    let mouthOpen = landmarks[13].y - landmarks[14].y;
    let browRaise = landmarks[10].y - landmarks[151].y;
    let smile = landmarks[48].x - landmarks[54].x;
    let eyeOpenness = (landmarks[159].y - landmarks[145].y) + (landmarks[386].y - landmarks[374].y);

    let emotion = "Neutral 😐";
    if (smile > 0.03 && mouthOpen > 0.02) emotion = "Excited 🤩";
    else if (smile > 0.02 && eyeOpenness < 0.02) emotion = "Laughing 😆";
    else if (smile > 0.01 && browRaise < 0.02) emotion = "Relieved 😌";
    else if (browRaise > 0.03 && mouthOpen > 0.03) emotion = "Shocked 😱";
    else if (browRaise > 0.02 && mouthOpen < 0.01) emotion = "Curious 🤔";
    else if (eyeOpenness > 0.02) emotion = "Surprised 😲";

    emotionText.innerText = emotion;
}

async function detectFace(faceMesh) {
    try {
        const results = await faceMesh.send({ image: video });
        processResults(results);
    } catch (error) {
        console.error("FaceMesh Error:", error);
    }
    requestAnimationFrame(() => detectFace(faceMesh));
}

async function init() {
    await startCamera();
    const faceMesh = await loadFaceMesh();
    detectFace(faceMesh);
}

init();
