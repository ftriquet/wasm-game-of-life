const React = require("react");
const Playground = require("../playground");
const Panel = require("../panel");
const MIN_DELAY = 20;

class App extends React.Component {
  constructor(props) {
    super(props);
    width = Math.floor(document.body.clientWidth / 5);
    height = Math.floor((document.body.clientHeight - 30)/ 5);
    let world = World.new(width, height);
    world.width = width;
    world.height = height;

    this.state = {
      world: world,
      playing: true,
      animationId: null,
      tickDelay: 20,
      timerId: null,
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
    this.state.world.tick();
    this.setState({});
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
        />
        <Playground world={this.state.world} wasm={this.props.wasm} />
      </div>
    );
  }
}

module.exports = App;
