let model, video, canvas, ctx;
let timerInterval, breakTimer, quoteInterval;
let focusDuration = 0;
let secondsLeft = 0;
let breakActive = false;
let manuallyPaused = false;
let lookAwayCount = 0;
let totalSeconds = 0;
// Runtime flags controlled by UI
let faceDetectionEnabled = true;
let mirrorCamera = false;
let faceDetected = false;
let timerPausedByFaceDetection = false;

// Motivational quotes
const motivationalQuotes = [
  "Every moment of focus is a step toward mastery.",
  "Your future self will thank you for this effort today.",
  "Focus is the gateway to excellence.",
  "Small distractions lead to big regrets. Stay locked in.",
  "You are stronger than your distractions.",
  "This moment defines your commitment.",
  "Progress is the product of persistent focus.",
  "Champions are built one focused hour at a time.",
  "Your goals are worth your undivided attention.",
  "Stay present. Stay focused. Stay unstoppable.",
  "Distraction is the enemy of achievement.",
  "Deep work is deep growth.",
  "You've got this. Now prove it.",
  "Every second counts when you're in the zone.",
  "Focus today, celebrate tomorrow."
];

let currentQuoteIndex = 0;

function updateMotivationalQuote() {
  const quoteElement = document.getElementById('motivationalQuote');
  if (quoteElement) {
    quoteElement.innerText = motivationalQuotes[currentQuoteIndex];
    currentQuoteIndex = (currentQuoteIndex + 1) % motivationalQuotes.length;
  }
}

function startQuoteRotation() {
  // Clear any existing quote interval
  clearInterval(quoteInterval);
  // Update quote immediately
  updateMotivationalQuote();
  // Update quote every 20 seconds
  quoteInterval = setInterval(updateMotivationalQuote, 20000);
}

