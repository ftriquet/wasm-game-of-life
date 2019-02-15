import React from "react";
import Playground from "../playground";
import Panel from "../panel";
const MIN_DELAY = 2;
const DEFAULT_CELL_SIZE = 5;
const MIN_CELL_SIZE = 2;
const MAX_CELL_SIZE = 15;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      world: this.createWorld(DEFAULT_CELL_SIZE),
      animationId: null,
      tickDelay: 20,
      timerId: null,
      cellSize: DEFAULT_CELL_SIZE,
    };
  }

  resizeWorld() {
    this.setState(state => {
      const { world, cellSize } = state;
      const width = Math.floor((window.innerWidth) / cellSize);
      const height = Math.floor((window.innerHeight - 48) / cellSize);
      world.resize(width, height);
      world.width = width;
      world.height = height;
      return { world };
    })
  }

  createWorld(cellSize) {
    const width = Math.floor((window.innerWidth) / cellSize);
    const height = Math.floor((window.innerHeight - 48) / cellSize);
    const world = World.new(width, height);
    world.width = width;
    world.height = height;
    return world;
  }

  componentWillUnmount() {
    clearInterval(this.state.timerId);
  }

  playPause() {
    this.setState(state => {
      if (state.timerId) {
        clearTimeout(state.timerId);
        return { timerId: null };
      } else {
        return { timerId: setTimeout(() => this.tick(), state.tickDelay) };
      }
    });
  }

  updateSpeed(value) {
    this.setState({ tickDelay: 2000 / value })
  }

  tick() {
    this.state.world.next_tick();
    this.setState(state => ({
      timerId: setTimeout(() => this.tick(), state.tickDelay)
    }));
  }

  step() {
    this.setState(state => {
      state.world.next_tick();
      return {};
    });
  }

  toggleCell(row, col) {
    this.setState(state => {
      state.world.toggle(row, col);
      return {};
    });
  }

  loadRle(content) {
    this.setState(state => {
      state.world.load_string(content);
      return {};
    });
  }

  clearWorld() {
    this.setState(state => {
      state.world.clear();
      return {};
    });
  }

  updateCellSize(value) {
    this.setState({ cellSize: value });
    this.resizeWorld();
  }

  render() {
    return (
      <div id="app">
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
        />
        <Playground
          world={this.state.world}
          wasm={this.props.wasm}
          toggleCell={this.toggleCell.bind(this)}
          cellSize={this.state.cellSize}
        />
      </div>
    );
  }
}

module.exports = App;
