// setup canvas

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);

// function to generate random number

function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}

// define Ball constructor
class Shape {
  constructor(x, y, velX, velY, exists) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.exists = exists;
  }
}

class Ball extends Shape {
  constructor(x, y, velX, velY, exists, color, size) {
    super(x, y, velX, velY, exists);
    this.color = color;
    this.size = size;
  }

  // define ball draw method
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
  }

  // define ball update method
  update() {
    if (this.x + this.size >= width) {
      this.velX = -this.velX;
    }

    if (this.x - this.size <= 0) {
      this.velX = -this.velX;
    }

    if (this.y + this.size >= height) {
      this.velY = -this.velY;
    }

    if (this.y - this.size <= 0) {
      this.velY = -this.velY;
    }

    this.x += this.velX;
    this.y += this.velY;
  }

  // define ball collision detection
  collisionDetect() {
    for (let j = 0; j < balls.length; j++) {
      if (!(this === balls[j] && balls[j].exists)) {
        const dx = this.x - balls[j].x;
        const dy = this.y - balls[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.size + balls[j].size) {
          balls[j].color = this.color =
            "rgb(" +
            random(0, 255) +
            "," +
            random(0, 255) +
            "," +
            random(0, 255) +
            ")";
        }
      }
    }
  }
}

class EvilCircle extends Shape {
  constructor(x, y, velX, velY, exists, color, size) {
    super(x, y, velX, velY, exists);
    this.velX = velX;
    this.velY = velY;
    this.color = color;
    this.size = size;
  }

  // define ball draw method
  draw() {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // define ball update method
  checkBounds() {
    if (this.x + this.size >= width) {
      this.velX = -this.velX;
    }

    if (this.x - this.size <= 0) {
      this.velX = -this.velX;
    }

    if (this.y + this.size >= height) {
      this.velY = -this.velY;
    }

    if (this.y - this.size <= 0) {
      this.velY = -this.velY;
    }
  }

  // set the movement of the ball on keypress
  setControls() {
    let _this = this;
    window.onkeydown = function (e) {
      if (e.key === "a") {
        _this.x -= _this.velX;
      } else if (e.key === "d") {
        _this.x += _this.velX;
      } else if (e.key === "w") {
        _this.y -= _this.velY;
      } else if (e.key === "s") {
        _this.y += _this.velY;
      }
    };
  }

  // define ball collision detection
  collisionDetect() {
    for (let j = 0; j < balls.length; j++) {
      if (balls[j].exists) {
        const dx = this.x - balls[j].x;
        const dy = this.y - balls[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.size + balls[j].size) {
          balls[j].exists = false;
          ballEatenUp += 1;
        }
      }
    }
  }
}

// define array to store balls and populate it

let balls = [];
const startingBallCount = 20;

while (balls.length < startingBallCount) {
  const size = random(10, 20);
  let ball = new Ball(
    // ball position always drawn at least one ball width
    // away from the adge of the canvas, to avoid drawing errors
    random(0 + size, width - size),
    random(0 + size, height - size),
    random(-7, 7),
    random(-7, 7),
    true,
    "rgb(" + random(0, 255) + "," + random(0, 255) + "," + random(0, 255) + ")",
    size
  );
  balls.push(ball);
}

// define the evil circle
let evilCircle = new EvilCircle(0, 0, 20, 20, true, "white", 10);
evilCircle.setControls();
let ballEatenUp = 0;

const ballCount = document.querySelector("p");

// Control the position of the evil circle with mouse cursor
canvas.onmousemove = (e) => {
  evilCircle.x = e.clientX;
  evilCircle.y = e.clientY;
};
canvas.style.cursor = "none";

const startTime = new Date();
let endTime;
let timeDiff;
let gameEnded = false;
// define loop that keeps drawing the scene constantly
function loop() {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < balls.length; i++) {
    if (balls[i].exists) {
      balls[i].draw();
      balls[i].update();
      balls[i].collisionDetect();
    }
    evilCircle.draw();
    evilCircle.checkBounds();
    evilCircle.collisionDetect();
  }

  let remainingBalls = startingBallCount - ballEatenUp;
  ballCount.innerHTML = `Ball Count: ${remainingBalls}`;
  if (gameEnded)
    ballCount.innerHTML += `<br>You took ${timeDiff} seconds to clear all the balls.`;
  if (remainingBalls == 0 && !gameEnded) {
    endTime = new Date();
    timeDiff = endTime - startTime;
    timeDiff = Math.round(timeDiff / 1000);
    gameEnded = true;
  }
  requestAnimationFrame(loop);
}

loop();
