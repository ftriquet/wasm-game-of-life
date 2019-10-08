const React = require('react')

const DEAD_COLOR = '#FFFFFF'

const getCells = (wasm, world) => {
  const cellsPtr = world.cells()
  const cells = new Uint32Array(
    wasm.memory.buffer,
    cellsPtr,
    world.width() * world.height()
  )
  return cells
}

const getChangedCells = (wasm, world) => {
  const changedCellsPtr = world.changed_cells()
  const changedCellsLen = world.changed_cells_len()
  const cells = new Uint32Array(
    wasm.memory.buffer,
    changedCellsPtr,
    changedCellsLen
  )
  return cells
}

const fromIndex = (world, idx) => {
  const col = idx % world.width()
  const row = Math.floor(idx / world.width())
  return [row, col]
}

const drawCells = (ctx, wasm, world, cellSize, cellColor) => {
  const cells = getCells(wasm, world)

  ctx.beginPath()

  for (let i = 0; i < cells.length; i++) {
    const [row, col] = fromIndex(world, i)
    const cell = cells[i]

    ctx.fillStyle = cell === 0 ? DEAD_COLOR : cellColor
    ctx.fillRect(
      col * cellSize + 1,
      row * cellSize + 1,
      cellSize - 1,
      cellSize - 1
    )
  }

  world.reset_changed_cells()
  ctx.stroke()
}

const drawChangedCells = (ctx, wasm, world, cellSize, cellColor) => {
  const cells = getCells(wasm, world)
  const cellsIndexes = getChangedCells(wasm, world)

  ctx.beginPath()

  for (let i = 0; i < cellsIndexes.length; i++) {
    const index = cellsIndexes[i]
    const [row, col] = fromIndex(world, index)
    const cell = cells[index]

    ctx.fillStyle = cell === 0 ? DEAD_COLOR : cellColor
    ctx.fillRect(
      col * cellSize + 1,
      row * cellSize + 1,
      cellSize - 1,
      cellSize - 1
    )
  }

  world.reset_changed_cells()
  ctx.stroke()
}

class Playground extends React.Component {
  constructor (props) {
    super(props)
    this.canvasRef = React.createRef()
  }

  componentDidMount (prevProps) {
    this.drawCanvas()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    let force = false
    if (prevProps && prevProps.cellColor !== this.props.cellColor) {
      force = true
    }
    this.drawCanvas(force)
  }

  drawCanvas (force = false) {
    const { world, wasm } = this.props
    const ctx = this.canvasRef.current.getContext('2d')
    this.canvasRef.current.style = `
image-rendering: optimizeSpeed;
image-rendering: -moz-crisp-edges;
image-rendering: -webkit-optimize-contrast;
image-rendering: -o-crisp-edges;
image-rendering: optimize-contrast;
image-rendering: crisp-edges;
image-rendering: pixelated;
-ms-interpolation-mode: nearest-neighbor;
`
    if (force) {
      drawCells(ctx, wasm, world, this.props.cellSize, this.props.cellColor)
    } else {
      drawChangedCells(ctx, wasm, world, this.props.cellSize, this.props.cellColor)
    }
  }

  handleClick (event) {
    const canvas = event.target

    const boundingRect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / boundingRect.width
    const scaleY = canvas.height / boundingRect.height

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX
    const canvasTop = (event.clientY - boundingRect.top) * scaleY

    const row = Math.floor(canvasTop / this.props.cellSize)
    const col = Math.floor(canvasLeft / this.props.cellSize)
    this.props.toggleCell(row, col)
  }

  render () {
    return (
      <div style={{ margin: '5px' }}>
        <canvas
          id={'game-of-life-canvas'}
          onClick={this.handleClick.bind(this)}
          ref={this.canvasRef}
          width={this.props.world.width() * this.props.cellSize}
          height={this.props.world.height() * this.props.cellSize}
        />
      </div>
    )
  }
}

module.exports = Playground
