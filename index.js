const CELL_SIZE = 10;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const HEIGHT = 80;
const WIDTH = 160;

// wasm_bindgen wrapper classes. Will be set
// after instanciation of the wasm module.
let Cell;
let World;


let animationId = null;
let render;


// Button callbacks
let step;

const playPause = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  } else {
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

const drawCells = (ctx, world) => {
  ctx.beginPath();

  for (let row = 0; row < HEIGHT; row++) {
    for (let col = 0; col < WIDTH; col++) {
      const cell = world.get(row, col);

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

const getCellsData = (world, wasmMemory) => {
  // Get address of cells array in wasm linear memory
  const cellsAddr = world.cells();
  // Instanciate js buffer from address and size
  const cells = new Uint8Array(wasmMemory.buffer, cellsAddr, WIDTH * HEIGHT);
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

    drawGrid(ctx);
    drawCells(ctx, world);

    step = () => {
      world.tick();
      drawGrid(ctx);
      drawCells(ctx, world);
    };

    render = () => {
      world.tick()
      drawGrid(ctx);
      drawCells(ctx, world);
      animationId = requestAnimationFrame(render);
    }

    clearWorld = () => {
      console.log('CLEAR');
      world.clear();
    }

    render();
  }).catch(e => {
    console.error(e);
  })
}
