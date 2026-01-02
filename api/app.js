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
var ordersRouter = require('./routes/orders');
var adminRouter = require('./routes/admin');
var categoriesRouter = require('./routes/categories');
var authRouter = require('./routes/auth');
var deliveriesRouter = require('./routes/deliveries');
var reviewsRouter = require('./routes/reviews');
var chatsRouter = require('./routes/chats');
var discountsRouter = require('./routes/discounts');
var salesRouter = require('./routes/sales');
var couponsRouter = require("./routes/coupons");


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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// We define our routes here!!
app.use('/', indexRouter); // http://localhost:3000/
app.use('/auth', authRouter); // http://localhost:3000/auth
app.use('/users', usersRouter); // http://localhost:3000/users
app.use('/products', productsRouter); // http://localhost:3000/products
app.use('/cart', cartRouter); // http://localhost:3000/cart
app.use('/orders', ordersRouter); // http://localhost:3000/orders
app.use('/admin', adminRouter); // http://localhost:3000/admin
app.use('/categories', categoriesRouter); // http://localhost:3000/categories
app.use('/deliveries', deliveriesRouter); // http://localhost:3000/deliveries
app.use('/reviews', reviewsRouter); // http://localhost:3000/reviews
app.use('/chats', chatsRouter); // http://localhost:3000/chats
app.use('/discounts', discountsRouter); // http://localhost:3000/discounts
app.use('/sales', salesRouter); // http://localhost:3000/sales
app.use("/coupons", couponsRouter); // http://localhost:3000/coupons


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // For API routes, return JSON 404
  if (req.path.startsWith('/products') || 
      req.path.startsWith('/users') || 
      req.path.startsWith('/cart') || 
      req.path.startsWith('/orders') || 
      req.path.startsWith('/admin') || 
      req.path.startsWith('/auth') ||
      req.path.startsWith('/categories') ||
      req.path.startsWith('/deliveries') ||
      req.path.startsWith('/reviews') ||
      req.path.startsWith('/chats') ||
      req.path.startsWith('/discounts') ||
      req.path.startsWith('/sales')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  }
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Check if the request is for an API endpoint
  const isApiRequest = req.path.startsWith('/products') || 
                       req.path.startsWith('/users') || 
                       req.path.startsWith('/cart') || 
                       req.path.startsWith('/orders') || 
                       req.path.startsWith('/admin') || 
                       req.path.startsWith('/auth') ||
                       req.path.startsWith('/categories') ||
                       req.path.startsWith('/deliveries') ||
                       req.path.startsWith('/reviews') ||
                       req.path.startsWith('/chats') ||
                       req.path.startsWith('/discounts') ||
                       req.path.startsWith('/sales');
  
  if (isApiRequest) {
    // Return JSON error for API endpoints
    const statusCode = err.statusCode || err.status || 500;
    console.error('API Error:', err.message);
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