function stopQuoteRotation() {
  clearInterval(quoteInterval);
}
async function setupCamera() {
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  // Request front-facing camera by default and prefer a reasonable resolution
  const constraints = { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  // Ensure the video fills its container (cover) and don't apply mirroring by default
  try{
    video.style.objectFit = 'cover';
    video.style.width = '100%';
    video.style.height = '100%';
    // keep canvas transform unset so drawings align with the displayed video
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }catch(e){/* ignore styling errors */}
  return new Promise((resolve) => {
    video.onloadedmetadata = () => { resizeCanvasToVideo(); resolve(video); };
  });
}
async function loadModel() {
  // Load the model only if face detection is enabled
  if (!faceDetectionEnabled) { model = null; return; }
  model = await blazeface.load();
}
async function detectFace() {
  // If detection disabled or model missing, return empty array
  if (!faceDetectionEnabled || !model) return [];
  try {
    const predictions = await model.estimateFaces(video, false);
    return predictions;
  } catch (e) {
    console.warn('detectFace error', e);
    return [];
  }
}
function updateTimerDisplay() {
  // Prevent displaying negative values (will appear as "-1:-1")
  const safeSeconds = Math.max(0, Math.floor(Number(secondsLeft) || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  document.getElementById("timerDisplay").innerText = `${minutes}:${seconds}`;
}
function endSession(message = "You left the zone! Session ended.") {
  clearTimeout(timerInterval);
  clearInterval(breakTimer);
  stopQuoteRotation();
  document.getElementById("status").innerText = message;
}
async function monitorFocus() {
  if (manuallyPaused) return;
  try{
    const preds = await detectFace();
    // draw boxes (no enforcement)
    drawDetections(preds);
    
    // Check if face is detected
    if (preds && preds.length > 0) {
      faceDetected = true;
      // Face detected - resume timer if it was paused by face detection
      if (timerPausedByFaceDetection) {
        timerPausedByFaceDetection = false;
        document.getElementById("status").innerText = "Face detected. Timer resumed 🧠";
      }
      if(lookAwayCount>0) lookAwayCount = 0;
    }
  } catch(e) {
    console.warn('monitorFocus error', e);
  }
}
function startTimerInterval(){
  // set or restart the main focus timer loop using a serial async tick to avoid overlapping
  // Use timerInterval to store the timeout id so we can clear it with clearTimeout
  clearTimeout(timerInterval);
  let running = true;
  const tick = async () => {
    if (!running) return;
    // run detection (non-blocking for strict timing) then update timer
    try { await monitorFocus(); } catch(e){ console.warn('monitor tick error', e); }

    if (!manuallyPaused && !breakActive && !timerPausedByFaceDetection) {
      secondsLeft = Math.max(0, secondsLeft - 1);
      updateTimerDisplay();
      // every 30 minutes (1800s) trigger break
      if (secondsLeft !== 0 && secondsLeft % 1800 === 0) {
        startBreakCycle();
        running = false;
        return;
      }
      if (secondsLeft <= 0 && !breakActive) {
        document.getElementById("status").innerText = "Focus session complete! ✅";
        running = false;
        return;
      }
      // update progress bar
      const progress = document.getElementById('progressBar');
      if(progress && totalSeconds>0){ const pct = Math.max(0, Math.min(100, ((totalSeconds - secondsLeft)/totalSeconds)*100)); progress.style.width = pct + '%'; }
    }

    timerInterval = setTimeout(tick, 1000);
  };
  // start loop
  timerInterval = setTimeout(tick, 1000);
}

function startFocusSession() {
  secondsLeft = focusDuration * 60;
  totalSeconds = secondsLeft;
  updateTimerDisplay();
  startTimerInterval();
}
async function startFocus() {
  // Read minutes input, default to 0 when empty/invalid
  focusDuration = parseInt(document.getElementById("minutes").value);
  if (isNaN(focusDuration) || focusDuration < 0) focusDuration = 0;
  document.getElementById("status").innerText = "Loading camera and AI...";
  try {
    await setupCamera();
    // Always enable face detection
    faceDetectionEnabled = true;
    await loadModel();
    document.getElementById("status").innerText = "Focus started. Stay in zone 🧠";
    manuallyPaused = false;
    // UI button states
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    startBtn.style.display = 'none'; pauseBtn.style.display = 'inline-block'; resumeBtn.style.display = 'none';
    // Start quote rotation
    startQuoteRotation();
    startFocusSession();
  } catch (error) {
    console.error("Error starting focus session:", error);
    document.getElementById("status").innerText = "Error: " + (error.message || "Failed to start. Check camera permissions and internet connection.");
  }
}

function pauseFocus(){
  // manual pause: stop intervals and set flag
  manuallyPaused = true;
  timerPausedByFaceDetection = false;
  clearTimeout(timerInterval); clearInterval(breakTimer);
  document.getElementById('status').innerText = 'Paused by user';
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('resumeBtn').style.display = 'inline-block';
}

function resumeFocus(){
  // Resume regardless of visibility
  manuallyPaused = false;
  timerPausedByFaceDetection = false;
  document.getElementById('status').innerText = 'Resuming session...';
  // restore the right interval
  if(breakActive){
    // continue break timer
    breakTimer = setInterval(() => {
      secondsLeft--; updateTimerDisplay();
      if (secondsLeft <= 0) { breakActive = false; clearInterval(breakTimer); document.getElementById('status').innerText = 'Break over. Back to focus!'; startTimerInterval(); }
    }, 1000);
  } else {
    startTimerInterval();
  }
  document.getElementById('pauseBtn').style.display = 'inline-block';
  document.getElementById('resumeBtn').style.display = 'none';
}

function resizeCanvasToVideo(){
  if(!video || !canvas) return;
  // Use video's intrinsic size for drawing, and size canvas visually to the displayed video rect
  const rect = video.getBoundingClientRect();
  const vw = video.videoWidth || Math.max(320, Math.round(rect.width));
  const vh = video.videoHeight || Math.max(240, Math.round(rect.height));
  // set canvas logical size to the video's intrinsic pixel size so detection coordinates map 1:1
  canvas.width = vw;
  canvas.height = vh;
  // set visual size to match displayed video
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  // reset any transforms on the drawing context
  try { ctx.setTransform(1,0,0,1,0,0); } catch(e){}
}

function drawDetections(preds){
  if(!canvas || !ctx) return;
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!preds || preds.length===0) return;
  // compute scale between video intrinsic size and displayed size
  const rect = video.getBoundingClientRect();
  const scaleX = canvas.width / (video.videoWidth || canvas.width);
  const scaleY = canvas.height / (video.videoHeight || canvas.height);
  ctx.strokeStyle = '#00ffae'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(0,255,174,0.12)';
  preds.forEach(p=>{
    // BlazeFace returns topLeft and bottomRight arrays
    const tl = p.topLeft || p.boundingBox && [p.boundingBox.topLeftX, p.boundingBox.topLeftY];
    const br = p.bottomRight || p.boundingBox && [p.boundingBox.bottomRightX, p.boundingBox.bottomRightY];
    if(!tl || !br) return;
    const x = tl[0]*scaleX; const y = tl[1]*scaleY; const w = (br[0]-tl[0])*scaleX; const h = (br[1]-tl[1])*scaleY;
    ctx.beginPath(); ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
  });
}

// Handle immediate no-face detection: pause and show restart prompt
// Note: face/tab enforcement and overlays have been removed per user request.

window.addEventListener('resize', ()=>{ resizeCanvasToVideo(); });

// Pause/resume when tab visibility changes
// Visibility change enforcement removed — do not pause when the page becomes hidden.

// Unlock button allows user to manually resume (in case browser doesn't auto-focus)
// Unlock button handler removed as overlays/warnings were deleted per user request.

// Wire start/pause/resume buttons
document.addEventListener('DOMContentLoaded', ()=>{
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  if(startBtn) startBtn.addEventListener('click', async ()=>{ try{ await startFocus(); }catch(e){ console.error(e); }});
  if(pauseBtn) pauseBtn.addEventListener('click', ()=>{ pauseFocus(); });
  if(resumeBtn) resumeBtn.addEventListener('click', ()=>{ resumeFocus(); });

  // initial button visibility
  if(startBtn) startBtn.style.display='inline-block';
  if(pauseBtn) pauseBtn.style.display='none';
  if(resumeBtn) resumeBtn.style.display='none';
  // Restart button removed (no longer used)
});
