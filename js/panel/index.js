const React = require('react');

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
        <button onClick={this.props.playPause}>{this.playPauseStr()}</button>
        <div style={{'text-align': 'center'}}>{this.props.tickDelay}</div>
      </div>
    )
  }
}

module.exports = Panel;
