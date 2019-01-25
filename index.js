const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const HEIGHT = 150;
const WIDTH = 275;

let tickDelay = 50;
const updateTickDelay = n => {
  tickDelay += n;
};

// wasm_bindgen wrapper classes. Will be set
// after instanciation of the wasm module.
let Cell;
let World;


let playPlauseButton;
let animationId = null;
let render;


// Button callbacks
let step;

const playPause = () => {
  if (animationId) {
    playPauseButton.innerHTML = "Play";
    cancelAnimationFrame(animationId);
    animationId = null;
  } else {
    playPauseButton.innerHTML = "Pause";
    render()
  }
}

let clearWorld;


const drawGrid = (ctx) => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines.
  for (let i = 0; i <= WIDTH; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * HEIGHT + 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= HEIGHT; j++) {
    ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * WIDTH + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getCells = (wasm, world) => {
  const cellsPtr = world.cells();
  const cells = new Uint32Array(wasm.memory.buffer, cellsPtr, WIDTH * HEIGHT);
  return cells;
};

const getIndex = (row, column) => {
  return row * WIDTH + column;
};

const drawCells = (ctx, wasm, world) => {
  const cells = getCells(wasm, world);
  console.log(cells);
  ctx.beginPath();

  for (let row = 0; row < HEIGHT; row++) {
    for (let col = 0; col < WIDTH; col++) {
      const index = getIndex(row, col);
      const cell = cells[index];

      ctx.fillStyle = cell === Cell.Dead
        ? DEAD_COLOR
        : ALIVE_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
}

const loadWasm = () => gameOfLife("build/game_of_life_bg.wasm").then(() => gameOfLife)


const startGame = () => {
  loadWasm().then(game => {
    Cell = game.Cell;
    World = game.World;
    const world = World.new(WIDTH, HEIGHT);

    const canvas = document.getElementById("game-of-life-canvas");
    canvas.height = (CELL_SIZE + 1) * HEIGHT + 1;
    canvas.width = (CELL_SIZE + 1) * WIDTH + 1;

    const ctx = canvas.getContext('2d');

    playPauseButton = document.getElementById("play-pause-button");

    step = () => {
      world.tick();
      draw();
    };

    const draw = () => {
      drawGrid(ctx);
      drawCells(ctx, game.wasm, world);
    }

    draw();

    render = () => {
      draw();
      animationId = requestAnimationFrame(render);
    }

    clearWorld = () => {
      world.clear();
      draw();
    }

    const tick = () => {
      setTimeout(() => {
        if (animationId) {
          world.tick();
        }
        tick();
      }, tickDelay);
    };
    tick();

    canvas.addEventListener("click", event => {
      const boundingRect = canvas.getBoundingClientRect();

      const scaleX = canvas.width / boundingRect.width;
      const scaleY = canvas.height / boundingRect.height;

      const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
      const canvasTop = (event.clientY - boundingRect.top) * scaleY;

      const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), HEIGHT - 1);
      const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), WIDTH - 1);
      console.log(row, col);

      world.toggle(row, col);

      draw();
    });
  }).catch(e => {
    console.error(e);
  })
}
