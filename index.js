const CELL_SIZE = 2;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
let ALIVE_COLOR = "#f44298";

const PANEL_SIZE = 100; // px

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

let HEIGHT;
let WIDTH;

let resizePlayground;
let draw;

let tickDelay = 50;
const updateTickDelay = n => {
  tickDelay += n;
  if (tickDelay < 2) {
    tickDelay = 2;
  }
  draw();
};

// wasm_bindgen wrapper classes. Will be set
// after instanciation of the wasm module.
let Cell;
let World;
let SurfaceMode;

let loadFigure;


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
  return;
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

const getChangedCells = (wasm, world) => {
  const changedCellsPtr = world.changed_cells();
  const changedCellsLen = world.changed_cells_len();
  const cells = new Uint32Array(wasm.memory.buffer, changedCellsPtr, changedCellsLen);
  return cells;
};

const getIndex = (row, column) => {
  return row * WIDTH + column;
};

const fromIndex = (idx) => {
  const col = idx % WIDTH;
  const row = Math.floor(idx / WIDTH);
  return [row, col];
};

const drawChangedCells = (ctx, wasm ,world) => {
  const cells = getCells(wasm, world);
  const cellsIndexes = getChangedCells(wasm, world);

  ctx.beginPath();

  for (let i = 0; i < cellsIndexes.length; i++) {
    // ALIVE_COLOR = getRandomColor();
    let [row, col] = fromIndex(cellsIndexes[i]);
    let index = getIndex(row, col);
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

  world.reset_changed_cells();
  ctx.stroke();
}

const drawCells = (ctx, wasm, world, redrawAll) => {
  if (!redrawAll) {
    return drawChangedCells(ctx, wasm, world);
  }
  const cells = getCells(wasm, world);
  ctx.beginPath();

  for (let row = 0; row < HEIGHT; row++) {
    for (let col = 0; col < WIDTH; col++) {
      // ALIVE_COLOR = getRandomColor();
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
    Figure = game.Figure;

    const selectFigure = document.getElementById("load-figure");
    for (const figure in Figure) {
      selectFigure.options[selectFigure.options.length] = new Option(figure);
    }

    let world = World.new(0, 0);

    selectFigure.addEventListener('input', (a, b) => {
      if (a.target.value === 'null') {
        return;
      }
      world.load_figure(Math.floor(HEIGHT / 2) - 15, Math.floor(WIDTH / 2) - 15, Figure[a.target.value]);
      draw();
    })

    const canvas = document.getElementById("game-of-life-canvas");
    canvas.height = (CELL_SIZE + 1) * HEIGHT + 1;
    canvas.width = (CELL_SIZE + 1) * WIDTH + 1;

    const ctx = canvas.getContext('2d');

    playPauseButton = document.getElementById("play-pause-button");

    step = () => {
      world.tick();
      draw();
    };

    draw = (redrawAll) => {
      document.getElementById('generations').innerHTML = world.generations();
      document.getElementById('speed').innerHTML = tickDelay + ' ms';
      document.getElementById('dimensions').innerHTML = `${WIDTH} x ${HEIGHT}`;
      drawGrid(ctx);
      drawCells(ctx, game.wasm, world, redrawAll);
    }

    draw(true);

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
      draw(true);
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
      draw();
      const boundingRect = canvas.getBoundingClientRect();

      const scaleX = (canvas.width) / boundingRect.width;
      const scaleY = (canvas.height) / boundingRect.height;

      const canvasLeft = (event.clientX - boundingRect.left - 6) * scaleX;
      const canvasTop = (event.clientY - boundingRect.top - 6) * scaleY;

      const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), HEIGHT - 1);
      const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), WIDTH - 1);

      world.toggle(row, col);

      draw();
    });

    const mode_selector = document.getElementById("surface-mode-select")
    world.set_mode(SurfaceMode[mode_selector.value]);
    mode_selector.addEventListener('change', (a, b) => {
        if (a.target.value == 'Torus') {
          world.set_mode(SurfaceMode.Torus);
        } else {
          world.set_mode(SurfaceMode.Finite);
        }
      })
  }).catch(e => {
    console.error(e);
  })
}
