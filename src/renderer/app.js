const canvas = document.getElementById('pet-canvas');
const context = canvas.getContext('2d');

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
