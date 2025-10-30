require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// We define our routes here!!
app.use('/', indexRouter); // http://localhost:3000/
app.use('/users', usersRouter); // http://localhost:3000/users
app.use('/products', productsRouter); // http://localhost:3000/products

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Check if the request is for an API endpoint
  const isApiRequest = req.path.startsWith('/products') || req.path.startsWith('/users');
  
  if (isApiRequest) {
    // Return JSON error for API endpoints
    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal Server Error',
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    });
  }
  
  // render the error page for non-API requests
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
