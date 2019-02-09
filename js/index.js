const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./app')

gameOfLife("build/game_of_life_bg.wasm").then(() => {
  World = gameOfLife.World;

  ReactDOM.render(
    <App World={World} wasm={gameOfLife.wasm}/>,
    document.getElementById('root')
  );
})
