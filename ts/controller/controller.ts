import { connection } from "../database/database";
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

type User = {
  ID: number;
  Email: string;
  Password: string;
  Token: string | null;
  Role: string;
};

const storage = multer.diskStorage({
  destination: "./images",
  filename: (req: any, file: any, cb: any) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
});

async function getUserByEmail(email: string): Promise<User> {
  const db = await connection;
  const [[user], [rows]] = await db.execute(
    "SELECT * FROM Users WHERE email = ?",
    [email]
  );
  return user;
}

async function register(req: any, res: any): Promise<void> {
  try {
    type form = { email: string; password: string; image?: any };
    const { email, password }: form = req.body;
    let image;
    req.file ? (image = req.file.filename) : (image = null);
    const db: any = await connection;
    const hashedPassword: string = await bcrypt.hash(password, 10);
    await db.execute(
      "INSERT INTO Users (Email,Password,Image) VALUES (?,?,?)",
      [email, hashedPassword, image]
    );
    res.status(200).json({ message: "Succesfully signed up" });
  } catch (err) {
    res.status(503).json({ message: `Something went wrong: ${err}` });
  }
}

async function login(req: any, res: any): Promise<void> {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    const user: User = await getUserByEmail(email);
    const result: boolean = await bcrypt.compare(password, user.Password);
    const accesToken = await jwt.sign({ email }, process.env.ACCES_SECRET, {expiresIn: "15m"});
    const refreshToken = await jwt.sign({ email }, process.env.REFRESH_SECRET, {expiresIn: "180d"});
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const db = await connection;
    db.execute(`UPDATE Users SET Token = ? WHERE Email = ?`, [hashedRefreshToken,email]);
    if (result) {
      res.status(200).json({ accesToken, refreshToken });
    }
  } catch (err) {
    res.status(401).json({ message: "Check your email or/and password :(" });
  }
}

async function refreshToken(req: any, res: any): Promise<void> {
  try {
    const token: string = req.body.token;
    const result: any = await jwt.verify(token, process.env.REFRESH_SECRET);
    const user: User = await getUserByEmail(result.email);
    const email: string = user.Email;
    const compare: boolean = await bcrypt.compare(token, user.Token);
    const accesToken: string = await jwt.sign({ email },process.env.ACCES_SECRET,{ expiresIn: "15m" });
    res.status(200).json({ accesToken });
  } catch (err) {
    res.status(401).json({ message: "Try to relog", err });
  }
}

async function getUserInfo(req: any, res: any): Promise<void> {
  try {
    const user: User = await getUserByEmail(req.userEmail);
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
}

async function getCategories(req: any, res: any): Promise<void> {
  try {
    const db = await connection;
    const [categories] = await db.execute("SELECT DISTINCT Category FROM Goods");
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ err });
  }
}

async function getCategory(req: any, res: any): Promise<void> {
  try {
    const db = await connection;
    const params: string = await req.params.category;
    const [category, rows] = await db.execute("SELECT * FROM Goods WHERE Category = ?",[params]);
    res.status(200).json({ category });
  } catch (err) {
    res.status(500).json(err);
  }
}

async function getProductInfo(req: any, res: any): Promise<void> {
  try {
    const db = await connection;
    const params: string = req.params.productID;
    type productType = {
      ID: number;
      Name: string;
      Price: number;
      Category: string;
      Model: any;
      Info: string;
    };
    const infoFromDB = await db.execute("SELECT * FROM Goods WHERE ID = ?", [params]);
    const [[product], rows]: [[productType], any] = infoFromDB;
    res.status(200).json({ product });
  } catch (err) {
    res.status(400).json(err);
  }
}

async function deleteProduct(req: any, res: any): Promise<void> {
  try {
    const ID: number = req.params.ID;
    const db = await connection;
    db.execute("DELETE FROM Goods WHERE ID = ?", [ID]);
    res.status(200).json({ message: `The product with ID: '${ID}', succesfully deleted` });
  } catch (err) {
    res.status(500).json(err);
  }
}

async function postProduct(req: any, res: any): Promise<void> {
  try {
    type product = {
      name: string;
      price: number;
      category: string;
      model: string;
      info: string;
    };
    const { name, price, category, model, info }: product = req.body;
    const images: any = [];
    if (req.files) {
      req.files.forEach((obj: any) => {
        images.push(obj.filename);
      });
    }
    const db = await connection;
    const sql: string ="INSERT INTO Goods (Name,Price,Category,Model,Info,Image) VALUES (?,?,?,?,?,?)";
    await db.execute(sql, [name, price, category, model, info, images]);
    res.status(200).json({ message: "Product succesfully posted" });
  } catch (err) {
    res.status(500).json({ err });
  }
}

async function order(req: any, res: any): Promise<void> {
  try {
    const user: User = await getUserByEmail(req.userEmail);
    const productID: Array<string> = Object.keys(req.body);
    const productQty: Array<number> = Object.values(req.body);
    if (productID.length != productQty.length) {
      throw new Error();
    }
    const db = await connection;
    const result = await getUserOrders(user.ID);
    if (result) {
      await insert(productID, productQty);
      res.status(200).json({message: 'Succes'})
    } else {
      db.execute("INSERT INTO Orders (userID) VALUES (?)", [user.ID]);
      const result = await getUserOrders(user.ID);
      insert(productID, productQty);
      res.status(200).json({message: 'Succes'})
    }
    async function insert(productID: Array<string>,productQty: Array<number>): Promise<void> {
      const sql: string ="INSERT INTO Order_Detail (productID, qty, orderID) VALUES (?,?,?)";
      for (let i = 0; i < productID.length; i++) {
        db.execute(sql, [productID[i], productQty[i], result.orderID]);
      }
    }
    async function getUserOrders(userID: number): Promise<any> {
      const [[result], rows] = await db.execute("SELECT * FROM Orders WHERE userID = ?",[user.ID]);
      return result;
    }
  } catch (err) {
    res.status(501).json(err);
  }
}

const fn = {
  register,
  order,
  postProduct,
  upload,
  login,
  getCategories,
  getUserInfo,
  refreshToken,
  getCategory,
  getProductInfo,
  getUserByEmail,
  deleteProduct,
};
export { fn };
