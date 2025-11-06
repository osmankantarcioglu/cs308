require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var cartRouter = require('./routes/cart');
var adminRouter = require('./routes/admin');
var categoriesRouter = require('./routes/categories');
var authRouter = require('./routes/auth');
var supportRouter = require('./routes/support');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Enable CORS for all routes with credentials
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(path.join(__dirname, 'uploads')));


// We define our routes here!!
app.use('/', indexRouter); // http://localhost:3000/
app.use('/auth', authRouter); // http://localhost:3000/auth
app.use('/users', usersRouter); // http://localhost:3000/users
app.use('/products', productsRouter); // http://localhost:3000/products
app.use('/cart', cartRouter); // http://localhost:3000/cart
app.use('/admin', adminRouter); // http://localhost:3000/admin
app.use('/categories', categoriesRouter); // http://localhost:3000/categories
app.use('/support', supportRouter); // http://localhost:3000/support

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Check if the request is for an API endpoint
  const isApiRequest = req.path.startsWith('/products') || req.path.startsWith('/users') || req.path.startsWith('/cart') || req.path.startsWith('/admin') || req.path.startsWith('/auth');
  
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
