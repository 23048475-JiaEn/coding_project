const express = require('express');
const path = require('path');
const mysql = require('mysql2'); 
const app = express();
const multer = require('multer');
const port = 3000;

const storage= multer.diskStorage({
    destination: (req,file,cb) =>{
        cb(null,'public');
    },
    filename: (req,file,cb) =>{
        cb(null, file.originalname);
    }
});
const upload = multer({storage:storage});


const connection = mysql.createConnection({
    host: 'db4free.net',
    user: 'lololking57',
    password: 'Pa$$w0rd',
    database: 'lololking57'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

let globaluserid= null


app.use(express.urlencoded({
    extended:false
}))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

//login page
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/inventory', (req, res) => {
    connection.query('SELECT * FROM inventory WHERE userid = ?', [globaluserid], (error, inventoryResults) => {
        if (error) {
            console.error('Error fetching inventory:', error);
            return res.status(500).send('Error fetching inventory');
        }
        
        res.render('inventory', { globaluserid: globaluserid,
            inventory: inventoryResults });
    });
});

//set login page as default
app.get('/', (req, res) => {
    res.redirect('/login'); // Redirect to login page
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM user WHERE username = ? AND password = ?';
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            // User found, login successful
            const userId = results[0].userid; //saves user's id 
            globaluserid = results[0].userid;
            console.log('User ID:', userId);
            res.redirect('/inventory'); // Render HTML page with data

           
        }
            
        else {
            // login failed
            const errorMessage = 'Login failed please <a href="/">try again.</a> if you dont have a account <a href="/sign-up">sign up now.</a> ';
            res.send(errorMessage);
        }
    });
});

app.post('/sign-up', (req, res) => {
    // Extract account data from the request body
    const { username,password } = req.body;
    const sql = 'INSERT INTO user (username,password) VALUES (?, ?)';
    
    // Insert the new account into the database
    connection.query(sql, [username,password], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding student:", error);
            res.status(500).send('Error adding student');
        } else {
            // Send a success response
            const successful = 'sign up sucessful <a href="/">Login</a>';
            res.send(successful);
            
        }
    });
});
//sign up page
app.get('/sign-up', (req, res) => {
    res.render('sign-up');
});

//add product 
app.post('/addProduct',upload.single('image'), (req, res) => {
    
    const {productname, quantity, price} = req.body;
    let image;
    if (req.file){
        image = req.file.filename;
    }
    else {
        image = null;
    }
    // Extract product data from the request body
    
    console.log('Received product data:', req.body);
    console.log("userid: ",globaluserid) //troubleshooting form 
    const sql = 'INSERT INTO inventory (userid, productname, quantity, price, image) VALUES (?, ?, ?, ?, ?)';
    // Insert the new product into the database
    connection.query(sql, [globaluserid, productname, quantity, price, image], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding product:", error);
            res.status(500).send('Error adding product');
        } else {
            // Send a success response
            res.redirect('/inventory');
        }
    });
});

app.get('/addProduct', (req, res) => {
    res.render('addProduct');
});

app.get('/products/:id', (req, res) => {
    // Extract the product ID from the request parameters
    const productId = req.params.id;

    const sql = 'SELECT * FROM inventory WHERE productid = ?';
    console.log('Product ID:', productId);
    
    // Fetch data from MySQL based on the product ID
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving product by ID');
        }

        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the product data
            res.render('products', { product: results[0] });
        } else {
            // If no product with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Product not found');
        }
    });
});

app.get('/editproduct/:id', (req,res) => {
    const productid = req.params.id;
    const sql = 'SELECT * FROM inventory WHERE productid = ?';
    // Fetch data from MySQL based on the product ID
    connection.query( sql , [productid], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving product by ID');
        }
        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the product data
           
            res.render('editproduct', { product: results[0] });
            console.log(results[0])
        } else {
            // If no product with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Product not found');
        }
    });
});

app.post('/editproduct/:id', upload.single('image'), (req, res) => {
    const productid = req.params.id;
    // Extract product data from the request body
    const { productname, quantity, price } = req.body;
    
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
        
    }
    const sql = 'UPDATE inventory SET productname = ? , quantity = ?, price = ?, image = ? WHERE productid = ?';
    // Insert the new product into the database
    connection.query( sql , [productname, quantity, price, image, productid], (error, results) => {
        console.log(`Executing SQL: ${sql} with values [${productname}, ${quantity}, ${price}, ${image}, ${productid}]`);
    
        if (error) {
            // Handle any error that occurs during the database operation
           
            console.error("Error updating product:", error);
            res.status(500).send('Error updating product');
        } else {
            // Send a success response
            res.redirect('/inventory');
        }
    });
});

app.get('/deleteProduct/:id', (req, res) => {
    const productid = req.params.id;
    const sql = 'DELETE FROM inventory WHERE productid = ?';
    connection.query( sql , [productid], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting product:", error);
            res.status(500).send('Error deleting product');
        } else {
            // Send a success response
            res.redirect('/inventory');
        }
    });
});

app.get('/editaccount/:id', (req,res) => {
    const userid = globaluserid
    const sql = 'SELECT * FROM user WHERE userid = ?';
    // Fetch data from MySQL based on the product ID
    connection.query( sql , [userid], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving product by ID');
        }
        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the product data
           
            res.render('editaccount', { account: results[0] });
            console.log(results[0])
        } else {
            // If no product with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('account not found');
        }
    });
});

app.post('/editaccount/:id', (req, res) => {
    const userid = req.params.id;
    // Extract product data from the request body
    const { username, password } = req.body;
   
    const sql = 'UPDATE user SET username = ? , password = ? WHERE userid = ?';
    // Insert the new product into the database
    connection.query(sql, [username, password, userid], (error, results) => {
        console.log(`Executing SQL: ${sql} with values [${username}, ${password}, ${userid}]`);
    
        if (error) {
            // Handle any error that occurs during the database operation
           
            console.error("Error updating product:", error);
            res.status(500).send('Error updating product');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/deleteaccount/:id', (req, res) => {
    const userid = req.params.id;
    const sql = 'DELETE FROM inventory WHERE userid = ?';
    const sql2 = 'DELETE FROM user WHERE userid = ?';
    connection.query( sql , [userid], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting product:", error);
            res.status(500).send('Error deleting product');
        } else {
            // Send a success response
           console.log("sucessfully deleted inventory")
        }
    });
    connection.query( sql2 , [userid], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting product:", error);
            res.status(500).send('Error deleting product');
        } else {
            // Send a success response
            const deleted = 'Account Deleted back to <a href="/">Login</a>';
            res.send(deleted);
        }
    });
});





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});






