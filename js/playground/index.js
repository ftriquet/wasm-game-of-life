const React = require("react");

const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#f44298";

const cellSize = 5;
const getCells = (wasm, world) => {
  const cellsPtr = world.cells();
  const cells = new Uint32Array(
    wasm.memory.buffer,
    cellsPtr,
    world.width * world.height
  );
  return cells;
};

const getChangedCells = (wasm, world) => {
  const changedCellsPtr = world.changed_cells();
  const changedCellsLen = world.changed_cells_len();
  const cells = new Uint32Array(
    wasm.memory.buffer,
    changedCellsPtr,
    changedCellsLen
  );
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

const drawChangedCells = (ctx, wasm, world) => {
  const cells = getCells(wasm, world);
  const cellsIndexes = getChangedCells(wasm, world);

  ctx.beginPath();

  for (let i = 0; i < cellsIndexes.length; i++) {
    const index = cellsIndexes[i];
    const [row, col] = fromIndex(world, index);
    const cell = cells[index];

    ctx.fillStyle = cell === 0 ? DEAD_COLOR : ALIVE_COLOR;
    ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize, cellSize);
  }

  world.reset_changed_cells();
  ctx.stroke();
};

const drawCells = (ctx, wasm, world) => {
  const cells = getCells(wasm, world);
  ctx.beginPath();

  for (let row = 0; row < world.height; row++) {
    for (let col = 0; col < world.width; col++) {
      const index = getIndex(world, row, col);
      const cell = cells[index];

      ctx.fillStyle = cell === 0 ? DEAD_COLOR : ALIVE_COLOR;

      ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize, cellSize);
    }
  }

  ctx.stroke();
};

class Playground extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.drawCanvas();
  }
  componentDidUpdate() {
    this.drawCanvas();
  }

  drawCanvas() {
    const { world, wasm } = this.props;
    const ctx = this.canvasRef.current.getContext("2d");
    drawChangedCells(ctx, wasm, world);
  }

  render() {
    const { world } = this.props;

    return (
      <div class="playground">
        <canvas
          id={"game-of-life-canvas"}
          ref={this.canvasRef}
          width={this.props.world.width * cellSize}
          height={this.props.world.height * cellSize}
        />
      </div>
    );
  }
}

module.exports = Playground;
