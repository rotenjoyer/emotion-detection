const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionText = document.getElementById('emotion');

// Load the webcam feed
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
}

// Load MediaPipe Face Landmarker
async function loadFaceMesh() {
    const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({ maxNumFaces: 1, minDetectionConfidence: 0.5 });
    faceMesh.onResults((results) => processResults(results));
    return faceMesh;
}

// Process face landmarks and detect emotions
function processResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            let mouthOpen = landmarks[13].y - landmarks[14].y;
            let browRaise = landmarks[10].y - landmarks[151].y;
            let smile = landmarks[48].x - landmarks[54].x;
            
            let emotion = "Neutral";
            if (smile > 0.02) emotion = "Happy 😊";
            else if (browRaise > 0.03) emotion = "Surprised 😲";
            else if (mouthOpen > 0.05) emotion = "Shocked 😱";
            else if (browRaise < -0.02) emotion = "Angry 😡";

            emotionText.innerText = emotion;
        }
    }
}

// Initialize everything
async function init() {
    await startCamera();
    const faceMesh = await loadFaceMesh();
    setInterval(() => faceMesh.send({ image: video }), 100);
}
init();
