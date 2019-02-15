import React from "react";
import InfoIcon from "@material-ui/icons/Info";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Icon from "@material-ui/core/Icon";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import { withStyles } from "@material-ui/core/styles";
import green from "@material-ui/core/colors/green";

const toastContentStyles = theme => ({
  success: {
    backgroundColor: green[600]
  },
  icon: {
    opacity: 0.9,
    fontSize: 20
  },
  message: {
    display: "flex",
    alignItems: "center"
  }
});

class _ToastContent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { classes, message, onClose } = this.props;

    return (
      <SnackbarContent
        className={classes.success}
        message={
          <span className={classes.message}>
            <Icon className={classes.icon} />
            {message}
          </span>
        }
        action={[
          <IconButton
            key="close"
            color="inherit"
            className={classes.close}
            onClick={onClose}
          >
            <CloseIcon className={classes.icon} />
          </IconButton>
        ]}
      />
    );
  }
}

const ToastContent = withStyles(toastContentStyles)(_ToastContent);

const toastStyles = theme => ({
  margin: {
    margin: theme.spacing.unit
  }
});

class _Toast extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { open, classes, message, onClose } = this.props;
    return (
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        open={open}
        autoHideDuration={3000}
        onClose={onClose}
      >
        <ToastContent
          onClose={onClose}
          className={classes.margin}
          message={message}
        />
      </Snackbar>
    );
  }
}

export default withStyles(toastStyles)(_Toast);
