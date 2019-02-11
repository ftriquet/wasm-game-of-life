import React from "react";
import Playground from "../playground";
import Panel from "../panel";
const MIN_DELAY = 2;
const cellSize = 2;

class App extends React.Component {
  constructor(props) {
    super(props);
    // -10 for margin
    const width = Math.floor((window.innerWidth - 10) / cellSize);
    const height = Math.floor((window.innerHeight - 48 - 10) / cellSize);
    const world = World.new(width, height);
    world.width = width;
    world.height = height;

    this.state = {
      world: world,
      playing: true,
      animationId: null,
      tickDelay: 20,
      timerId: null
    };
  }

  componentDidMount() {
    this.setState(state => ({
      timerId: setTimeout(() => this.tick(), state.tickDelay)
    }));
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
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

  updateTickDelay(amount) {
    this.setState(state => {
      let newDelay = state.tickDelay + amount;
      if (newDelay < MIN_DELAY) {
        newDelay = MIN_DELAY;
      }
      return { tickDelay: newDelay };
    });
  }

  faster() {
    this.updateTickDelay(-10);
  }

  slower() {
    this.updateTickDelay(10);
  }

  tick() {
    this.state.world.tick();
    this.setState(state => ({
      timerId: setTimeout(() => this.tick(), state.tickDelay)
    }));
  }

  step() {
    this.setState(state => {
      state.world.tick();
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

  render() {
    return (
      <div id="app">
        <Panel
          tickDelay={this.state.tickDelay}
          playing={this.state.timerId !== null}
          playPause={this.playPause.bind(this)}
          faster={this.faster.bind(this)}
          slower={this.slower.bind(this)}
          isOpen={this.state.menuIsOpen}
          step={this.step.bind(this)}
          loadRle={this.loadRle.bind(this)}
          clear={this.clearWorld.bind(this)}
        />
        <Playground
          world={this.state.world}
          wasm={this.props.wasm}
          toggleCell={this.toggleCell.bind(this)}
        />
      </div>
    );
  }
}

module.exports = App;
