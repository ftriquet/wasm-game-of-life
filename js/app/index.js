import React from 'react'
import Playground from '../playground'
import Panel from '../panel'
import Toast from '../toast'

const DEFAULT_CELL_SIZE = 10
const DEFAULT_CELL_COLOR = '#000000'

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      world: this.createWorld(DEFAULT_CELL_SIZE),
      animationId: null,
      tickDelay: 20,
      timerId: null,
      cellSize: DEFAULT_CELL_SIZE,
      openExportPatternSuccessToast: false,
      cellColor: DEFAULT_CELL_COLOR
    }
  }

  resizeWorld () {
    this.setState(state => {
      const { world, cellSize } = state
      const width = Math.floor(window.innerWidth / cellSize)
      const height = Math.floor((window.innerHeight - 48) / cellSize)
      world.resize(width, height)
      return { world }
    })
  }

  createWorld (cellSize) {
    const width = Math.floor(window.innerWidth / cellSize)
    const height = Math.floor((window.innerHeight - 48) / cellSize)
    const world = World.new(width, height)
    return world
  }

  componentWillUnmount () {
    clearInterval(this.state.timerId)
  }

  playPause () {
    this.setState(state => {
      if (state.timerId) {
        clearTimeout(state.timerId)
        return { timerId: null }
      } else {
        return { timerId: setTimeout(() => this.tick(), state.tickDelay) }
      }
    })
  }

  updateSpeed (value) {
    this.setState({ tickDelay: 2000 / value })
  }

  tick () {
    this.state.world.next_tick()
    this.setState(state => ({
      timerId: setTimeout(() => this.tick(), state.tickDelay)
    }))
  }

  step () {
    this.setState(state => {
      state.world.next_tick()
      return {}
    })
  }

  toggleCell (row, col) {
    this.setState(state => {
      state.world.toggle(row, col)
      return {}
    })
  }

  loadRle (content) {
    this.setState(state => {
      state.world.load_string(content)
      return {}
    })
  }

  clearWorld () {
    this.setState(state => {
      state.world.clear()
      return {}
    })
  }

  updateCellSize (value) {
    this.setState({ cellSize: value })
    this.resizeWorld()
  }

  onExport () {
    navigator.clipboard
      .writeText(this.state.world.export_rle())
      .then(() => {
        this.openExportPatternSuccessToast()
      })
      .catch(e => {
        console.log(e)
      })
  }

  openExportPatternSuccessToast () {
    this.setState({ openExportPatternSuccessToast: true })
  }

  openImageLoadWarningToast () {
    this.setState({ openImageLoadWarningToast: true })
  }

  closeExportPatternSuccessToast (event, reason) {
    if (reason === 'clickaway') {
      return
    }

    this.setState({ openExportPatternSuccessToast: false })
  }

  closeImageLoadWarningToast (event, reason) {
    if (reason === 'clickaway') {
      return
    }

    this.setState({ openImageLoadWarningToast: false })
  }

  onImageLoad (buff, err) {
    if (err) {
      this.openImageLoadWarningToast()
      return
    }
    const arr = new Uint8Array(buff)
    let world = World.from_image(arr)
    this.setState({ world })
  }

  onColorChange (x) {
    this.setState({ cellColor: x.hex })
  }

  render () {
    return (
      <div id='app'>
        <Panel
          tickDelay={this.state.tickDelay}
          playing={this.state.timerId !== null}
          playPause={this.playPause.bind(this)}
          isOpen={this.state.menuIsOpen}
          step={this.step.bind(this)}
          loadRle={this.loadRle.bind(this)}
          clear={this.clearWorld.bind(this)}
          biggerCells={() => this.changeCellSize(1)}
          smallerCells={() => this.changeCellSize(-1)}
          updateSpeed={this.updateSpeed.bind(this)}
          updateCellSize={this.updateCellSize.bind(this)}
          onExport={this.onExport.bind(this)}
          onImageLoad={this.onImageLoad.bind(this)}
          onColorChange={this.onColorChange.bind(this)}
        />
        <Playground
          world={this.state.world}
          wasm={this.props.wasm}
          toggleCell={this.toggleCell.bind(this)}
          cellSize={this.state.cellSize}
          cellColor={this.state.cellColor}
        />
        <Toast
          variant='success'
          open={this.state.openExportPatternSuccessToast}
          onClose={this.closeExportPatternSuccessToast.bind(this)}
          message='Pattern copied to clipboard!'
        />
        <Toast
          variant='warning'
          open={this.state.openImageLoadWarningToast}
          onClose={this.closeImageLoadWarningToast.bind(this)}
          message='Unsupported file type'
        />
      </div>
    )
  }
}

module.exports = App
