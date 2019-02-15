import React from "react";
import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";

import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';

import LoadModal from "../loadModal";

import { withStyles } from '@material-ui/core/styles';
const styles = {
  root: {
    width: 100,
  },
  slider: {
    padding: '10px 0px',
    margin: '0px 10px',
  },
  thumb: {
    background: 'white',
  },
  track: {
    background: 'white',
  },
}
class _Slider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.baseValue
    };
  }

  handleChange(_event, value) {
    this.setState({ value });
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }

  render() {
    const { classes } = this.props;
    const { value } = this.state;

    return (
      <div className={classes.root} style={{display: 'flex', flexDirection: 'column'}}>
      <Typography id="label" color="inherit" align="center">{this.props.label}</Typography>
        <Slider
          min={this.props.min}
          max={this.props.max}
          step={this.props.step}
          classes={{container: classes.slider, track: classes.track, thumb: classes.thumb}}
          value={value}
          onChange={this.handleChange.bind(this)}>
        </Slider>
      </div>
    );
  }
}
const SimpleSlider = withStyles(styles)(_Slider);

class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false
    };
  }

  playPause() {
    if (this.props.playing) {
      return "Pause";
    } else {
      return "Play";
    }
  }

  openLoadModal() {
    this.setState({ modalIsOpen: true });
  }

  onModalSubmit(content) {
    this.props.loadRle(content);
    this.setState({ modalIsOpen: false });
  }

  onModalClose() {
    this.setState({ modalIsOpen: false });
  }

  render() {
    return (
      <div className="panel">
        <AppBar color="primary" position="static">
          <Toolbar variant="dense">
            <Button color="inherit" size="small" onClick={this.props.playPause}>
              {this.playPause()}
            </Button>
            <Button color="inherit" size="small" onClick={this.props.clear}>
              Clear
            </Button>
            <Button color="inherit" size="small" onClick={this.props.step}>
              Step
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={this.openLoadModal.bind(this)}
            >
              Load
            </Button>
            <SimpleSlider label="Speed" max={200} min={10} step={10} baseValue={40} onChange={this.props.updateSpeed}/>
            <SimpleSlider label="CellSize" max={20} min={2} step={1} baseValue={8} onChange={this.props.updateCellSize}/>
            {this.state.modalIsOpen && (
              <LoadModal
                onSubmit={this.onModalSubmit.bind(this)}
                onClose={this.onModalClose.bind(this)}
              />
            )}
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

module.exports = Panel;
