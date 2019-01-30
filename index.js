const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const PANEL_SIZE = 100; // px

let HEIGHT;
let WIDTH;

let resizePlayground;
let generations = 0;

let tickDelay = 50;
const updateTickDelay = n => {
  tickDelay += n;
  if (tickDelay < 10) {
    tickDelay = 10;
  }
};

// wasm_bindgen wrapper classes. Will be set
// after instanciation of the wasm module.
let Cell;
let World;
let SurfaceMode;


let playPlauseButton;
let animationId = null;
let render;

let loadTextArea;

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
    SurfaceMode = game.SurfaceMode;
    let world = World.new(0, 0);

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
      document.getElementById('generations').innerHTML = generations;
      drawGrid(ctx);
      drawCells(ctx, game.wasm, world);
    }

    draw();

    render = () => {
      draw();
      animationId = requestAnimationFrame(render);
    }

    resizePlayground = () => {
      bodyWidth = document.body.clientWidth - PANEL_SIZE;
      bodyHeight = document.body.clientHeight;
      canvas.height = bodyHeight;
      canvas.width = bodyWidth
      HEIGHT = Math.floor(bodyHeight / (CELL_SIZE + 1)) - 2;
      WIDTH = Math.floor(bodyWidth / (CELL_SIZE + 1)) - 1;
      world = World.new(WIDTH, HEIGHT);
      draw();
    }

    resizePlayground();

    clearWorld = () => {
      world.clear();
      generations = 0;
      draw();
    }

    const tick = () => {
      setTimeout(() => {
        if (animationId) {
          generations += 1;
          world.tick();
        }
        tick();
      }, tickDelay);
    };
    tick();

    loadTextArea = () => {
      const ta = document.getElementById("user-input");
      const content = ta.value;
      world.load_plaintext(10, 10, content);
      draw();
    };

    canvas.addEventListener("click", event => {
      draw();
      const boundingRect = canvas.getBoundingClientRect();

      // -10 for padding
      const scaleX = (canvas.width - 10) / boundingRect.width;
      const scaleY = (canvas.height - 10) / boundingRect.height;

      const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
      const canvasTop = (event.clientY - boundingRect.top) * scaleY;

      const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), HEIGHT - 1);
      const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), WIDTH - 1);

      world.toggle(row, col);

      draw();
    });

    const mode_selector = document.getElementById("surface-mode-select")
    world.set_mode(SurfaceMode[mode_selector.value]);
    mode_selector.addEventListener('change', (a, b) => {
        if (a.target.value == 'Tore') {
          world.set_mode(SurfaceMode.Tore);
        } else {
          world.set_mode(SurfaceMode.Finite);
        }
      })
  }).catch(e => {
    console.error(e);
  })
}
