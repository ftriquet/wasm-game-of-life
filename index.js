const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#f44298";
const DEFAULT_CELL_SIZE = 5;

const PANEL_SIZE = 100; // px

let draw;

let tickDelay = 200;
const updateTickDelay = n => {
  tickDelay += n;
  if (tickDelay < 2) {
    tickDelay = 2;
  }
  draw();
};

let Cell;
let World;
let render;
let step;
let currentWorld;
let play = true;

const createWorld = (width, height, cellSize) => {
  const nCellsWidth = Math.floor(width / cellSize);
  const nCellsHeight = Math.floor(height / cellSize);
  const world = World.new(nCellsWidth, nCellsHeight);
  console.log(width, height);
  world.width = nCellsWidth;
  world.height = nCellsHeight;

  currentWorld = {
    world,
    cellSize,
  };

  const canvas = document.getElementById("game-of-life-canvas");
  canvas.height = height;
  canvas.width = width;

  return currentWorld;
}

const playPause = () => {
  const playPauseButton = document.getElementById("play-pause-button");

  if (play) {
    playPauseButton.innerHTML = "Play";
    play = false;
  } else {
    playPauseButton.innerHTML = "Pause";
    play = true;
  }
}

let clearWorld;

const getCells = (wasm, world) => {
  const cellsPtr = world.cells();
  const cells = new Uint32Array(wasm.memory.buffer, cellsPtr, world.width * world.height);
  return cells;
};

const getChangedCells = (wasm, world) => {
  const changedCellsPtr = world.changed_cells();
  const changedCellsLen = world.changed_cells_len();
  const cells = new Uint32Array(wasm.memory.buffer, changedCellsPtr, changedCellsLen);
  return cells;
};

const getIndex = (world, row, column) => {
  return row * world.width + column;
};

const fromIndex = (world, idx) => {
  const col = idx % world.width;
  const row = Math.floor(idx / world.width);
  return [row, col];
};

const drawChangedCells = (ctx, wasm) => {
  if (!currentWorld) {
    return;
  }

  const { world, cellSize } = currentWorld;
  const cells = getCells(wasm, world);
  const cellsIndexes = getChangedCells(wasm, world);

  ctx.beginPath();

  for (let i = 0; i < cellsIndexes.length; i++) {
    const index = cellsIndexes[i];
    const [row, col] = fromIndex(world, index);
    const cell = cells[index];

    ctx.fillStyle = cell === Cell.Dead
      ? DEAD_COLOR
      : ALIVE_COLOR;

    ctx.fillRect(
      col * (cellSize) + 1,
      row * (cellSize) + 1,
      cellSize,
      cellSize
    );
  }

  world.reset_changed_cells();
  ctx.stroke();
}

const drawCells = (ctx, wasm, redrawAll) => {
  if (!currentWorld) {
    return;
  }

  const { world, cellSize } = currentWorld;
  
  if (!redrawAll) {
    return drawChangedCells(ctx, wasm);
  }

  const cells = getCells(wasm, world);
  ctx.beginPath();

  for (let row = 0; row < world.height; row++) {
    for (let col = 0; col < world.width; col++) {
      const index = getIndex(world, row, col);
      const cell = cells[index];

      ctx.fillStyle = cell === Cell.Dead
        ? DEAD_COLOR
        : ALIVE_COLOR;

      ctx.fillRect(
        col * (cellSize) + 1,
        row * (cellSize) + 1,
        cellSize,
        cellSize
      );
    }
  }

  ctx.stroke();
  world.reset_changed_cells();
}

const loadWasm = () => gameOfLife("build/game_of_life_bg.wasm").then(() => gameOfLife)

const startGame = () => {
  loadWasm().then(game => {
    Cell = game.Cell;
    World = game.World;
    Figure = game.Figure;

    let world = World.new(100, 100);

    const selectFigure = document.getElementById("load-figure");
    selectFigure.addEventListener('input', (a, b) => {
      if (!currentWorld) { return; };
      let { world } = currentWorld;
      fetch(`patterns/${a.target.value}.rle`).then(res => res.text()).then(text => {
        world.load_string(text)
        draw(true);
      })
    })

    const canvas = document.getElementById("game-of-life-canvas");
    const ctx = canvas.getContext('2d');

    step = () => {
      if (!currentWorld) { return; };
      let { world } = currentWorld;
      world.tick();
    };

    draw = (redrawAll) => {
      if (!currentWorld) { return; };
      let { world } = currentWorld;
      document.getElementById('generations').innerHTML = world.generations();
      document.getElementById('speed').innerHTML = tickDelay + ' ms';
      document.getElementById('dimensions').innerHTML = `${world.width} x ${world.height}`;
      drawCells(ctx, game.wasm, redrawAll);
    }

    draw();

    render = () => {
      draw();
      animationId = requestAnimationFrame(render);
    }
    render();

    bodyWidth = document.body.clientWidth - PANEL_SIZE;
    bodyHeight = document.body.clientHeight;
    createWorld(bodyWidth, bodyHeight, DEFAULT_CELL_SIZE);
    draw(true);

    clearWorld = () => {
      if (!currentWorld) { return; };
      let { world } = currentWorld;
      world.clear();
      draw(true);
    }

    const tick = () => {
      setTimeout(() => {
        if (play) {
          if (!currentWorld) { return; };
          let { world } = currentWorld;
          world.tick();
        }
        tick();
      }, tickDelay);
    };
    tick();

    canvas.addEventListener("click", event => {
      if (!currentWorld) { return; };
      let { world, cellSize } = currentWorld;
      const boundingRect = canvas.getBoundingClientRect();

      const scaleX = (canvas.width) / boundingRect.width;
      const scaleY = (canvas.height) / boundingRect.height;

      const canvasLeft = (event.clientX - boundingRect.left - 5) * scaleX;
      const canvasTop = (event.clientY - boundingRect.top - 5) * scaleY;

      const row = Math.min(Math.floor(canvasTop / (cellSize)), world.height - 1);
      const col = Math.min(Math.floor(canvasLeft / (cellSize)), world.width - 1);

      world.toggle(row, col);

      draw();
    });
  }).catch(e => {
    console.error(e);
  })
}
