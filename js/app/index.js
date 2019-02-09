const React = require('react');
const Playground = require('../playground');
const Panel = require('../panel');


class App extends React.Component {
  constructor(props) {
    super(props);
    let world = World.new(240, 180);
    world.width = 240;
    world.height = 180;

    this.state = {
      world: world,
      playing: true,
      animationId: null,
      tickDelay: 20,
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

  playPause(e) {
    this.setState(state => ({ playing: !state.playing }));
  }

  tick() {
    if (this.state.playing) {
      this.state.world.tick();
      // This sounds like a hack but it's needed for the children components to render
      this.setState({});
    }
  }

  render() {
    return (
      <div id="app">
        <Panel tickDelay={this.state.tickDelay} playing={this.state.playing} playPause={this.playPause.bind(this)}/>
        <Playground world={this.state.world} wasm={this.props.wasm}/>
      </div>
    )
  }
}

module.exports = App;
