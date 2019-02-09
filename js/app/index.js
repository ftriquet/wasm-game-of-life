const React = require('react');
const Playground = require('../playground');

class Panel extends React.Component {
  playPauseStr() {
    if (this.props.playing) {
      return 'Pause';
    } else {
      return 'Play';
    }
  }

  render() {
    return (
      <div id="panel">
        <button id="play-pause-button">{this.playPauseStr()}</button>
        <div style={{'text-align': 'center'}}>{this.props.tickDelay}</div>
      </div>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    let world = World.new(100, 100);
    world.width = 100;
    world.height = 100;

    this.state = {
      world: world,
      playing: true,
      animationId: null,
      tickDelay: 200,
    };
  }

  componentDidMount() {
    this.timerId = setInterval(() => {
      this.tick();
    }, this.props.tickDelay);
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  tick() {
    this.state.world.tick();
    // This sounds like a hack but it's needed for the children components to render
    this.setState({});
  }

  render() {
    return (
      <div id="app">
        <Panel tickDelay={this.state.tickDelay} playing={this.state.playing}/>
        <Playground world={this.state.world} wasm={this.props.wasm}/>
      </div>
    )
  }
}

module.exports = App;
