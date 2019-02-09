const React = require('react');
const ReactDOM = require('react-dom');

class App extends React.Component {
  render() {
    return <h1>{typeof this.props.world}</h1>;
  }
}

const loadWasm = () => gameOfLife("build/game_of_life_bg.wasm").then(() => gameOfLife)

loadWasm().then(game => {
  console.log('MDR');
  World = game.World;

  let world = World.new(100, 100);

  ReactDOM.render(
    <App world={world}/>,
    document.getElementById('root')
  );
})
